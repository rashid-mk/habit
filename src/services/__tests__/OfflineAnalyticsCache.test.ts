import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OfflineAnalyticsCache } from '../OfflineAnalyticsCache'
import { AnalyticsData } from '../../types/analytics'
import { Timestamp } from 'firebase/firestore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock window events
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener })
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener })

describe('OfflineAnalyticsCache', () => {
  let cache: OfflineAnalyticsCache
  let mockAnalyticsData: AnalyticsData

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // Create a new cache instance for each test
    cache = new OfflineAnalyticsCache()
    
    // Mock analytics data
    mockAnalyticsData = {
      habitId: 'habit-123',
      userId: 'user-456',
      calculatedAt: Timestamp.now(),
      trends: {
        fourWeeks: {
          period: '4W',
          completionRate: 85,
          averageProgress: 7.5,
          percentageChange: 12.5,
          direction: 'up',
          dataPoints: []
        },
        threeMonths: {
          period: '3M',
          completionRate: 78,
          averageProgress: 6.8,
          percentageChange: 8.2,
          direction: 'up',
          dataPoints: []
        },
        sixMonths: {
          period: '6M',
          completionRate: 72,
          averageProgress: 6.2,
          percentageChange: 5.1,
          direction: 'up',
          dataPoints: []
        },
        oneYear: {
          period: '1Y',
          completionRate: 68,
          averageProgress: 5.9,
          percentageChange: 2.3,
          direction: 'up',
          dataPoints: []
        }
      },
      dayOfWeekStats: {
        monday: { completionRate: 80, totalCompletions: 8, totalScheduled: 10 },
        tuesday: { completionRate: 85, totalCompletions: 9, totalScheduled: 10 },
        wednesday: { completionRate: 75, totalCompletions: 7, totalScheduled: 10 },
        thursday: { completionRate: 90, totalCompletions: 9, totalScheduled: 10 },
        friday: { completionRate: 70, totalCompletions: 7, totalScheduled: 10 },
        saturday: { completionRate: 85, totalCompletions: 8, totalScheduled: 10 },
        sunday: { completionRate: 80, totalCompletions: 8, totalScheduled: 10 },
        bestDay: 'thursday',
        worstDay: 'friday'
      },
      timeOfDayDistribution: {
        hourlyDistribution: { 9: 5, 10: 3, 18: 7, 19: 4 },
        peakHours: [18],
        optimalReminderTimes: [18, 9]
      },
      monthComparison: {
        currentMonth: { completionRate: 85, totalCompletions: 25, totalScheduled: 30 },
        previousMonth: { completionRate: 78, totalCompletions: 23, totalScheduled: 30 },
        percentageChange: 8.97,
        isSignificant: false
      },
      insights: [],
      dataPointCount: 100,
      oldestDataPoint: Timestamp.now(),
      newestDataPoint: Timestamp.now()
    }
  })

  afterEach(() => {
    cache.cleanup()
  })

  describe('cacheAnalytics', () => {
    it('should cache analytics data in localStorage', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      
      const cacheKey = `analytics_cache_${userId}_${habitId}`
      const cachedItem = localStorage.getItem(cacheKey)
      
      expect(cachedItem).toBeTruthy()
      
      const parsedData = JSON.parse(cachedItem!)
      expect(parsedData.data.habitId).toBe(mockAnalyticsData.habitId)
      expect(parsedData.data.userId).toBe(mockAnalyticsData.userId)
      expect(parsedData.cachedAt).toBeGreaterThan(0)
      expect(parsedData.expiresAt).toBeGreaterThan(parsedData.cachedAt)
    })

    it('should handle localStorage errors gracefully', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })
      
      // Should not throw an error
      expect(() => {
        cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      }).not.toThrow()
      
      // Restore original setItem
      localStorage.setItem = originalSetItem
    })
  })

  describe('getCachedAnalytics', () => {
    it('should return cached analytics data if not expired', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      const retrieved = cache.getCachedAnalytics(userId, habitId)
      
      expect(retrieved).toBeTruthy()
      expect(retrieved!.habitId).toBe(mockAnalyticsData.habitId)
      expect(retrieved!.userId).toBe(mockAnalyticsData.userId)
    })

    it('should return null if no cached data exists', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      const retrieved = cache.getCachedAnalytics(userId, habitId)
      
      expect(retrieved).toBeNull()
    })

    it('should return null and remove expired cache entries', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      // Manually create an expired cache entry
      const expiredData = {
        data: mockAnalyticsData,
        cachedAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        expiresAt: Date.now() - 5 * 60 * 1000   // Expired 5 minutes ago
      }
      
      const cacheKey = `analytics_cache_${userId}_${habitId}`
      localStorage.setItem(cacheKey, JSON.stringify(expiredData))
      
      const retrieved = cache.getCachedAnalytics(userId, habitId)
      
      expect(retrieved).toBeNull()
      expect(localStorage.getItem(cacheKey)).toBeNull()
    })

    it('should handle corrupted cache data gracefully', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      // Set corrupted data
      const cacheKey = `analytics_cache_${userId}_${habitId}`
      localStorage.setItem(cacheKey, 'invalid-json')
      
      const retrieved = cache.getCachedAnalytics(userId, habitId)
      
      expect(retrieved).toBeNull()
    })
  })

  describe('isCached', () => {
    it('should return true if valid cache exists', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      
      expect(cache.isCached(userId, habitId)).toBe(true)
    })

    it('should return false if no cache exists', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      expect(cache.isCached(userId, habitId)).toBe(false)
    })

    it('should return false if cache is expired', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      // Create expired cache entry
      const expiredData = {
        data: mockAnalyticsData,
        cachedAt: Date.now() - 10 * 60 * 1000,
        expiresAt: Date.now() - 1000
      }
      
      const cacheKey = `analytics_cache_${userId}_${habitId}`
      localStorage.setItem(cacheKey, JSON.stringify(expiredData))
      
      expect(cache.isCached(userId, habitId)).toBe(false)
    })
  })

  describe('getCacheAge', () => {
    it('should return correct cache age', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      
      const age = cache.getCacheAge(userId, habitId)
      
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThan(1000) // Should be very recent
    })

    it('should return null if no cache exists', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      const age = cache.getCacheAge(userId, habitId)
      
      expect(age).toBeNull()
    })
  })

  describe('removeCachedAnalytics', () => {
    it('should remove cached analytics for specific habit', () => {
      const userId = 'user-123'
      const habitId = 'habit-456'
      
      cache.cacheAnalytics(userId, habitId, mockAnalyticsData)
      expect(cache.isCached(userId, habitId)).toBe(true)
      
      cache.removeCachedAnalytics(userId, habitId)
      expect(cache.isCached(userId, habitId)).toBe(false)
    })
  })

  describe('getUserCachedKeys', () => {
    it('should return all cache keys for a user', () => {
      const userId = 'user-123'
      
      cache.cacheAnalytics(userId, 'habit-1', mockAnalyticsData)
      cache.cacheAnalytics(userId, 'habit-2', mockAnalyticsData)
      cache.cacheAnalytics('other-user', 'habit-3', mockAnalyticsData)
      
      const userKeys = cache.getUserCachedKeys(userId)
      
      expect(userKeys).toHaveLength(2)
      expect(userKeys.every(key => key.includes(userId))).toBe(true)
    })
  })

  describe('clearUserCache', () => {
    it('should clear all cached analytics for a user', () => {
      const userId = 'user-123'
      
      cache.cacheAnalytics(userId, 'habit-1', mockAnalyticsData)
      cache.cacheAnalytics(userId, 'habit-2', mockAnalyticsData)
      cache.cacheAnalytics('other-user', 'habit-3', mockAnalyticsData)
      
      cache.clearUserCache(userId)
      
      expect(cache.getUserCachedKeys(userId)).toHaveLength(0)
      expect(cache.getUserCachedKeys('other-user')).toHaveLength(1)
    })
  })

  describe('cleanupExpiredEntries', () => {
    it('should remove expired cache entries', () => {
      const userId = 'user-123'
      
      // Add valid cache entry
      cache.cacheAnalytics(userId, 'habit-1', mockAnalyticsData)
      
      // Add expired cache entry manually
      const expiredData = {
        data: mockAnalyticsData,
        cachedAt: Date.now() - 10 * 60 * 1000,
        expiresAt: Date.now() - 1000
      }
      localStorage.setItem('analytics_cache_user-123_habit-2', JSON.stringify(expiredData))
      
      expect(localStorage.length).toBe(3) // 2 cache entries + 1 metadata
      
      cache.cleanupExpiredEntries()
      
      expect(localStorage.length).toBe(2) // 1 valid cache entry + 1 metadata
      expect(cache.isCached(userId, 'habit-1')).toBe(true)
      expect(cache.isCached(userId, 'habit-2')).toBe(false)
    })
  })

  describe('online status tracking', () => {
    it('should track online status correctly', () => {
      expect(cache.getOnlineStatus()).toBe(true)
    })

    it('should register online status change callbacks', () => {
      const callback = vi.fn()
      const unsubscribe = cache.onOnlineStatusChange(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Cleanup
      unsubscribe()
    })
  })

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      const userId = 'user-123'
      
      // Clear any existing cache first
      localStorageMock.clear()
      
      cache.cacheAnalytics(userId, 'habit-1', mockAnalyticsData)
      cache.cacheAnalytics(userId, 'habit-2', mockAnalyticsData)
      
      const stats = cache.getCacheStats()
      
      // Should count only analytics cache entries (2), not metadata (1)
      // But the current implementation counts all cache-related entries
      expect(stats.totalEntries).toBe(2)
      expect(stats.expiredEntries).toBe(0)
      expect(stats.totalSizeBytes).toBeGreaterThan(0)
    })

    it('should count expired entries correctly', () => {
      // Add expired cache entry manually
      const expiredData = {
        data: mockAnalyticsData,
        cachedAt: Date.now() - 10 * 60 * 1000,
        expiresAt: Date.now() - 1000
      }
      localStorage.setItem('analytics_cache_user-123_habit-1', JSON.stringify(expiredData))
      
      const stats = cache.getCacheStats()
      
      expect(stats.totalEntries).toBe(1)
      expect(stats.expiredEntries).toBe(1)
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on cleanup', () => {
      cache.cleanup()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
})