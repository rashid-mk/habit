import {
  sanitizeText,
  validateHabitName,
  validateFrequency,
  validateReminderTime,
  validateHabitId,
  validateDuration,
  validateDateKey,
  validateUserId,
} from '../validation';
import * as functions from 'firebase-functions';

describe('Validation Utilities', () => {
  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should remove control characters', () => {
      const textWithControl = 'hello\x00\x08world';
      expect(sanitizeText(textWithControl)).toBe('helloworld');
    });

    it('should remove zero-width characters', () => {
      const textWithZeroWidth = 'hello\u200Bworld';
      expect(sanitizeText(textWithZeroWidth)).toBe('helloworld');
    });

    it('should normalize unicode', () => {
      const text = 'café';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe('café');
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeText(123 as any)).toThrow();
    });
  });

  describe('validateHabitName', () => {
    it('should accept valid habit name', () => {
      expect(validateHabitName('Morning Exercise')).toBe('Morning Exercise');
    });

    it('should sanitize and trim habit name', () => {
      expect(validateHabitName('  Exercise  ')).toBe('Exercise');
    });

    it('should throw error for empty habit name', () => {
      expect(() => validateHabitName('')).toThrow(functions.https.HttpsError);
    });

    it('should throw error for habit name too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => validateHabitName(longName)).toThrow(functions.https.HttpsError);
    });

    it('should throw error for non-string input', () => {
      expect(() => validateHabitName(null as any)).toThrow(functions.https.HttpsError);
    });
  });

  describe('validateFrequency', () => {
    it('should accept "daily" frequency', () => {
      expect(validateFrequency('daily')).toBe('daily');
    });

    it('should accept valid weekday array', () => {
      const frequency = ['monday', 'wednesday', 'friday'];
      expect(validateFrequency(frequency)).toEqual(['monday', 'wednesday', 'friday']);
    });

    it('should normalize weekday names to lowercase', () => {
      const frequency = ['Monday', 'WEDNESDAY', 'Friday'];
      expect(validateFrequency(frequency)).toEqual(['monday', 'wednesday', 'friday']);
    });

    it('should throw error for invalid weekday', () => {
      const frequency = ['monday', 'invalidday'];
      expect(() => validateFrequency(frequency)).toThrow(functions.https.HttpsError);
    });

    it('should throw error for non-array, non-daily frequency', () => {
      expect(() => validateFrequency('weekly' as any)).toThrow(functions.https.HttpsError);
    });

    it('should throw error for missing frequency', () => {
      expect(() => validateFrequency(null as any)).toThrow(functions.https.HttpsError);
    });
  });

  describe('validateReminderTime', () => {
    it('should accept valid time format', () => {
      expect(validateReminderTime('09:30')).toBe('09:30');
      expect(validateReminderTime('23:59')).toBe('23:59');
      expect(validateReminderTime('00:00')).toBe('00:00');
    });

    it('should return null for undefined or null input', () => {
      expect(validateReminderTime(undefined)).toBeNull();
      expect(validateReminderTime(null)).toBeNull();
    });

    it('should throw error for invalid time format', () => {
      expect(() => validateReminderTime('25:00')).toThrow(functions.https.HttpsError);
      expect(() => validateReminderTime('12:60')).toThrow(functions.https.HttpsError);
      expect(() => validateReminderTime('invalid')).toThrow(functions.https.HttpsError);
    });

    it('should throw error for non-string input', () => {
      expect(() => validateReminderTime(123 as any)).toThrow(functions.https.HttpsError);
    });
  });

  describe('validateHabitId', () => {
    it('should accept valid habit ID', () => {
      expect(validateHabitId('abc123')).toBe('abc123');
      expect(validateHabitId('habit_123')).toBe('habit_123');
      expect(validateHabitId('habit-123')).toBe('habit-123');
    });

    it('should throw error for invalid characters', () => {
      expect(() => validateHabitId('habit@123')).toThrow(functions.https.HttpsError);
      expect(() => validateHabitId('habit 123')).toThrow(functions.https.HttpsError);
    });

    it('should throw error for empty habit ID', () => {
      expect(() => validateHabitId('')).toThrow(functions.https.HttpsError);
    });

    it('should throw error for too long habit ID', () => {
      const longId = 'a'.repeat(1501);
      expect(() => validateHabitId(longId)).toThrow(functions.https.HttpsError);
    });

    it('should throw error for non-string input', () => {
      expect(() => validateHabitId(null as any)).toThrow(functions.https.HttpsError);
    });
  });

  describe('validateDuration', () => {
    it('should return default duration when undefined', () => {
      expect(validateDuration(undefined)).toBe(30);
    });

    it('should accept valid duration', () => {
      expect(validateDuration(30)).toBe(30);
      expect(validateDuration(1)).toBe(1);
      expect(validateDuration(365)).toBe(365);
    });

    it('should throw error for non-integer', () => {
      expect(() => validateDuration(30.5)).toThrow(functions.https.HttpsError);
      expect(() => validateDuration('30' as any)).toThrow(functions.https.HttpsError);
    });

    it('should throw error for out of range duration', () => {
      expect(() => validateDuration(0)).toThrow(functions.https.HttpsError);
      expect(() => validateDuration(366)).toThrow(functions.https.HttpsError);
    });
  });

  describe('validateDateKey', () => {
    it('should accept valid date key', () => {
      expect(validateDateKey('2025-11-15')).toBe('2025-11-15');
      expect(validateDateKey('2024-01-01')).toBe('2024-01-01');
      expect(validateDateKey('2025-12-31')).toBe('2025-12-31');
    });

    it('should throw error for invalid format', () => {
      expect(() => validateDateKey('2025/11/15')).toThrow('Date key must be in YYYY-MM-DD format');
      expect(() => validateDateKey('15-11-2025')).toThrow('Date key must be in YYYY-MM-DD format');
      expect(() => validateDateKey('2025-11-15T00:00:00')).toThrow('Date key must be in YYYY-MM-DD format');
    });

    it('should throw error for invalid date', () => {
      expect(() => validateDateKey('2025-13-01')).toThrow('Invalid date');
      expect(() => validateDateKey('2025-02-30')).toThrow('Invalid date');
    });

    it('should throw error for empty or non-string input', () => {
      expect(() => validateDateKey('')).toThrow('Date key is required and must be a string');
      expect(() => validateDateKey(null as any)).toThrow('Date key is required and must be a string');
      expect(() => validateDateKey(123 as any)).toThrow('Date key is required and must be a string');
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      expect(validateUserId('abc123XYZ')).toBe('abc123XYZ');
      expect(validateUserId('1234567890')).toBe('1234567890');
    });

    it('should throw error for invalid characters', () => {
      expect(() => validateUserId('user@123')).toThrow('Invalid user ID format');
      expect(() => validateUserId('user-123')).toThrow('Invalid user ID format');
      expect(() => validateUserId('user_123')).toThrow('Invalid user ID format');
    });

    it('should throw error for invalid length', () => {
      expect(() => validateUserId('')).toThrow('User ID is required and must be a string');
      expect(() => validateUserId('a'.repeat(129))).toThrow('Invalid user ID length');
    });

    it('should throw error for non-string input', () => {
      expect(() => validateUserId(null as any)).toThrow('User ID is required and must be a string');
      expect(() => validateUserId(123 as any)).toThrow('User ID is required and must be a string');
    });
  });
});
