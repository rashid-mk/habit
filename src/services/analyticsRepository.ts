import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AnalyticsData } from '../types/analytics'
import { offlineAnalyticsCache } from './OfflineAnalyticsCache'

/**
 * Analytics Repository
 * Handles all Firestore operations for premium analytics data
 */
export class AnalyticsRepository {
  /**
   * Get analytics data for a specific habit
   * Uses offline cache as fallback when offline or Firestore fails
   */
  async getAnalytics(userId: string, habitId: string): Promise<AnalyticsData | null> {
    // First check if we have valid cached data
    const cachedData = offlineAnalyticsCache.getCachedAnalytics(userId, habitId)
    
    // If offline, return cached data immediately
    if (!offlineAnalyticsCache.getOnlineStatus()) {
      return cachedData
    }
    
    try {
      const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
      const analyticsDoc = await getDoc(analyticsRef)
      
      if (!analyticsDoc.exists()) {
        return cachedData // Return cached data if no remote data exists
      }
      
      const remoteData = analyticsDoc.data() as AnalyticsData
      
      // Cache the fresh data from Firestore
      offlineAnalyticsCache.cacheAnalytics(userId, habitId, remoteData)
      
      return remoteData
    } catch (error) {
      console.warn('Failed to fetch analytics from Firestore, using cache:', error)
      // Return cached data as fallback
      return cachedData
    }
  }
  
  /**
   * Save analytics data for a specific habit
   * Caches data locally and syncs to Firestore when online
   */
  async saveAnalytics(userId: string, habitId: string, analytics: AnalyticsData): Promise<void> {
    // Always cache the data locally first
    offlineAnalyticsCache.cacheAnalytics(userId, habitId, analytics)
    
    // If offline, the data will be synced when connectivity is restored
    if (!offlineAnalyticsCache.getOnlineStatus()) {
      console.log('Offline: Analytics cached locally, will sync when online')
      return
    }
    
    try {
      const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
      await setDoc(analyticsRef, analytics, { merge: true })
    } catch (error) {
      console.warn('Failed to save analytics to Firestore, data cached locally:', error)
      // Data is already cached, so this is not a critical failure
      throw error
    }
  }
  
  /**
   * Get analytics for all habits of a user
   * Uses cached data when offline or as fallback
   */
  async getAllUserAnalytics(userId: string): Promise<AnalyticsData[]> {
    // If offline, try to get all cached analytics for the user
    if (!offlineAnalyticsCache.getOnlineStatus()) {
      const cachedKeys = offlineAnalyticsCache.getUserCachedKeys(userId)
      const cachedAnalytics: AnalyticsData[] = []
      
      cachedKeys.forEach(key => {
        // Extract habitId from cache key
        const habitId = key.replace(`analytics_cache_${userId}_`, '')
        const cached = offlineAnalyticsCache.getCachedAnalytics(userId, habitId)
        if (cached) {
          cachedAnalytics.push(cached)
        }
      })
      
      return cachedAnalytics
    }
    
    try {
      // Get all habits for the user
      const habitsRef = collection(db, 'users', userId, 'habits')
      const habitsSnapshot = await getDocs(habitsRef)
      
      const analyticsPromises = habitsSnapshot.docs.map(async (habitDoc) => {
        // Try to get from our getAnalytics method which handles caching
        return await this.getAnalytics(userId, habitDoc.id)
      })
      
      const analyticsResults = await Promise.all(analyticsPromises)
      return analyticsResults.filter((a): a is AnalyticsData => a !== null)
    } catch (error) {
      console.warn('Failed to fetch all user analytics from Firestore, using cache:', error)
      
      // Fallback to cached data
      const cachedKeys = offlineAnalyticsCache.getUserCachedKeys(userId)
      const cachedAnalytics: AnalyticsData[] = []
      
      cachedKeys.forEach(key => {
        const habitId = key.replace(`analytics_cache_${userId}_`, '')
        const cached = offlineAnalyticsCache.getCachedAnalytics(userId, habitId)
        if (cached) {
          cachedAnalytics.push(cached)
        }
      })
      
      return cachedAnalytics
    }
  }
  
  /**
   * Delete analytics data for a specific habit
   */
  async deleteAnalytics(userId: string, habitId: string): Promise<void> {
    const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(analyticsRef)
  }
  
  /**
   * Check if analytics data exists for a habit
   */
  async analyticsExists(userId: string, habitId: string): Promise<boolean> {
    const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
    const analyticsDoc = await getDoc(analyticsRef)
    return analyticsDoc.exists()
  }
  
  /**
   * Get the last calculation timestamp for analytics
   */
  async getLastCalculationTime(userId: string, habitId: string): Promise<Timestamp | null> {
    const analytics = await this.getAnalytics(userId, habitId)
    return analytics?.calculatedAt || null
  }
}

// Export singleton instance
export const analyticsRepository = new AnalyticsRepository()
