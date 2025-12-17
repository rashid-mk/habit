import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { AccessControlService } from '../AccessControlService'
import { SubscriptionStatus, PremiumFeature } from '../../types/analytics'
import { Timestamp } from 'firebase/firestore'

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    })
  }
}))

describe('AccessControlService', () => {
  let service: AccessControlService
  
  beforeEach(() => {
    service = new AccessControlService()
    service.clearAllCache()
    vi.clearAllMocks()
  })

  describe('Property 34: Free User Content Blur', () => {
    /**
     * Feature: premium-analytics, Property 34: Free User Content Blur
     * Validates: Requirements 10.1
     * 
     * For any free user viewing analytics sections, the preview content should be displayed with a blur overlay.
     */
    it('should identify free users correctly for blur overlay display', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        async (userId) => {
          // Mock free user subscription status
          const { getDoc } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: false,
              plan: 'free'
            })
          } as any)

          const isPremium = await service.isPremiumUser(userId)
          
          // Free users should not have premium access (requiring blur overlay)
          expect(isPremium).toBe(false)
        }
      ), { numRuns: 100 })
    })

    it('should handle non-existent subscription documents as free users', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        async (userId) => {
          // Mock non-existent subscription document
          const { getDoc } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => false
          } as any)

          const isPremium = await service.isPremiumUser(userId)
          
          // Users without subscription documents should be treated as free (requiring blur)
          expect(isPremium).toBe(false)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 35: Free User Upgrade Prompt', () => {
    /**
     * Feature: premium-analytics, Property 35: Free User Upgrade Prompt
     * Validates: Requirements 10.2
     * 
     * For any free user attempting to access premium features, an upgrade prompt with feature descriptions should be displayed.
     */
    it('should deny feature access to free users (triggering upgrade prompt)', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        fc.constantFrom('advanced-analytics', 'data-export', 'insights', 'charts', 'multi-device-sync'), // feature
        async (userId, feature) => {
          // Mock free user subscription status
          const { getDoc } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: false,
              plan: 'free'
            })
          } as any)

          const hasAccess = await service.checkFeatureAccess(userId, feature as PremiumFeature)
          
          // Free users should not have access to any premium features (triggering upgrade prompt)
          expect(hasAccess).toBe(false)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 36: Premium User Full Access', () => {
    /**
     * Feature: premium-analytics, Property 36: Premium User Full Access
     * Validates: Requirements 10.3
     * 
     * For any premium user viewing analytics sections, all content should be displayed without restrictions or overlays.
     */
    it('should grant full access to premium users (no blur overlay)', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        fc.constantFrom('advanced-analytics', 'data-export', 'insights', 'charts', 'multi-device-sync'), // feature
        async (userId, feature) => {
          // Mock premium user subscription status (active)
          const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          const { getDoc, Timestamp } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: true,
              plan: 'premium',
              expiresAt: Timestamp.fromDate(futureDate)
            })
          } as any)

          const hasAccess = await service.checkFeatureAccess(userId, feature as PremiumFeature)
          
          // Premium users should have access to all premium features (no restrictions)
          expect(hasAccess).toBe(true)
        }
      ), { numRuns: 100 })
    })

    it('should identify premium users correctly (no blur needed)', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        async (userId) => {
          // Mock premium user subscription status (active)
          const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          const { getDoc, Timestamp } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: true,
              plan: 'premium',
              expiresAt: Timestamp.fromDate(futureDate)
            })
          } as any)

          const isPremium = await service.isPremiumUser(userId)
          
          // Premium users should be identified correctly (no blur overlay needed)
          expect(isPremium).toBe(true)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 37: Subscription Expiry Access Reversion', () => {
    /**
     * Feature: premium-analytics, Property 37: Subscription Expiry Access Reversion
     * Validates: Requirements 10.4
     * 
     * For any premium subscription that expires, the user's access should revert to free user level within 24 hours.
     */
    it('should revert access for expired subscriptions', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        fc.integer({ min: 1, max: 30 }), // days ago expired
        async (userId, daysAgo) => {
          // Mock expired subscription
          const expiredDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          const { getDoc, Timestamp } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: true, // Still marked as premium in DB
              plan: 'premium',
              expiresAt: Timestamp.fromDate(expiredDate)
            })
          } as any)

          const isPremium = await service.isPremiumUser(userId)
          
          // Expired subscriptions should not have premium access
          expect(isPremium).toBe(false)
        }
      ), { numRuns: 100 })
    })

    it('should handle subscriptions expiring within 24 hours', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        fc.integer({ min: 1, max: 23 }), // hours ago expired
        async (userId, hoursAgo) => {
          // Mock recently expired subscription (within 24 hours)
          const expiredDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
          const { getDoc, Timestamp } = await import('firebase/firestore')
          vi.mocked(getDoc).mockResolvedValue({
            exists: () => true,
            data: () => ({
              isPremium: true,
              plan: 'premium',
              expiresAt: Timestamp.fromDate(expiredDate)
            })
          } as any)

          const isPremium = await service.isPremiumUser(userId)
          
          // Even recently expired subscriptions should not have premium access
          expect(isPremium).toBe(false)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 38: Subscription Status Check', () => {
    /**
     * Feature: premium-analytics, Property 38: Subscription Status Check
     * Validates: Requirements 10.5
     * 
     * For any page load that renders premium content, the subscription status should be checked before rendering.
     */
    it('should always check subscription status before granting access', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        fc.boolean(), // isPremium
        async (userId, isPremium) => {
          // Clear cache before each test
          service.clearCache(userId)
          
          // Mock subscription status
          const { getDoc } = await import('firebase/firestore')
          const mockGetDoc = vi.mocked(getDoc)
          mockGetDoc.mockReset() // Reset mock before each test
          
          if (isPremium) {
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            const { Timestamp } = await import('firebase/firestore')
            mockGetDoc.mockResolvedValueOnce({
              exists: () => true,
              data: () => ({
                isPremium: true,
                plan: 'premium',
                expiresAt: Timestamp.fromDate(futureDate)
              })
            } as any)
          } else {
            mockGetDoc.mockResolvedValueOnce({
              exists: () => true,
              data: () => ({
                isPremium: false,
                plan: 'free'
              })
            } as any)
          }

          // Call subscription check
          const result = await service.isPremiumUser(userId)
          
          // Verify that getDoc was called (subscription status was checked)
          expect(mockGetDoc).toHaveBeenCalled()
          
          // Result should match the mocked subscription status
          expect(result).toBe(isPremium)
        }
      ), { numRuns: 100 })
    })

    it('should fail closed when subscription check fails', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }), // userId
        async (userId) => {
          // Mock database error
          const { getDoc } = await import('firebase/firestore')
          vi.mocked(getDoc).mockRejectedValue(new Error('Database connection failed'))

          const isPremium = await service.isPremiumUser(userId)
          
          // Should fail closed (deny access) when subscription check fails
          expect(isPremium).toBe(false)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Subscription Status Caching', () => {
    it('should cache subscription status for performance', async () => {
      const userId = 'test-user'
      const { getDoc } = await import('firebase/firestore')
      const mockGetDoc = vi.mocked(getDoc)
      
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPremium: true,
          plan: 'premium'
        })
      } as any)

      // First call should hit the database
      await service.isPremiumUser(userId)
      expect(mockGetDoc).toHaveBeenCalledTimes(1)

      // Second call should use cache
      await service.isPremiumUser(userId)
      expect(mockGetDoc).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it('should refresh cache after expiry', async () => {
      const userId = 'test-user'
      const { getDoc } = await import('firebase/firestore')
      const mockGetDoc = vi.mocked(getDoc)
      
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPremium: true,
          plan: 'premium'
        })
      } as any)

      // Create service with short cache duration for testing
      const testService = new AccessControlService()
      // Override cache duration via reflection for testing
      ;(testService as any).CACHE_DURATION = 100 // 100ms

      // First call
      await testService.isPremiumUser(userId)
      expect(mockGetDoc).toHaveBeenCalledTimes(1)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second call should hit database again
      await testService.isPremiumUser(userId)
      expect(mockGetDoc).toHaveBeenCalledTimes(2)
    })
  })
})