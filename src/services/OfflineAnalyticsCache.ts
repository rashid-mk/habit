import { AnalyticsData } from '../types/analytics'

export interface CachedAnalyticsData {
  data: AnalyticsData
  cachedAt: number // timestamp
  expiresAt: number // timestamp
}

export interface OfflineCacheMetadata {
  version: string
  lastCleanup: number
}

/**
 * OfflineAnalyticsCache handles local storage caching for analytics data
 * Implements 5-minute cache invalidation and offline fallback functionality
 */
export class OfflineAnalyticsCache {
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
  private static readonly CACHE_KEY_PREFIX = 'analytics_cache_'
  private static readonly METADATA_KEY = 'analytics_cache_metadata'
  private static readonly CACHE_VERSION = '1.0.0'
  
  private onlineStatusCallbacks: Set<(isOnline: boolean) => void> = new Set()
  private isOnline: boolean = navigator.onLine

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Clean up expired cache entries on initialization
    this.cleanupExpiredEntries()
  }

  /**
   * Cache analytics data in local storage
   */
  cacheAnalytics(userId: string, habitId: string, analytics: AnalyticsData): void {
    try {
      const cacheKey = this.getCacheKey(userId, habitId)
      const now = Date.now()
      
      const cachedData: CachedAnalyticsData = {
        data: analytics,
        cachedAt: now,
        expiresAt: now + OfflineAnalyticsCache.CACHE_DURATION
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cachedData))
      this.updateMetadata()
    } catch (error) {
      console.warn('Failed to cache analytics data:', error)
      // If localStorage is full, try to clean up and retry once
      this.cleanupExpiredEntries()
      try {
        const cacheKey = this.getCacheKey(userId, habitId)
        const now = Date.now()
        
        const cachedData: CachedAnalyticsData = {
          data: analytics,
          cachedAt: now,
          expiresAt: now + OfflineAnalyticsCache.CACHE_DURATION
        }
        
        localStorage.setItem(cacheKey, JSON.stringify(cachedData))
        this.updateMetadata()
      } catch (retryError) {
        console.error('Failed to cache analytics data after cleanup:', retryError)
      }
    }
  }

  /**
   * Get cached analytics data if available and not expired
   */
  getCachedAnalytics(userId: string, habitId: string): AnalyticsData | null {
    try {
      const cacheKey = this.getCacheKey(userId, habitId)
      const cachedItem = localStorage.getItem(cacheKey)
      
      if (!cachedItem) {
        return null
      }
      
      const cachedData: CachedAnalyticsData = JSON.parse(cachedItem)
      const now = Date.now()
      
      // Check if cache has expired
      if (now > cachedData.expiresAt) {
        // Remove expired entry
        localStorage.removeItem(cacheKey)
        return null
      }
      
      // Convert Firestore Timestamp objects back from serialized form
      return this.deserializeAnalyticsData(cachedData.data)
    } catch (error) {
      console.warn('Failed to retrieve cached analytics:', error)
      return null
    }
  }

  /**
   * Check if analytics data is cached and valid
   */
  isCached(userId: string, habitId: string): boolean {
    const cached = this.getCachedAnalytics(userId, habitId)
    return cached !== null
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(userId: string, habitId: string): number | null {
    try {
      const cacheKey = this.getCacheKey(userId, habitId)
      const cachedItem = localStorage.getItem(cacheKey)
      
      if (!cachedItem) {
        return null
      }
      
      const cachedData: CachedAnalyticsData = JSON.parse(cachedItem)
      return Date.now() - cachedData.cachedAt
    } catch (error) {
      return null
    }
  }

  /**
   * Remove cached analytics for a specific habit
   */
  removeCachedAnalytics(userId: string, habitId: string): void {
    try {
      const cacheKey = this.getCacheKey(userId, habitId)
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.warn('Failed to remove cached analytics:', error)
    }
  }

  /**
   * Get all cached analytics keys for a user
   */
  getUserCachedKeys(userId: string): string[] {
    const keys: string[] = []
    const prefix = `${OfflineAnalyticsCache.CACHE_KEY_PREFIX}${userId}_`
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keys.push(key)
        }
      }
    } catch (error) {
      console.warn('Failed to get user cached keys:', error)
    }
    
    return keys
  }

  /**
   * Clear all cached analytics for a user
   */
  clearUserCache(userId: string): void {
    const keys = this.getUserCachedKeys(userId)
    
    keys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove cache key ${key}:`, error)
      }
    })
  }

  /**
   * Clean up all expired cache entries
   */
  cleanupExpiredEntries(): void {
    try {
      const now = Date.now()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(OfflineAnalyticsCache.CACHE_KEY_PREFIX)) {
          try {
            const cachedItem = localStorage.getItem(key)
            if (cachedItem) {
              const cachedData: CachedAnalyticsData = JSON.parse(cachedItem)
              if (now > cachedData.expiresAt) {
                keysToRemove.push(key)
              }
            }
          } catch (error) {
            // If we can't parse the cached item, remove it
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (keysToRemove.length > 0) {
        this.updateMetadata()
      }
    } catch (error) {
      console.warn('Failed to cleanup expired entries:', error)
    }
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Subscribe to online status changes
   */
  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineStatusCallbacks.add(callback)
    
    return () => {
      this.onlineStatusCallbacks.delete(callback)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number
    expiredEntries: number
    totalSizeBytes: number
  } {
    let totalEntries = 0
    let expiredEntries = 0
    let totalSizeBytes = 0
    const now = Date.now()
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(OfflineAnalyticsCache.CACHE_KEY_PREFIX) && key !== OfflineAnalyticsCache.METADATA_KEY) {
          totalEntries++
          
          const cachedItem = localStorage.getItem(key)
          if (cachedItem) {
            totalSizeBytes += cachedItem.length * 2 // Rough estimate (UTF-16)
            
            try {
              const cachedData: CachedAnalyticsData = JSON.parse(cachedItem)
              if (now > cachedData.expiresAt) {
                expiredEntries++
              }
            } catch (error) {
              expiredEntries++
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error)
    }
    
    return {
      totalEntries,
      expiredEntries,
      totalSizeBytes
    }
  }

  /**
   * Generate cache key for user and habit
   */
  private getCacheKey(userId: string, habitId: string): string {
    return `${OfflineAnalyticsCache.CACHE_KEY_PREFIX}${userId}_${habitId}`
  }

  /**
   * Handle coming back online
   */
  private handleOnline(): void {
    this.isOnline = true
    this.notifyOnlineStatusChange(true)
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    this.isOnline = false
    this.notifyOnlineStatusChange(false)
  }

  /**
   * Notify all subscribers of online status changes
   */
  private notifyOnlineStatusChange(isOnline: boolean): void {
    this.onlineStatusCallbacks.forEach(callback => {
      try {
        callback(isOnline)
      } catch (error) {
        console.error('Error in online status callback:', error)
      }
    })
  }

  /**
   * Update cache metadata
   */
  private updateMetadata(): void {
    try {
      const metadata: OfflineCacheMetadata = {
        version: OfflineAnalyticsCache.CACHE_VERSION,
        lastCleanup: Date.now()
      }
      
      localStorage.setItem(OfflineAnalyticsCache.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to update cache metadata:', error)
    }
  }

  /**
   * Deserialize analytics data from cache (handle Firestore Timestamps)
   */
  private deserializeAnalyticsData(data: any): AnalyticsData {
    // Convert timestamp objects back to Firestore Timestamps
    const deserializeTimestamp = (obj: any): any => {
      if (obj && typeof obj === 'object') {
        if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
          // This is a serialized Firestore Timestamp
          const { Timestamp } = require('firebase/firestore')
          return new Timestamp(obj._seconds, obj._nanoseconds)
        }
        
        // Recursively process nested objects
        const result: any = Array.isArray(obj) ? [] : {}
        for (const key in obj) {
          result[key] = deserializeTimestamp(obj[key])
        }
        return result
      }
      
      return obj
    }
    
    return deserializeTimestamp(data) as AnalyticsData
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    this.onlineStatusCallbacks.clear()
  }
}

// Export singleton instance
export const offlineAnalyticsCache = new OfflineAnalyticsCache()