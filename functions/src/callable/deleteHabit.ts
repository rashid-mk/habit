import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { cancelReminder } from '../utils/taskScheduler';
import { checkRateLimit } from '../utils/rateLimiter';
import { validateHabitId } from '../utils/validation';

const db = admin.firestore();

interface DeleteHabitRequest {
  habitId: string;
}

export const deleteHabit = functions.https.onCall(
  async (data: DeleteHabitRequest, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to delete a habit'
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

      // Cancel any scheduled reminders
      await cancelReminder(uid, validatedHabitId);

      // Mark habit as inactive instead of deleting
      await habitRef.update({
        isActive: false,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting habit:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to delete habit'
      );
    }
  }
);
