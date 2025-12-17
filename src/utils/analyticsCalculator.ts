import { collection, getDocs, doc, setDoc, Timestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

// If you want consistent timezone calculations (recommended)
const APP_TZ = 'Asia/Kolkata' // change if needed

export interface CheckIn {
  dateKey: string
  completedAt: Timestamp
  habitId?: string
  status?: 'done' | 'not_done' // Optional for backward compatibility
  progressValue?: number // For count/time habits
  isCompleted?: boolean // Whether target was reached
}

export interface Analytics {
  currentStreak: number
  longestStreak: number
  completionRate: number
  totalDays: number
  completedDays: number
  lastUpdated: Timestamp
}

/**
 * Normalize checks into one entry per dateKey.
 * Rule used here:
 *  - If any check for that date has status === 'not_done' -> that date is 'not_done'
 *  - Else if any check has status 'done' or no status -> date is 'done' and we keep latest completedAt
 */
function reduceChecksToSinglePerDay(checks: CheckIn[]) {
  const map = new Map<string, CheckIn>()

  for (const c of checks) {
    const existing = map.get(c.dateKey)
    if (!existing) {
      map.set(c.dateKey, { ...c })
      continue
    }

    // If either is not_done, set not_done but prefer the latest completedAt if any
    if (existing.status === 'not_done' || c.status === 'not_done') {
      map.set(c.dateKey, {
        dateKey: c.dateKey,
        completedAt: (c.completedAt && (!existing.completedAt || (c.completedAt as Timestamp).toMillis() > (existing.completedAt as Timestamp).toMillis())) ? c.completedAt : existing.completedAt,
        habitId: c.habitId || existing.habitId,
        status: 'not_done' as 'not_done',
      })
      continue
    }

    // Both are done/undefined -> keep the one with later completedAt (safer)
    if (c.completedAt && existing.completedAt) {
      const existingTs = (existing.completedAt as Timestamp).toMillis()
      const newTs = (c.completedAt as Timestamp).toMillis()
      if (newTs > existingTs) map.set(c.dateKey, { ...c })
    } else {
      map.set(c.dateKey, { ...existing, ...c })
    }
  }

  return map // Map<dateKey, CheckIn>
}


/**
 * Calculate analytics from checks array (no Firestore fetch - instant!)
 * Use this for optimistic updates in the UI
 * @param checks - Array of check-in records
 * @param habitStartDate - When the habit started
 * @param habitFrequency - Frequency of the habit (daily or specific days)
 */
export function calculateAnalyticsLocal(
  checks: CheckIn[],
  habitStartDate: Timestamp
): Analytics
export function calculateAnalyticsLocal(
  checks: CheckIn[],
  habitStartDate: Timestamp,
  habitFrequency?: 'daily' | string[]
): Analytics
export function calculateAnalyticsLocal(
  checks: CheckIn[],
  habitStartDate: Timestamp,
  habitFrequency: 'daily' | string[] = 'daily'
): Analytics {
  if (!habitStartDate) {
    throw new Error('habitStartDate is required')
  }

  // Reduce multiple docs per day to a single day's canonical check
  const checkMap = reduceChecksToSinglePerDay(checks)

  // Dates in app timezone
  const startDate = dayjs(habitStartDate.toDate()).tz(APP_TZ).startOf('day')
  const today = dayjs().tz(APP_TZ).startOf('day')

  // If startDate is after today, treat totalDays as 0 (or 1 if you prefer)
  const totalDays = startDate.isAfter(today) ? 0 : today.diff(startDate, 'day') + 1

  // Completed days: count of entries in checkMap whose status is done (or no status)
  // For count/time habits, use isCompleted field if available
  let completedDays = 0
  for (const [, c] of checkMap) {
    // If isCompleted is explicitly set, use that (for count/time habits)
    if (c.isCompleted !== undefined) {
      if (c.isCompleted) completedDays++
    } else {
      // Fall back to status check for simple habits and backward compatibility
      if (!c.status || c.status === 'done') completedDays++
    }
  }

  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

  // Helper function to check if a day is active based on habit frequency
  const isActiveDayForHabit = (date: dayjs.Dayjs): boolean => {
    if (!habitFrequency || habitFrequency === 'daily') return true
    const dayName = date.format('dddd').toLowerCase()
    return habitFrequency.includes(dayName)
  }

  // Compute current streak:
  // - Count all adjacent 'done' days working backward from today
  // - 'not_done' on an active day breaks the streak (sets it to 0)
  // - Missing/skipped days on active days break the streak
  // - Inactive days (not in frequency) are ignored completely
  // - The streak includes today if today is 'done'
  let currentStreak = 0
  const todayKey = today.format('YYYY-MM-DD')
  const todayCheck = checkMap.get(todayKey)
  const isTodayActive = isActiveDayForHabit(today)
  
  // If today is an active day and explicitly marked as not_done, streak is 0
  if (isTodayActive && todayCheck && todayCheck.status === 'not_done') {
    currentStreak = 0
  } else {
    // Walk backward from today
    // Count all 'done' days on active days until we hit a 'not_done' or missing check on an active day
    let cursor = today.clone()
    let streakBroken = false
    
    while ((cursor.isAfter(startDate) || cursor.isSame(startDate, 'day')) && !streakBroken) {
      const key = cursor.format('YYYY-MM-DD')
      const check = checkMap.get(key)
      const isActiveDay = isActiveDayForHabit(cursor)
      
      if (!isActiveDay) {
        // Skip inactive days - they don't affect the streak
        cursor = cursor.subtract(1, 'day')
        continue
      }
      
      // This is an active day
      // For count/time habits, check isCompleted field
      const isDone = check?.isCompleted !== undefined 
        ? check.isCompleted 
        : (check && (!check.status || check.status === 'done'))
      
      if (check && check.status === 'not_done' && !isDone) {
        // Explicit not_done on active day breaks the streak
        streakBroken = true
      } else if (isDone) {
        // Count this done day
        currentStreak++
      } else {
        // No check on an active day - breaks the streak
        streakBroken = true
      }
      
      cursor = cursor.subtract(1, 'day')
    }
  }

  // Compute longest streak (only 'not_done' or missing check on active days breaks)
  let longestStreak = 0
  let running = 0
  let cursorDate = startDate.clone()
  while (cursorDate.isBefore(today) || cursorDate.isSame(today, 'day')) {
    const key = cursorDate.format('YYYY-MM-DD')
    const check = checkMap.get(key)
    const isActiveDay = isActiveDayForHabit(cursorDate)

    if (!isActiveDay) {
      // Skip inactive days - they don't affect the streak
      cursorDate = cursorDate.add(1, 'day')
      continue
    }

    // This is an active day
    // For count/time habits, check isCompleted field
    const isDone = check?.isCompleted !== undefined 
      ? check.isCompleted 
      : (check && (!check.status || check.status === 'done'))
    
    if (isDone) {
      running++
    } else {
      // Either not_done or missing check on active day - breaks streak
      longestStreak = Math.max(longestStreak, running)
      running = 0
    }
    
    cursorDate = cursorDate.add(1, 'day')
  }
  longestStreak = Math.max(longestStreak, running)

  return {
    currentStreak,
    longestStreak,
    completionRate: Math.round(completionRate * 10) / 10,
    totalDays,
    completedDays,
    lastUpdated: Timestamp.now(),
  }
}

export async function calculateAnalytics(
  userId: string,
  habitId: string,
  habitStartDate: Timestamp
): Promise<Analytics> {
  // Defensive: start date provided?
  if (!habitStartDate) {
    throw new Error('habitStartDate is required')
  }

  // Use Firestore query ordered by dateKey (client-side sort unnecessary)
  const checksRef = collection(db, 'users', userId, 'habits', habitId, 'checks')
  const checksQuery = query(checksRef, orderBy('dateKey'))
  const snapshot = await getDocs(checksQuery)

  const rawChecks: CheckIn[] = []
  snapshot.forEach((d) => {
    rawChecks.push(d.data() as CheckIn)
  })

  // Use the local calculation function
  return calculateAnalyticsLocal(rawChecks, habitStartDate)
}

export async function updateHabitAnalytics(
  userId: string,
  habitId: string,
  habitStartDate: Timestamp
): Promise<void> {
  const analytics = await calculateAnalytics(userId, habitId, habitStartDate)
  const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'analytics', 'summary')
  // use merge if you want to preserve other fields present in analytics doc
  await setDoc(analyticsRef, analytics, { merge: true })
}
