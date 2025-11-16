import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
  });
}

const testEnv = functionsTest();

// Mock the task scheduler
jest.mock('../../utils/taskScheduler', () => ({
  scheduleReminder: jest.fn().mockResolvedValue(undefined),
}));

import { createHabit } from '../createHabit';
import { scheduleReminder } from '../../utils/taskScheduler';

describe('createHabit', () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    db = admin.firestore();
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
    jest.clearAllMocks();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  it('should create a habit with valid input', async () => {
    const data = {
      habitName: 'Morning Exercise',
      frequency: 'daily' as const,
      duration: 30,
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);
    const result = await wrapped(data, context);

    expect(result.success).toBe(true);
    expect(result.habitId).toBeDefined();

    // Verify habit document was created
    const habitDoc = await db
      .collection('users')
      .doc('test-user-123')
      .collection('habits')
      .doc(result.habitId)
      .get();

    expect(habitDoc.exists).toBe(true);
    const habitData = habitDoc.data();
    expect(habitData?.habitName).toBe('Morning Exercise');
    expect(habitData?.frequency).toBe('daily');
    expect(habitData?.duration).toBe(30);
  });

  it('should initialize analytics document', async () => {
    const data = {
      habitName: 'Reading',
      frequency: 'daily' as const,
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);
    const result = await wrapped(data, context);

    // Verify analytics document was created
    const analyticsDoc = await db
      .collection('users')
      .doc('test-user-123')
      .collection('habits')
      .doc(result.habitId)
      .collection('analytics')
      .doc('summary')
      .get();

    expect(analyticsDoc.exists).toBe(true);
    const analyticsData = analyticsDoc.data();
    expect(analyticsData?.currentStreak).toBe(0);
    expect(analyticsData?.longestStreak).toBe(0);
    expect(analyticsData?.completionRate).toBe(0);
  });

  it('should schedule reminder when reminderTime is provided', async () => {
    const data = {
      habitName: 'Meditation',
      frequency: 'daily' as const,
      reminderTime: '09:00',
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);
    const result = await wrapped(data, context);

    expect(result.success).toBe(true);
    expect(scheduleReminder).toHaveBeenCalledWith({
      uid: 'test-user-123',
      habitId: result.habitId,
      reminderTime: '09:00',
    });
  });

  it('should reject unauthenticated requests', async () => {
    const data = {
      habitName: 'Test Habit',
      frequency: 'daily' as const,
    };

    const context = {};

    const wrapped = testEnv.wrap(createHabit);

    await expect(wrapped(data, context)).rejects.toThrow('unauthenticated');
  });

  it('should validate habit name length', async () => {
    const data = {
      habitName: '',
      frequency: 'daily' as const,
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);

    await expect(wrapped(data, context)).rejects.toThrow('invalid-argument');
  });

  it('should validate reminder time format', async () => {
    const data = {
      habitName: 'Test Habit',
      frequency: 'daily' as const,
      reminderTime: '25:00', // Invalid hour
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);

    await expect(wrapped(data, context)).rejects.toThrow('invalid-argument');
  });

  it('should accept array of weekdays for frequency', async () => {
    const data = {
      habitName: 'Gym',
      frequency: ['monday', 'wednesday', 'friday'],
    };

    const context = {
      auth: {
        uid: 'test-user-123',
      },
    };

    const wrapped = testEnv.wrap(createHabit);
    const result = await wrapped(data, context);

    expect(result.success).toBe(true);

    const habitDoc = await db
      .collection('users')
      .doc('test-user-123')
      .collection('habits')
      .doc(result.habitId)
      .get();

    const habitData = habitDoc.data();
    expect(habitData?.frequency).toEqual(['monday', 'wednesday', 'friday']);
  });
});
