import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { onCheckWrite } from './triggers/onCheckWrite';
export { createHabit } from './callable/createHabit';
export { updateHabit } from './callable/updateHabit';
export { deleteHabit } from './callable/deleteHabit';
export { sendReminder } from './scheduled/sendReminder';
export { healthCheck, getMetrics } from './health';
