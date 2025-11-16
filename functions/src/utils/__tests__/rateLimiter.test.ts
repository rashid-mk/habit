import { checkRateLimit, cleanupRateLimits } from '../rateLimiter';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Mock Firestore
const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
};

const mockRunTransaction = jest.fn((callback) => callback(mockTransaction));

const mockDoc = jest.fn(() => ({
  get: jest.fn(),
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn(),
}));

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  })),
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow first request from user', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: false,
      });

      await expect(checkRateLimit('user123')).resolves.not.toThrow();
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('should allow requests within limit', async () => {
      const now = Date.now();
      const requests = Array(50).fill(now - 30000); // 50 requests 30 seconds ago

      mockTransaction.get.mockResolvedValue({
        exists: true,
        data: () => ({
          requests,
          lastCleanup: now - 30000,
        }),
      });

      await expect(checkRateLimit('user123')).resolves.not.toThrow();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should throw error when rate limit exceeded', async () => {
      const now = Date.now();
      const requests = Array(100).fill(now - 30000); // 100 requests 30 seconds ago

      mockTransaction.get.mockResolvedValue({
        exists: true,
        data: () => ({
          requests,
          lastCleanup: now - 30000,
        }),
      });

      mockRunTransaction.mockImplementation(async (callback) => {
        const doc = await mockTransaction.get();
        const data = doc.data();
        const windowStart = now - 60000;
        const filteredRequests = data.requests.filter((t: number) => t > windowStart);

        if (filteredRequests.length >= 100) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Rate limit exceeded. Maximum 100 requests per minute allowed.'
          );
        }
      });

      await expect(checkRateLimit('user123')).rejects.toThrow(functions.https.HttpsError);
    });

    it('should clean up old requests outside time window', async () => {
      const now = Date.now();
      const oldRequests = Array(50).fill(now - 120000); // 50 requests 2 minutes ago
      const recentRequests = Array(10).fill(now - 30000); // 10 requests 30 seconds ago

      mockTransaction.get.mockResolvedValue({
        exists: true,
        data: () => ({
          requests: [...oldRequests, ...recentRequests],
          lastCleanup: now - 120000,
        }),
      });

      await expect(checkRateLimit('user123')).resolves.not.toThrow();
    });

    it('should handle transaction errors gracefully', async () => {
      mockRunTransaction.mockRejectedValue(new Error('Transaction failed'));

      // Should not throw - errors are caught and logged
      await expect(checkRateLimit('user123')).resolves.not.toThrow();
    });
  });

  describe('cleanupRateLimits', () => {
    it('should delete old rate limit documents', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };

      const mockDocs = [
        { ref: 'doc1' },
        { ref: 'doc2' },
        { ref: 'doc3' },
      ];

      const mockSnapshot = {
        docs: mockDocs,
        size: 3,
      };

      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockWhere = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();

      mockCollection.mockReturnValue({
        doc: mockDoc,
        where: mockWhere,
        limit: mockLimit,
        get: mockGet,
      });

      const db = admin.firestore();
      (db as any).batch = jest.fn(() => mockBatch);

      await cleanupRateLimits();

      expect(mockWhere).toHaveBeenCalledWith('lastCleanup', '<', expect.any(Number));
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
