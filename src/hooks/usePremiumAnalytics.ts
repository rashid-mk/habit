import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthState } from './useAuth'
import { analyticsRepository } from '../services/analyticsRepository'
import { AnalyticsData } from '../types/analytics'
import { offlineAnalyticsCache } from '../services/OfflineAnalyticsCache'
import { useEffect, useState } from 'react'

/**
 * Hook to fetch premium analytics for a specific habit
 * Caches data for 5 minutes as per requirements and provides offline fallback
 */
export function usePremiumAnalytics(habitId: string) {
  const { user } = useAuthState()
  const [isOffline, setIsOffline] = useState(!offlineAnalyticsCache.getOnlineStatus())

  useEffect(() => {
    const unsubscribe = offlineAnalyticsCache.onOnlineStatusChange((online) => {
      setIsOffline(!online)
    })

    return unsubscribe
  }, [])

  return useQuery({
    queryKey: ['premiumAnalytics', user?.uid, habitId, isOffline ? 'offline' : 'online'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch premium analytics')
      }

      try {
        const analytics = await analyticsRepository.getAnalytics(user.uid, habitId)
        return analytics
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view premium analytics')
        } else if (error.code === 'unavailable') {
          // Try to get cached data when Firestore is unavailable
          const cachedData = offlineAnalyticsCache.getCachedAnalytics(user.uid, habitId)
          if (cachedData) {
            return cachedData
          }
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          // For other errors, try cached data as fallback
          const cachedData = offlineAnalyticsCache.getCachedAnalytics(user.uid, habitId)
          if (cachedData) {
            return cachedData
          }
          throw new Error('Failed to load premium analytics. Please try again')
        }
      }
    },
    enabled: !!user && !!habitId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache as per requirements (11.4)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if we're offline or if it's a permission error
      if (isOffline || error.message.includes('permission')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to fetch premium analytics for all user habits
 * Provides offline fallback using cached data
 */
export function useAllPremiumAnalytics() {
  const { user } = useAuthState()
  const [isOffline, setIsOffline] = useState(!offlineAnalyticsCache.getOnlineStatus())

  useEffect(() => {
    const unsubscribe = offlineAnalyticsCache.onOnlineStatusChange((online) => {
      setIsOffline(!online)
    })

    return unsubscribe
  }, [])

  return useQuery({
    queryKey: ['premiumAnalytics', user?.uid, 'all', isOffline ? 'offline' : 'online'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch premium analytics')
      }

      try {
        const analytics = await analyticsRepository.getAllUserAnalytics(user.uid)
        return analytics
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view premium analytics')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Using cached data where available')
        } else {
          throw new Error('Failed to load premium analytics. Using cached data where available')
        }
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry if we're offline or if it's a permission error
      if (isOffline || error.message.includes('permission')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to save/update premium analytics
 */
export function useSavePremiumAnalytics() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, analytics }: { habitId: string; analytics: AnalyticsData }) => {
      if (!user) {
        throw new Error('User must be authenticated to save premium analytics')
      }

      try {
        await analyticsRepository.saveAnalytics(user.uid, habitId, analytics)
        return { success: true }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to save premium analytics')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Changes will sync when online')
        } else {
          throw new Error('Failed to save premium analytics. Please try again')
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ 
        queryKey: ['premiumAnalytics', user?.uid, variables.habitId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['premiumAnalytics', user?.uid, 'all'] 
      })
    },
  })
}

/**
 * Hook to check if analytics exists for a habit
 */
export function useAnalyticsExists(habitId: string) {
  const { user } = useAuthState()

  return useQuery({
    queryKey: ['analyticsExists', user?.uid, habitId],
    queryFn: async () => {
      if (!user) {
        return false
      }

      try {
        return await analyticsRepository.analyticsExists(user.uid, habitId)
      } catch (error) {
        return false
      }
    },
    enabled: !!user && !!habitId,
    staleTime: 5 * 60 * 1000,
  })
}
