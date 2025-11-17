import { collection, getDocs, doc, setDoc, Timestamp, query } from 'firebase/firestore'
import { db } from '../config/firebase'
import dayjs from 'dayjs'

export interface CheckIn {
  dateKey: string
  completedAt: Timestamp
  habitId: string
  status?: 'done' | 'not_done' // Optional for backward compatibility
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
 * Calculate analytics for a habit based on all check-ins
 */
export async function calculateAnalytics(
  userId: string,
  habitId: string,
  habitStartDate: Timestamp
): Promise<Analytics> {
  // Fetch all check-ins for this habit
  const checksRef = collection(db, 'users', userId, 'habits', habitId, 'checks')
  const checksQuery = query(checksRef)
  const snapshot = await getDocs(checksQuery)

  const checks: CheckIn[] = []
  snapshot.forEach((doc) => {
    checks.push(doc.data() as CheckIn)
  })

  // Sort checks by date
  const sortedChecks = checks.sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  // Filter only 'done' checks (backward compatible: no status field = done)
  const doneChecks = sortedChecks.filter(check => !check.status || check.status === 'done')

  // Calculate total days since habit started
  const startDate = dayjs(habitStartDate.toDate())
  const today = dayjs()
  const totalDays = today.diff(startDate, 'day') + 1

  // Calculate completed days (only count 'done' status)
  const completedDays = doneChecks.length

  // Calculate completion rate
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

  // Calculate current streak with new rules:
  // - Count backward from today
  // - Only count 'done' days (add to streak)
  // - Skip days don't break streak but don't count
  // - 'not_done' breaks the streak immediately
  let currentStreak = 0
  const todayKey = today.format('YYYY-MM-DD')
  const todayCheck = sortedChecks.find(c => c.dateKey === todayKey)
  
  // If today is marked as 'not_done', streak is 0
  if (todayCheck && todayCheck.status === 'not_done') {
    currentStreak = 0
  } else {
    // Count 'done' days backward from today until we hit a 'not_done'
    let checkDate = today
    
    while (checkDate.isAfter(startDate, 'day') || checkDate.isSame(startDate, 'day')) {
      const dateKey = checkDate.format('YYYY-MM-DD')
      const check = sortedChecks.find((c) => c.dateKey === dateKey)

      if (check && check.status === 'not_done') {
        // 'not_done' breaks the streak - stop counting
        break
      } else if (check && (!check.status || check.status === 'done')) {
        // Found a 'done' day - count it
        currentStreak++
      }
      // No check (skip) - continue to previous day without breaking or counting
      
      checkDate = checkDate.subtract(1, 'day')
    }
  }

  // Calculate longest streak: largest interval between two 'not_done' marks
  // Skip days don't break streaks, only 'not_done' does
  let longestStreak = 0
  let tempStreak = 0

  // Iterate through all days from start to today
  let currentDate = startDate
  while (currentDate.isBefore(today) || currentDate.isSame(today, 'day')) {
    const dateKey = currentDate.format('YYYY-MM-DD')
    const check = sortedChecks.find((c) => c.dateKey === dateKey)

    if (check && (!check.status || check.status === 'done')) {
      // Found a 'done' day - increment streak
      tempStreak++
    } else if (check && check.status === 'not_done') {
      // 'not_done' breaks the streak - save and reset
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
    }
    // No check (skip) - continue without breaking or incrementing

    currentDate = currentDate.add(1, 'day')
  }
  // Don't forget to check the final streak
  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    currentStreak,
    longestStreak,
    completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
    totalDays,
    completedDays,
    lastUpdated: Timestamp.now(),
  }
}

/**
 * Update analytics document for a habit
 */
export async function updateHabitAnalytics(
  userId: string,
  habitId: string,
  habitStartDate: Timestamp
): Promise<void> {
  const analytics = await calculateAnalytics(userId, habitId, habitStartDate)

  const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'analytics', 'summary')
  await setDoc(analyticsRef, analytics)
}
