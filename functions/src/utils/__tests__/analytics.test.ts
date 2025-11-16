import * as admin from 'firebase-admin';
import dayjs from 'dayjs';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateCompletionRate,
  calculateAnalytics,
} from '../analytics';

// Mock Firestore Timestamp
const createTimestamp = (dateString: string): admin.firestore.Timestamp => {
  const date = dayjs(dateString).toDate();
  return admin.firestore.Timestamp.fromDate(date);
};

describe('Analytics Calculations', () => {
  describe('calculateCurrentStreak', () => {
    it('should return 0 for no checks', () => {
      const result = calculateCurrentStreak([], '2025-11-15');
      expect(result).toBe(0);
    });

    it('should calculate streak for consecutive days from today', () => {
      const checks = [
        { dateKey: '2025-11-15', completedAt: createTimestamp('2025-11-15') },
        { dateKey: '2025-11-14', completedAt: createTimestamp('2025-11-14') },
        { dateKey: '2025-11-13', completedAt: createTimestamp('2025-11-13') },
      ];
      const result = calculateCurrentStreak(checks, '2025-11-15');
      expect(result).toBe(3);
    });

    it('should stop counting at first gap', () => {
      const checks = [
        { dateKey: '2025-11-15', completedAt: createTimestamp('2025-11-15') },
        { dateKey: '2025-11-14', completedAt: createTimestamp('2025-11-14') },
        { dateKey: '2025-11-12', completedAt: createTimestamp('2025-11-12') }, // Gap on 11-13
        { dateKey: '2025-11-11', completedAt: createTimestamp('2025-11-11') },
      ];
      const result = calculateCurrentStreak(checks, '2025-11-15');
      expect(result).toBe(2);
    });

    it('should return 0 if today is not checked', () => {
      const checks = [
        { dateKey: '2025-11-14', completedAt: createTimestamp('2025-11-14') },
        { dateKey: '2025-11-13', completedAt: createTimestamp('2025-11-13') },
      ];
      const result = calculateCurrentStreak(checks, '2025-11-15');
      expect(result).toBe(0);
    });

    it('should handle single check on today', () => {
      const checks = [
        { dateKey: '2025-11-15', completedAt: createTimestamp('2025-11-15') },
      ];
      const result = calculateCurrentStreak(checks, '2025-11-15');
      expect(result).toBe(1);
    });
  });

  describe('calculateLongestStreak', () => {
    it('should return 0 for no checks', () => {
      const result = calculateLongestStreak([]);
      expect(result).toBe(0);
    });

    it('should return 1 for single check', () => {
      const checks = [
        { dateKey: '2025-11-15', completedAt: createTimestamp('2025-11-15') },
      ];
      const result = calculateLongestStreak(checks);
      expect(result).toBe(1);
    });

    it('should calculate longest consecutive sequence', () => {
      const checks = [
        { dateKey: '2025-11-01', completedAt: createTimestamp('2025-11-01') },
        { dateKey: '2025-11-02', completedAt: createTimestamp('2025-11-02') },
        { dateKey: '2025-11-03', completedAt: createTimestamp('2025-11-03') },
        { dateKey: '2025-11-05', completedAt: createTimestamp('2025-11-05') },
        { dateKey: '2025-11-06', completedAt: createTimestamp('2025-11-06') },
        { dateKey: '2025-11-07', completedAt: createTimestamp('2025-11-07') },
        { dateKey: '2025-11-08', completedAt: createTimestamp('2025-11-08') },
      ];
      const result = calculateLongestStreak(checks);
      expect(result).toBe(4); // Nov 5-8
    });

    it('should handle multiple gaps', () => {
      const checks = [
        { dateKey: '2025-11-01', completedAt: createTimestamp('2025-11-01') },
        { dateKey: '2025-11-03', completedAt: createTimestamp('2025-11-03') },
        { dateKey: '2025-11-05', completedAt: createTimestamp('2025-11-05') },
        { dateKey: '2025-11-07', completedAt: createTimestamp('2025-11-07') },
      ];
      const result = calculateLongestStreak(checks);
      expect(result).toBe(1);
    });

    it('should handle all consecutive days', () => {
      const checks = [
        { dateKey: '2025-11-10', completedAt: createTimestamp('2025-11-10') },
        { dateKey: '2025-11-11', completedAt: createTimestamp('2025-11-11') },
        { dateKey: '2025-11-12', completedAt: createTimestamp('2025-11-12') },
        { dateKey: '2025-11-13', completedAt: createTimestamp('2025-11-13') },
        { dateKey: '2025-11-14', completedAt: createTimestamp('2025-11-14') },
      ];
      const result = calculateLongestStreak(checks);
      expect(result).toBe(5);
    });
  });

  describe('calculateCompletionRate', () => {
    it('should calculate correct percentage', () => {
      const checks = [
        { dateKey: '2025-11-01', completedAt: createTimestamp('2025-11-01') },
        { dateKey: '2025-11-02', completedAt: createTimestamp('2025-11-02') },
        { dateKey: '2025-11-03', completedAt: createTimestamp('2025-11-03') },
      ];
      const startDate = createTimestamp('2025-11-01');
      const today = '2025-11-10'; // 10 days total
      
      const result = calculateCompletionRate(checks, startDate, today);
      expect(result).toBe(30); // 3/10 = 30%
    });

    it('should return 0 for no checks', () => {
      const startDate = createTimestamp('2025-11-01');
      const today = '2025-11-10';
      
      const result = calculateCompletionRate([], startDate, today);
      expect(result).toBe(0);
    });

    it('should return 100 for all days completed', () => {
      const checks = [
        { dateKey: '2025-11-01', completedAt: createTimestamp('2025-11-01') },
        { dateKey: '2025-11-02', completedAt: createTimestamp('2025-11-02') },
        { dateKey: '2025-11-03', completedAt: createTimestamp('2025-11-03') },
      ];
      const startDate = createTimestamp('2025-11-01');
      const today = '2025-11-03';
      
      const result = calculateCompletionRate(checks, startDate, today);
      expect(result).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const checks = [
        { dateKey: '2025-11-01', completedAt: createTimestamp('2025-11-01') },
      ];
      const startDate = createTimestamp('2025-11-01');
      const today = '2025-11-03'; // 3 days total
      
      const result = calculateCompletionRate(checks, startDate, today);
      expect(result).toBe(33.33); // 1/3 = 33.33%
    });
  });

  describe('calculateAnalytics', () => {
    it('should calculate all metrics correctly', () => {
      const checks = [
        { dateKey: '2025-11-13', completedAt: createTimestamp('2025-11-13') },
        { dateKey: '2025-11-14', completedAt: createTimestamp('2025-11-14') },
        { dateKey: '2025-11-15', completedAt: createTimestamp('2025-11-15') },
      ];
      const startDate = createTimestamp('2025-11-01');
      
      // Use real dayjs - tests will use current date
      const result = calculateAnalytics(checks, startDate);
      
      // Verify structure and types
      expect(result).toHaveProperty('currentStreak');
      expect(result).toHaveProperty('longestStreak');
      expect(result).toHaveProperty('completedDays');
      expect(result).toHaveProperty('totalDays');
      expect(result).toHaveProperty('completionRate');
      expect(result.longestStreak).toBe(3);
      expect(result.completedDays).toBe(3);
      expect(typeof result.currentStreak).toBe('number');
      expect(typeof result.completionRate).toBe('number');
    });

    it('should handle first check-in', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const checks = [
        { dateKey: today, completedAt: createTimestamp(today) },
      ];
      const startDate = createTimestamp(today);
      
      const result = calculateAnalytics(checks, startDate);
      
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.completedDays).toBe(1);
      expect(result.totalDays).toBe(1);
      expect(result.completionRate).toBe(100);
    });

    it('should handle no checks', () => {
      const startDate = createTimestamp('2025-11-01');
      
      const result = calculateAnalytics([], startDate);
      
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.completedDays).toBe(0);
      expect(result.totalDays).toBeGreaterThan(0);
      expect(result.completionRate).toBe(0);
    });
  });
});
