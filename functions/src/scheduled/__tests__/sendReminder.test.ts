import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import dayjs from 'dayjs';

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
  });
}

const testEnv = functionsTest();

// Mock Firebase Messaging
const mockSend = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
jest.spyOn(admin, 'messaging').mockReturnValue({
  send: mockSend,
} as any);

describe('sendReminder', () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    db = admin.firestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    const collections = await db.listCollections();
    for (const collection of collections) {
      const docs = await collection.listDocuments();
      for (const doc of docs) {
        await doc.delete();
      }
    }
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  it('should send notification for habit without check-in', async () => {
    const uid = 'test-user-123';
    const habitId = 'habit-123';
    const currentHour = dayjs().format('HH:00');

    // Create user with FCM token
    await db.collection('users').doc(uid).set({
      email: 'test@example.com',
      fcmToken: 'test-fcm-token',
    });

    // Create habit with reminder time
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId)
      .set({
        habitName: 'Morning Exercise',
        frequency: 'daily',
        reminderTime: currentHour,
        isActive: true,
      });

    // Import and run the function
    const { sendReminder } = require('../sendReminder');
    const wrapped = testEnv.wrap(sendReminder);

    await wrapped({});

    // Verify notification was sent
    expect(mockSend).toHaveBeenCalledWith({
      notification: {
        title: 'Time for your habit!',
        body: "Don't forget: Morning Exercise",
      },
      data: {
        habitId,
        action: 'check-in',
      },
      token: 'test-fcm-token',
    });
  });

  it('should not send notification if check-in already completed', async () => {
    const uid = 'test-user-123';
    const habitId = 'habit-123';
    const currentHour = dayjs().format('HH:00');
    const todayKey = dayjs().format('YYYY-MM-DD');

    // Create user with FCM token
    await db.collection('users').doc(uid).set({
      email: 'test@example.com',
      fcmToken: 'test-fcm-token',
    });

    // Create habit with reminder time
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId)
      .set({
        habitName: 'Morning Exercise',
        frequency: 'daily',
        reminderTime: currentHour,
        isActive: true,
      });

    // Create today's check-in
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId)
      .collection('checks')
      .doc(todayKey)
      .set({
        dateKey: todayKey,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Import and run the function
    const { sendReminder } = require('../sendReminder');
    const wrapped = testEnv.wrap(sendReminder);

    await wrapped({});

    // Verify notification was NOT sent
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should skip users without FCM token', async () => {
    const uid = 'test-user-123';
    const habitId = 'habit-123';
    const currentHour = dayjs().format('HH:00');

    // Create user WITHOUT FCM token
    await db.collection('users').doc(uid).set({
      email: 'test@example.com',
    });

    // Create habit with reminder time
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId)
      .set({
        habitName: 'Morning Exercise',
        frequency: 'daily',
        reminderTime: currentHour,
        isActive: true,
      });

    // Import and run the function
    const { sendReminder } = require('../sendReminder');
    const wrapped = testEnv.wrap(sendReminder);

    await wrapped({});

    // Verify notification was NOT sent
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should only send for habits with matching reminder time', async () => {
    const uid = 'test-user-123';
    const habitId1 = 'habit-123';
    const habitId2 = 'habit-456';
    const currentHour = dayjs().format('HH:00');
    const differentHour = dayjs().add(2, 'hour').format('HH:00');

    // Create user with FCM token
    await db.collection('users').doc(uid).set({
      email: 'test@example.com',
      fcmToken: 'test-fcm-token',
    });

    // Create habit with matching reminder time
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId1)
      .set({
        habitName: 'Morning Exercise',
        frequency: 'daily',
        reminderTime: currentHour,
        isActive: true,
      });

    // Create habit with different reminder time
    await db
      .collection('users')
      .doc(uid)
      .collection('habits')
      .doc(habitId2)
      .set({
        habitName: 'Evening Reading',
        frequency: 'daily',
        reminderTime: differentHour,
        isActive: true,
      });

    // Import and run the function
    const { sendReminder } = require('../sendReminder');
    const wrapped = testEnv.wrap(sendReminder);

    await wrapped({});

    // Verify only one notification was sent
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: expect.objectContaining({
          body: "Don't forget: Morning Exercise",
        }),
      })
    );
  });
});
