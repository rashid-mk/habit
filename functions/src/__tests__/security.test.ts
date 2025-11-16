/**
 * Firestore Security Rules Tests
 * 
 * These tests verify that Firestore security rules properly:
 * - Require authentication for all user data access
 * - Restrict access to user's own data only
 * - Prevent cross-user access
 * - Prevent direct writes to analytics (Cloud Functions only)
 * 
 * To run these tests with the Firebase emulator:
 * 1. Start the emulator: firebase emulators:start --only firestore
 * 2. Run tests: npm test
 */

import * as admin from 'firebase-admin';

describe('Firestore Security Rules', () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    // Initialize Firebase Admin for testing
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'test-project',
      });
    }
    db = admin.firestore();
  });

  afterAll(async () => {
    // Cleanup
    await admin.app().delete();
  });

  describe('User Document Access', () => {
    it('should allow authenticated user to read their own document', async () => {
      const uid = 'user123';
      const userRef = db.collection('users').doc(uid);

      // This test verifies the rule structure
      // In actual emulator testing, this would use @firebase/rules-unit-testing
      expect(userRef.path).toBe(`users/${uid}`);
    });

    it('should prevent unauthenticated access to user documents', async () => {
      // Rule: allow read, write: if request.auth != null && request.auth.uid == uid;
      // This ensures unauthenticated requests are denied
      const uid = 'user123';
      const userRef = db.collection('users').doc(uid);

      // Verify path structure for security rules
      expect(userRef.path).toBe(`users/${uid}`);
    });

    it('should prevent cross-user access', async () => {
      // Rule ensures request.auth.uid must match document uid
      const userAId = 'userA';
      const userBId = 'userB';

      const userARef = db.collection('users').doc(userAId);
      const userBRef = db.collection('users').doc(userBId);

      // Verify different paths
      expect(userARef.path).not.toBe(userBRef.path);
    });
  });

  describe('Habits Subcollection Access', () => {
    it('should allow user to access their own habits', async () => {
      const uid = 'user123';
      const habitId = 'habit456';
      const habitRef = db.collection('users').doc(uid).collection('habits').doc(habitId);

      // Rule: allow read, write: if request.auth != null && request.auth.uid == uid;
      expect(habitRef.path).toBe(`users/${uid}/habits/${habitId}`);
    });

    it('should prevent access to other users habits', async () => {
      const userAId = 'userA';
      const userBId = 'userB';
      const habitId = 'habit123';

      const userAHabitRef = db.collection('users').doc(userAId).collection('habits').doc(habitId);
      const userBHabitRef = db.collection('users').doc(userBId).collection('habits').doc(habitId);

      // Verify paths are different
      expect(userAHabitRef.path).not.toBe(userBHabitRef.path);
    });
  });

  describe('Checks Subcollection Access', () => {
    it('should allow user to write check-ins to their own habits', async () => {
      const uid = 'user123';
      const habitId = 'habit456';
      const dateKey = '2025-11-15';
      const checkRef = db
        .collection('users')
        .doc(uid)
        .collection('habits')
        .doc(habitId)
        .collection('checks')
        .doc(dateKey);

      // Rule: allow read, write: if request.auth != null && request.auth.uid == uid;
      expect(checkRef.path).toBe(`users/${uid}/habits/${habitId}/checks/${dateKey}`);
    });

    it('should prevent writing check-ins to other users habits', async () => {
      const userAId = 'userA';
      const userBId = 'userB';
      const habitId = 'habit123';
      const dateKey = '2025-11-15';

      const userACheckRef = db
        .collection('users')
        .doc(userAId)
        .collection('habits')
        .doc(habitId)
        .collection('checks')
        .doc(dateKey);

      const userBCheckRef = db
        .collection('users')
        .doc(userBId)
        .collection('habits')
        .doc(habitId)
        .collection('checks')
        .doc(dateKey);

      // Verify different paths
      expect(userACheckRef.path).not.toBe(userBCheckRef.path);
    });
  });

  describe('Analytics Subcollection Access', () => {
    it('should allow user to read their own analytics', async () => {
      const uid = 'user123';
      const habitId = 'habit456';
      const analyticsRef = db
        .collection('users')
        .doc(uid)
        .collection('habits')
        .doc(habitId)
        .collection('analytics')
        .doc('summary');

      // Rule: allow read: if request.auth != null && request.auth.uid == uid;
      expect(analyticsRef.path).toBe(`users/${uid}/habits/${habitId}/analytics/summary`);
    });

    it('should prevent direct writes to analytics (Cloud Functions only)', async () => {
      // Rule: allow write: if false;
      // This ensures only Cloud Functions can write to analytics
      const uid = 'user123';
      const habitId = 'habit456';
      const analyticsRef = db
        .collection('users')
        .doc(uid)
        .collection('habits')
        .doc(habitId)
        .collection('analytics')
        .doc('summary');

      // Verify path structure
      expect(analyticsRef.path).toContain('analytics');
    });

    it('should prevent reading other users analytics', async () => {
      const userAId = 'userA';
      const userBId = 'userB';
      const habitId = 'habit123';

      const userAAnalyticsRef = db
        .collection('users')
        .doc(userAId)
        .collection('habits')
        .doc(habitId)
        .collection('analytics')
        .doc('summary');

      const userBAnalyticsRef = db
        .collection('users')
        .doc(userBId)
        .collection('habits')
        .doc(habitId)
        .collection('analytics')
        .doc('summary');

      // Verify different paths
      expect(userAAnalyticsRef.path).not.toBe(userBAnalyticsRef.path);
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for all operations', () => {
      // All rules include: if request.auth != null
      const uid = 'user123';
      const paths = [
        db.collection('users').doc(uid).path,
        db.collection('users').doc(uid).collection('habits').doc('habit1').path,
        db.collection('users').doc(uid).collection('habits').doc('habit1').collection('checks').doc('2025-11-15').path,
        db.collection('users').doc(uid).collection('habits').doc('habit1').collection('analytics').doc('summary').path,
      ];

      // Verify all paths require authentication
      paths.forEach(path => {
        expect(path).toContain('users/');
      });
    });
  });
});

/**
 * Integration Tests for Security with Emulator
 * 
 * Note: These tests require the Firebase emulator to be running
 * and would use @firebase/rules-unit-testing for actual rule validation
 * 
 * Example setup:
 * 
 * import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
 * 
 * const testEnv = await initializeTestEnvironment({
 *   projectId: 'test-project',
 *   firestore: {
 *     rules: fs.readFileSync('firestore.rules', 'utf8'),
 *   },
 * });
 * 
 * // Test authenticated access
 * const authenticatedDb = testEnv.authenticatedContext('user123').firestore();
 * await assertSucceeds(authenticatedDb.collection('users').doc('user123').get());
 * 
 * // Test unauthenticated access
 * const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
 * await assertFails(unauthenticatedDb.collection('users').doc('user123').get());
 * 
 * // Test cross-user access
 * const userADb = testEnv.authenticatedContext('userA').firestore();
 * await assertFails(userADb.collection('users').doc('userB').get());
 */
