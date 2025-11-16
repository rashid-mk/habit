import * as admin from 'firebase-admin';
import dayjs from 'dayjs';

interface CheckData {
  dateKey: string;
  completedAt: admin.firestore.Timestamp;
}

interface AnalyticsResult {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalDays: number;
  completedDays: number;
}

/**
 * Calculate current streak (consecutive days from today backward)
 */
export function calculateCurrentStreak(checks: CheckData[], today: string): number {
  if (checks.length === 0) return 0;

  const checksMap = new Set(checks.map(c => c.dateKey));
  let currentStreak = 0;
  let checkDate = today;

  while (checksMap.has(checkDate)) {
    currentStreak++;
    checkDate = dayjs(checkDate).subtract(1, 'day').format('YYYY-MM-DD');
  }

  return currentStreak;
}

/**
 * Calculate longest streak (max consecutive days in history)
 */
export function calculateLongestStreak(checks: CheckData[]): number {
  if (checks.length === 0) return 0;
  if (checks.length === 1) return 1;

  // Sort checks by date
  const sortedDates = checks
    .map(c => c.dateKey)
    .sort((a, b) => a.localeCompare(b));

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = dayjs(sortedDates[i - 1]);
    const currDate = dayjs(sortedDates[i]);
    const daysDiff = currDate.diff(prevDate, 'day');

    if (daysDiff === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap in streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Calculate completion rate (completed days / total days * 100)
 */
export function calculateCompletionRate(
  checks: CheckData[],
  habitStartDate: admin.firestore.Timestamp,
  today: string
): number {
  const startDate = dayjs(habitStartDate.toDate()).format('YYYY-MM-DD');
  const totalDays = dayjs(today).diff(dayjs(startDate), 'day') + 1;
  
  if (totalDays <= 0) return 0;

  const completedDays = checks.length;
  const completionRate = (completedDays / totalDays) * 100;

  return Math.round(completionRate * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate all analytics for a habit
 */
export function calculateAnalytics(
  checks: CheckData[],
  habitStartDate: admin.firestore.Timestamp
): AnalyticsResult {
  const today = dayjs().format('YYYY-MM-DD');
  
  const currentStreak = calculateCurrentStreak(checks, today);
  const longestStreak = calculateLongestStreak(checks);
  const completionRate = calculateCompletionRate(checks, habitStartDate, today);
  
  const startDate = dayjs(habitStartDate.toDate()).format('YYYY-MM-DD');
  const totalDays = dayjs(today).diff(dayjs(startDate), 'day') + 1;
  const completedDays = checks.length;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalDays: Math.max(totalDays, 0),
    completedDays,
  };
}
