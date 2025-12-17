import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { SubscriptionStatus, PremiumFeature } from '../types/analytics'
import { Timestamp } from 'firebase/firestore'

/**
 * Access Control Service
 * Handles premium subscription verification and feature access control
 */
export class AccessControlService {
  private subscriptionCache = new Map<string, { status: SubscriptionStatus; cachedAt: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  /**
   * Check if a user has premium subscription
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId)
    return status.isPremium && this.isSubscriptionActive(status)
  }

  /**
   * Check if user has access to a specific premium feature
   */
  async checkFeatureAccess(userId: string, feature: PremiumFeature): Promise<boolean> {
    const isPremium = await this.isPremiumUser(userId)
    
    // All premium features require premium subscription
    // In the future, different features could have different access levels
    return isPremium && this.isFeatureEnabled(feature)
  }

  /**
   * Check if a specific feature is enabled
   * Currently all features are enabled for premium users
   */
  private isFeatureEnabled(feature: PremiumFeature): boolean {
    // In the future, this could check feature flags or subscription tiers
    const enabledFeatures: PremiumFeature[] = [
      'advanced-analytics',
      'data-export', 
      'insights',
      'charts',
      'multi-device-sync'
    ]
    
    return enabledFeatures.includes(feature)
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Check cache first
    const cached = this.subscriptionCache.get(userId)
    if (cached && Date.now() - cached.cachedAt < this.CACHE_DURATION) {
      return cached.status
    }

    try {
      const subscriptionRef = doc(db, 'users', userId, 'subscription', 'status')
      const subscriptionDoc = await getDoc(subscriptionRef)
      
      let status: SubscriptionStatus
      
      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data()
        status = {
          isPremium: data.isPremium || false,
          expiresAt: data.expiresAt,
          plan: data.plan
        }
      } else {
        // Default to free user if no subscription document exists
        status = {
          isPremium: false
        }
      }

      // Cache the result
      this.subscriptionCache.set(userId, {
        status,
        cachedAt: Date.now()
      })

      return status
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      // Fail closed - deny access if we can't verify subscription
      return { isPremium: false }
    }
  }

  /**
   * Handle subscription expiry - revert access within 24 hours
   */
  async handleSubscriptionExpiry(userId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(userId)
    
    if (status.expiresAt && this.isExpiredWithinGracePeriod(status.expiresAt)) {
      // Update subscription status to expired
      const subscriptionRef = doc(db, 'users', userId, 'subscription', 'status')
      await setDoc(subscriptionRef, {
        isPremium: false,
        expiresAt: status.expiresAt,
        plan: status.plan,
        expiredAt: serverTimestamp()
      }, { merge: true })

      // Clear cache to force refresh
      this.subscriptionCache.delete(userId)
    }
  }

  /**
   * Update subscription status (for testing and admin purposes)
   */
  async updateSubscriptionStatus(userId: string, status: SubscriptionStatus): Promise<void> {
    const subscriptionRef = doc(db, 'users', userId, 'subscription', 'status')
    await setDoc(subscriptionRef, {
      ...status,
      updatedAt: serverTimestamp()
    }, { merge: true })

    // Clear cache to force refresh
    this.subscriptionCache.delete(userId)
  }

  /**
   * Clear subscription cache for a user
   */
  clearCache(userId: string): void {
    this.subscriptionCache.delete(userId)
  }

  /**
   * Clear all subscription cache
   */
  clearAllCache(): void {
    this.subscriptionCache.clear()
  }

  /**
   * Check if subscription is currently active
   */
  private isSubscriptionActive(status: SubscriptionStatus): boolean {
    if (!status.isPremium) return false
    
    // If no expiry date, assume active
    if (!status.expiresAt) return true
    
    // Check if subscription has expired
    const now = new Date()
    const expiryDate = status.expiresAt.toDate()
    
    return now < expiryDate
  }

  /**
   * Check if subscription expired within the 24-hour grace period
   */
  private isExpiredWithinGracePeriod(expiresAt: Timestamp): boolean {
    const now = new Date()
    const expiryDate = expiresAt.toDate()
    const gracePeriodEnd = new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    
    return now > expiryDate && now <= gracePeriodEnd
  }
}

// Export singleton instance
export const accessControlService = new AccessControlService()