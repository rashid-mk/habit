import * as functions from 'firebase-functions';

/**
 * Sanitize user-generated text content
 * Removes potentially harmful characters and trims whitespace
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Text must be a string'
    );
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize unicode
  sanitized = sanitized.normalize('NFC');

  return sanitized;
}

/**
 * Validate habit name
 */
export function validateHabitName(habitName: string): string {
  if (!habitName || typeof habitName !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Habit name is required and must be a string'
    );
  }

  const sanitized = sanitizeText(habitName);

  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Habit name must be between 1 and 100 characters'
    );
  }

  return sanitized;
}

/**
 * Validate frequency parameter
 */
export function validateFrequency(frequency: 'daily' | string[]): 'daily' | string[] {
  if (!frequency) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Frequency is required'
    );
  }

  if (frequency !== 'daily' && !Array.isArray(frequency)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Frequency must be "daily" or an array of weekday names'
    );
  }

  if (Array.isArray(frequency)) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sanitizedDays: string[] = [];

    for (const day of frequency) {
      if (typeof day !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Weekday names must be strings'
        );
      }

      const normalizedDay = day.toLowerCase().trim();
      if (!validDays.includes(normalizedDay)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid weekday: ${day}`
        );
      }

      sanitizedDays.push(normalizedDay);
    }

    return sanitizedDays;
  }

  return frequency;
}

/**
 * Validate reminder time format (HH:MM)
 */
export function validateReminderTime(reminderTime: string | null | undefined): string | null {
  if (!reminderTime) {
    return null;
  }

  if (typeof reminderTime !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Reminder time must be a string'
    );
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(reminderTime)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Reminder time must be in HH:MM format'
    );
  }

  return reminderTime;
}

/**
 * Validate habit ID format
 */
export function validateHabitId(habitId: string): string {
  if (!habitId || typeof habitId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Habit ID is required and must be a string'
    );
  }

  // Firestore document IDs should be alphanumeric with some special chars
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(habitId)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid habit ID format'
    );
  }

  if (habitId.length > 1500) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Habit ID is too long'
    );
  }

  return habitId;
}

/**
 * Validate duration
 */
export function validateDuration(duration: number | undefined): number {
  const defaultDuration = 30;

  if (duration === undefined) {
    return defaultDuration;
  }

  if (typeof duration !== 'number' || !Number.isInteger(duration)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Duration must be an integer'
    );
  }

  if (duration < 1 || duration > 365) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Duration must be between 1 and 365 days'
    );
  }

  return duration;
}

/**
 * Validate date key format (YYYY-MM-DD)
 */
export function validateDateKey(dateKey: string): string {
  if (!dateKey || typeof dateKey !== 'string') {
    throw new Error('Date key is required and must be a string');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateKey)) {
    throw new Error('Date key must be in YYYY-MM-DD format');
  }

  // Validate it's a real date by checking if the formatted date matches input
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Invalid date');
  }

  return dateKey;
}

/**
 * Validate user ID format
 */
export function validateUserId(uid: string): string {
  if (!uid || typeof uid !== 'string') {
    throw new Error('User ID is required and must be a string');
  }

  // Firebase Auth UIDs are typically 28 characters
  if (uid.length < 1 || uid.length > 128) {
    throw new Error('Invalid user ID length');
  }

  // Should be alphanumeric
  const uidRegex = /^[a-zA-Z0-9]+$/;
  if (!uidRegex.test(uid)) {
    throw new Error('Invalid user ID format');
  }

  return uid;
}
