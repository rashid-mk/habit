import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

/**
 * Rate limiter middleware for Cloud Functions
 * Tracks request counts per user in Firestore
 * Limits to 100 requests per user per minute by default
 */
export async function checkRateLimit(
  uid: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<void> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const rateLimitRef = db.collection('rateLimits').doc(uid);
  
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // First request from this user
        transaction.set(rateLimitRef, {
          requests: [now],
          lastCleanup: now,
        });
        return;
      }
      
      const data = doc.data();
      let requests: number[] = data?.requests || [];
      
      // Remove requests outside the time window
      requests = requests.filter((timestamp) => timestamp > windowStart);
      
      // Check if limit exceeded
      if (requests.length >= config.maxRequests) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Rate limit exceeded. Maximum ${config.maxRequests} requests per minute allowed.`
        );
      }
      
      // Add current request
      requests.push(now);
      
      transaction.update(rateLimitRef, {
        requests,
        lastCleanup: now,
      });
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Rate limit check error:', error);
    // Don't block requests if rate limiting fails
  }
}

/**
 * Cleanup old rate limit documents
 * Should be called periodically to prevent unbounded growth
 */
export async function cleanupRateLimits(): Promise<void> {
  const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
  
  const snapshot = await db
    .collection('rateLimits')
    .where('lastCleanup', '<', cutoffTime)
    .limit(100)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} rate limit documents`);
}
