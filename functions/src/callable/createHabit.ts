import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { scheduleReminder } from '../utils/taskScheduler';
import { checkRateLimit } from '../utils/rateLimiter';
import {
  validateHabitName,
  validateFrequency,
  validateReminderTime,
  validateDuration,
} from '../utils/validation';

const db = admin.firestore();

interface CreateHabitRequest {
  habitName: string;
  frequency: 'daily' | string[];
  duration?: number;
  reminderTime?: string;
}

interface CreateHabitResponse {
  habitId: string;
  success: boolean;
}

export const createHabit = functions.https.onCall(
  async (data: CreateHabitRequest, context): Promise<CreateHabitResponse> => {
    const startTime = Date.now();
    
    // Verify authentication
    if (!context.auth) {
      console.error(JSON.stringify({
        level: 'error',
        function: 'createHabit',
        error: 'unauthenticated',
        message: 'User must be authenticated to create a habit',
        timestamp: new Date().toISOString(),
      }));
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create a habit'
      );
    }

    const uid = context.auth.uid;

    // Check rate limit
    await checkRateLimit(uid);

    // Validate and sanitize input parameters
    const sanitizedHabitName = validateHabitName(data.habitName);
    const validatedFrequency = validateFrequency(data.frequency);
    const validatedReminderTime = validateReminderTime(data.reminderTime);
    const validatedDuration = validateDuration(data.duration);

    try {
      // Create habit document
      const habitRef = db.collection('users').doc(uid).collection('habits').doc();
      const habitId = habitRef.id;

      const habitData = {
        habitId,
        habitName: sanitizedHabitName,
        frequency: validatedFrequency,
        duration: validatedDuration,
        reminderTime: validatedReminderTime,
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
      };

      await habitRef.set(habitData);

      // Initialize analytics document
      const analyticsRef = habitRef.collection('analytics').doc('summary');
      await analyticsRef.set({
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalDays: 0,
        completedDays: 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Schedule Cloud Task for reminder if reminderTime provided
      if (validatedReminderTime) {
        try {
          await scheduleReminder({
            uid,
            habitId,
            reminderTime: validatedReminderTime,
          });
        } catch (error) {
          console.error(JSON.stringify({
            level: 'error',
            function: 'createHabit',
            operation: 'scheduleReminder',
            userId: uid,
            habitId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }));
          // Don't throw - habit creation should succeed even if scheduling fails
        }
      }

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        function: 'createHabit',
        userId: uid,
        habitId,
        executionTime: duration,
        hasReminder: !!validatedReminderTime,
        timestamp: new Date().toISOString(),
        message: 'Habit created successfully',
      }));

      // Log warning if execution time exceeds threshold
      if (duration > 2000) {
        console.warn(JSON.stringify({
          level: 'warn',
          function: 'createHabit',
          userId: uid,
          habitId,
          executionTime: duration,
          threshold: 2000,
          message: 'Execution time exceeded 2 seconds',
          timestamp: new Date().toISOString(),
        }));
      }

      return {
        habitId,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(JSON.stringify({
        level: 'error',
        function: 'createHabit',
        userId: uid,
        executionTime: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }));
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create habit'
      );
    }
  }
);
