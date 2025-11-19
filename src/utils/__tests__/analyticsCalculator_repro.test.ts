import { describe, it, expect } from 'vitest'
import { calculateAnalyticsLocal, CheckIn } from '../analyticsCalculator'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

// Mock Timestamp
const mockTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  return Timestamp.fromDate(date)
}

describe('calculateAnalyticsLocal Streak Calculation', () => {
  it('should break streak on missing days (Reproduction)', () => {
    const startDate = mockTimestamp('2023-01-01')
    
    // Case: Done on Jan 1, Missing on Jan 2, Done on Jan 3 (Today)
    // Expected: Streak should be 1 (only today)
    // Current behavior (suspected): Streak is 2 (Jan 1 + Jan 3)
    
    const checks: CheckIn[] = [
      {
        dateKey: '2023-01-01',
        completedAt: mockTimestamp('2023-01-01T10:00:00Z'),
        status: 'done'
      },
      // Jan 2 is missing
      {
        dateKey: '2023-01-03',
        completedAt: mockTimestamp('2023-01-03T10:00:00Z'),
        status: 'done'
      }
    ]

    // We need to mock "today" as Jan 3 for this test to work deterministically.
    // However, calculateAnalyticsLocal uses dayjs() internally for "today".
    // We might need to modify the function to accept "today" or mock system time.
    // For now, let's just verify the logic by reading the code or assuming we can mock system time.
    // Since we can't easily mock system time without setup, let's rely on the code analysis which strongly suggests the bug.
    
    // Wait, I can't easily run this test if it relies on `dayjs()` being "today".
    // I should modify `calculateAnalyticsLocal` to accept an optional `referenceDate` for testing.
  })
})
