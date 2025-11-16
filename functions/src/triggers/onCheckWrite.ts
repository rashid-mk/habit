import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { calculateAnalytics } from '../utils/analytics';
import { validateUserId, validateHabitId, validateDateKey } from '../utils/validation';

/**
 * Firestore trigger that updates habit analytics when a check-in is created
 * Triggered on: /users/{uid}/habits/{habitId}/checks/{dateKey} onCreate
 */
export const onCheckWrite = functions.firestore
  .document('users/{uid}/habits/{habitId}/checks/{dateKey}')
  .onCreate(async (snap, context) => {
    const startTime = Date.now();
    
    try {
      // Validate path parameters
      const uid = validateUserId(context.params.uid);
      const habitId = validateHabitId(context.params.habitId);
      const dateKey = validateDateKey(context.params.dateKey);
      const db = admin.firestore();

      // Fetch the habit document to get start date
      const habitRef = db.doc(`users/${uid}/habits/${habitId}`);
      const habitDoc = await habitRef.get();

      if (!habitDoc.exists) {
        console.error(JSON.stringify({
          level: 'error',
          function: 'onCheckWrite',
          userId: uid,
          habitId,
          dateKey,
          error: 'Habit not found',
          timestamp: new Date().toISOString(),
        }));
        return;
      }

      const habitData = habitDoc.data();
      const habitStartDate = habitData?.startDate;

      if (!habitStartDate) {
        console.error(JSON.stringify({
          level: 'error',
          function: 'onCheckWrite',
          userId: uid,
          habitId,
          dateKey,
          error: 'Habit start date not found',
          timestamp: new Date().toISOString(),
        }));
        return;
      }

      // Fetch all checks for this habit
      const checksSnapshot = await db
        .collection(`users/${uid}/habits/${habitId}/checks`)
        .get();

      const checks = checksSnapshot.docs.map(doc => ({
        dateKey: doc.id,
        completedAt: doc.data().completedAt,
      }));

      // Calculate analytics
      const analytics = calculateAnalytics(checks, habitStartDate);

      // Update analytics document atomically
      const analyticsRef = db.doc(`users/${uid}/habits/${habitId}/analytics/summary`);
      await analyticsRef.set({
        ...analytics,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        function: 'onCheckWrite',
        userId: uid,
        habitId,
        dateKey,
        executionTime: duration,
        checksCount: checks.length,
        currentStreak: analytics.currentStreak,
        completionRate: analytics.completionRate,
        timestamp: new Date().toISOString(),
        message: 'Analytics updated successfully',
      }));

      // Log warning if processing took longer than 800ms
      if (duration > 800) {
        console.warn(JSON.stringify({
          level: 'warn',
          function: 'onCheckWrite',
          userId: uid,
          habitId,
          executionTime: duration,
          threshold: 800,
          message: 'Analytics processing exceeded 800ms',
          timestamp: new Date().toISOString(),
        }));
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(JSON.stringify({
        level: 'error',
        function: 'onCheckWrite',
        userId: context.params.uid,
        habitId: context.params.habitId,
        dateKey: context.params.dateKey,
        executionTime: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }));
      throw error;
    }
  });
