import { useState, useEffect } from 'react'
import { offlineAnalyticsCache } from '../services/OfflineAnalyticsCache'
import { useAuthState } from './useAuth'

/**
 * Hook to manage offline analytics functionality
 * Provides online status, cache information, and cache management
 */
export function useOfflineAnalytics() {
  const { user } = useAuthState()
  const [isOnline, setIsOnline] = useState(offlineAnalyticsCache.getOnlineStatus())
  const [cacheStats, setCacheStats] = useState(offlineAnalyticsCache.getCacheStats())

  useEffect(() => {
    // Subscribe to online status changes
    const unsubscribe = offlineAnalyticsCache.onOnlineStatusChange((online) => {
      setIsOnline(online)
      
      // Update cache stats when status changes
      setCacheStats(offlineAnalyticsCache.getCacheStats())
    })

    // Update cache stats periodically
    const statsInterval = setInterval(() => {
      setCacheStats(offlineAnalyticsCache.getCacheStats())
    }, 30000) // Update every 30 seconds

    return () => {
      unsubscribe()
      clearInterval(statsInterval)
    }
  }, [])

  /**
   * Check if specific analytics are cached
   */
  const isAnalyticsCached = (habitId: string): boolean => {
    if (!user) return false
    return offlineAnalyticsCache.isCached(user.uid, habitId)
  }

  /**
   * Get cache age for specific analytics
   */
  const getCacheAge = (habitId: string): number | null => {
    if (!user) return null
    return offlineAnalyticsCache.getCacheAge(user.uid, habitId)
  }

  /**
   * Clear cache for specific habit
   */
  const clearHabitCache = (habitId: string): void => {
    if (!user) return
    offlineAnalyticsCache.removeCachedAnalytics(user.uid, habitId)
    setCacheStats(offlineAnalyticsCache.getCacheStats())
  }

  /**
   * Clear all cached analytics for current user
   */
  const clearAllCache = (): void => {
    if (!user) return
    offlineAnalyticsCache.clearUserCache(user.uid)
    setCacheStats(offlineAnalyticsCache.getCacheStats())
  }

  /**
   * Clean up expired cache entries
   */
  const cleanupExpiredCache = (): void => {
    offlineAnalyticsCache.cleanupExpiredEntries()
    setCacheStats(offlineAnalyticsCache.getCacheStats())
  }

  /**
   * Format cache age as human readable string
   */
  const formatCacheAge = (ageMs: number | null): string => {
    if (ageMs === null) return 'Not cached'
    
    const minutes = Math.floor(ageMs / (1000 * 60))
    const seconds = Math.floor((ageMs % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`
    } else {
      return `${seconds}s ago`
    }
  }

  /**
   * Format cache size as human readable string
   */
  const formatCacheSize = (sizeBytes: number): string => {
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`
    } else if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  return {
    // Status
    isOnline,
    
    // Cache information
    cacheStats,
    
    // Cache queries
    isAnalyticsCached,
    getCacheAge,
    
    // Cache management
    clearHabitCache,
    clearAllCache,
    cleanupExpiredCache,
    
    // Utilities
    formatCacheAge,
    formatCacheSize,
  }
}

/**
 * Hook to get offline indicator status for UI
 */
export function useOfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!offlineAnalyticsCache.getOnlineStatus())
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const unsubscribe = offlineAnalyticsCache.onOnlineStatusChange((online) => {
      setIsOffline(!online)
      
      if (!online) {
        // Show indicator immediately when going offline
        setShowIndicator(true)
      } else {
        // Hide indicator after a short delay when coming back online
        setTimeout(() => setShowIndicator(false), 2000)
      }
    })

    // Set initial state
    setIsOffline(!offlineAnalyticsCache.getOnlineStatus())
    setShowIndicator(!offlineAnalyticsCache.getOnlineStatus())

    return unsubscribe
  }, [])

  return {
    isOffline,
    showIndicator,
  }
}