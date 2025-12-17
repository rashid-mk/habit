import { useState, useEffect } from 'react'
import { useAuthState } from './useAuth'
import { accessControlService } from '../services/AccessControlService'
import { PremiumFeature } from '../types/analytics'

export function usePremiumAccess() {
  const { user } = useAuthState()
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false)
        setIsLoading(false)
        return
      }

      try {
        const premiumStatus = await accessControlService.isPremiumUser(user.uid)
        setIsPremium(premiumStatus)
      } catch (error) {
        console.error('Error checking premium status:', error)
        setIsPremium(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPremiumStatus()
  }, [user])

  const checkFeatureAccess = async (feature: PremiumFeature): Promise<boolean> => {
    if (!user) return false
    
    try {
      return await accessControlService.checkFeatureAccess(user.uid, feature)
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  const refreshPremiumStatus = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Clear cache to force fresh check
      accessControlService.clearCache(user.uid)
      const premiumStatus = await accessControlService.isPremiumUser(user.uid)
      setIsPremium(premiumStatus)
    } catch (error) {
      console.error('Error refreshing premium status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isPremium,
    isLoading,
    checkFeatureAccess,
    refreshPremiumStatus
  }
}