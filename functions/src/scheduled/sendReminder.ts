import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import dayjs from 'dayjs';
import { sanitizeText } from '../utils/validation';

const db = admin.firestore();

export const sendReminder = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const startTime = Date.now();
    const now = dayjs();
    const currentHour = now.format('HH:00');
    
    let notificationsSent = 0;
    let notificationsFailed = 0;
    let usersProcessed = 0;

    try {
      // Query all users
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
          continue; // Skip users without FCM token
        }

        usersProcessed++;

        // Query habits with reminder time matching current hour
        const habitsSnapshot = await db
          .collection('users')
          .doc(uid)
          .collection('habits')
          .where('isActive', '==', true)
          .where('reminderTime', '>=', currentHour)
          .where('reminderTime', '<', getNextHour(currentHour))
          .get();

        for (const habitDoc of habitsSnapshot.docs) {
          const habit = habitDoc.data();
          const habitId = habitDoc.id;

          // Check if user has completed today's check-in
          const todayKey = now.format('YYYY-MM-DD');
          const checkDoc = await db
            .collection('users')
            .doc(uid)
            .collection('habits')
            .doc(habitId)
            .collection('checks')
            .doc(todayKey)
            .get();

          if (!checkDoc.exists) {
            // User hasn't completed today's check-in, send notification
            const success = await sendNotification(fcmToken, habit.habitName, habitId, uid);
            if (success) {
              notificationsSent++;
            } else {
              notificationsFailed++;
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        function: 'sendReminder',
        executionTime: duration,
        currentHour,
        usersProcessed,
        notificationsSent,
        notificationsFailed,
        deliveryRate: notificationsSent + notificationsFailed > 0 
          ? ((notificationsSent / (notificationsSent + notificationsFailed)) * 100).toFixed(2) + '%'
          : 'N/A',
        timestamp: new Date().toISOString(),
        message: 'Reminder notifications processed successfully',
      }));

      // Log warning if delivery rate is below 90%
      if (notificationsSent + notificationsFailed > 0) {
        const deliveryRate = (notificationsSent / (notificationsSent + notificationsFailed)) * 100;
        if (deliveryRate < 90) {
          console.warn(JSON.stringify({
            level: 'warn',
            function: 'sendReminder',
            notificationsSent,
            notificationsFailed,
            deliveryRate: deliveryRate.toFixed(2) + '%',
            threshold: '90%',
            message: 'FCM notification delivery rate below threshold',
            timestamp: new Date().toISOString(),
          }));
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(JSON.stringify({
        level: 'error',
        function: 'sendReminder',
        executionTime: duration,
        currentHour,
        usersProcessed,
        notificationsSent,
        notificationsFailed,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }));
      throw error;
    }
  });

async function sendNotification(
  fcmToken: string,
  habitName: string,
  habitId: string,
  userId: string
): Promise<boolean> {
  try {
    // Sanitize habit name before including in notification
    const sanitizedHabitName = sanitizeText(habitName);
    
    const message = {
      notification: {
        title: 'Time for your habit!',
        body: `Don't forget: ${sanitizedHabitName}`,
      },
      data: {
        habitId,
        action: 'check-in',
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log(JSON.stringify({
      level: 'info',
      function: 'sendNotification',
      userId,
      habitId,
      habitName: sanitizedHabitName,
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Notification sent successfully',
    }));
    return true;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      function: 'sendNotification',
      userId,
      habitId,
      habitName,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      timestamp: new Date().toISOString(),
      message: 'Failed to send notification',
    }));
    // Don't throw - continue with other notifications
    return false;
  }
}

function getNextHour(currentHour: string): string {
  const [hours] = currentHour.split(':').map(Number);
  const nextHour = (hours + 1) % 24;
  return `${nextHour.toString().padStart(2, '0')}:00`;
}
