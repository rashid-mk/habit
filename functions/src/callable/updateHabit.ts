import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { rescheduleReminder, cancelReminder } from '../utils/taskScheduler';
import { checkRateLimit } from '../utils/rateLimiter';
import {
  validateHabitId,
  validateHabitName,
  validateFrequency,
  validateReminderTime,
} from '../utils/validation';

const db = admin.firestore();

interface UpdateHabitRequest {
  habitId: string;
  habitName?: string;
  frequency?: 'daily' | string[];
  reminderTime?: string | null;
}

export const updateHabit = functions.https.onCall(
  async (data: UpdateHabitRequest, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update a habit'
      );
    }

    const uid = context.auth.uid;

    // Check rate limit
    await checkRateLimit(uid);

    // Validate habit ID
    const validatedHabitId = validateHabitId(data.habitId);

    try {
      const habitRef = db
        .collection('users')
        .doc(uid)
        .collection('habits')
        .doc(validatedHabitId);

      const habitDoc = await habitRef.get();

      if (!habitDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Habit not found'
        );
      }

      const currentHabit = habitDoc.data();
      const updateData: any = {};

      // Validate and sanitize habit name if provided
      if (data.habitName !== undefined) {
        const sanitizedHabitName = validateHabitName(data.habitName);
        updateData.habitName = sanitizedHabitName;
      }

      // Validate frequency if provided
      if (data.frequency !== undefined) {
        const validatedFrequency = validateFrequency(data.frequency);
        updateData.frequency = validatedFrequency;
      }

      // Handle reminder time changes
      if (data.reminderTime !== undefined) {
        const oldReminderTime = currentHabit?.reminderTime;

        if (data.reminderTime === null) {
          // Remove reminder
          updateData.reminderTime = null;
          await cancelReminder(uid, validatedHabitId);
        } else {
          // Validate reminder time
          const validatedReminderTime = validateReminderTime(data.reminderTime);

          updateData.reminderTime = validatedReminderTime;

          // Reschedule if time changed
          if (oldReminderTime !== validatedReminderTime) {
            await rescheduleReminder({
              uid,
              habitId: validatedHabitId,
              reminderTime: validatedReminderTime!,
            });
          }
        }
      }

      await habitRef.update(updateData);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating habit:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update habit'
      );
    }
  }
);
