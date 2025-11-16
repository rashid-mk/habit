import { collection, getDocs, doc, setDoc, Timestamp, query } from 'firebase/firestore'
import { db } from '../config/firebase'
import dayjs from 'dayjs'

export interface CheckIn {
  dateKey: string
  completedAt: Timestamp
  habitId: string
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

  // Calculate total days since habit started
  const startDate = dayjs(habitStartDate.toDate())
  const today = dayjs()
  const totalDays = today.diff(startDate, 'day') + 1

  // Calculate completed days
  const completedDays = sortedChecks.length

  // Calculate completion rate
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

  // Calculate current streak
  let currentStreak = 0
  const todayKey = today.format('YYYY-MM-DD')
  const yesterdayKey = today.subtract(1, 'day').format('YYYY-MM-DD')

  // Check if there's a check-in for today or yesterday to start counting streak
  const hasRecentCheckIn = sortedChecks.some(
    (check) => check.dateKey === todayKey || check.dateKey === yesterdayKey
  )

  if (hasRecentCheckIn) {
    let checkDate = today
    while (true) {
      const dateKey = checkDate.format('YYYY-MM-DD')
      const hasCheckIn = sortedChecks.some((check) => check.dateKey === dateKey)

      if (hasCheckIn) {
        currentStreak++
        checkDate = checkDate.subtract(1, 'day')
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: dayjs.Dayjs | null = null

  for (const check of sortedChecks) {
    const checkDate = dayjs(check.dateKey)

    if (lastDate === null) {
      tempStreak = 1
    } else {
      const daysDiff = checkDate.diff(lastDate, 'day')
      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    lastDate = checkDate
  }
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
