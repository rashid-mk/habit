import { 
  doc, 
  onSnapshot, 
  setDoc, 
  Timestamp,
  serverTimestamp,
  getDoc,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AnalyticsData } from '../types/analytics'
// import { offlineAnalyticsCache } from './OfflineAnalyticsCache'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'

export interface SyncMetadata {
  lastSyncAt: Timestamp
  deviceId: string
  version: number
}

export interface SyncableAnalyticsData extends AnalyticsData {
  syncMetadata: SyncMetadata
}

/**
 * SyncService handles real-time synchronization of analytics data across multiple devices
 */
export class SyncService {
  private listeners: Map<string, Unsubscribe> = new Map()
  private deviceId: string
  private offlineCache: Map<string, SyncableAnalyticsData> = new Map()
  private syncStatusCallbacks: Set<(status: SyncStatus) => void> = new Set()
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    // Generate a unique device ID for this session
    this.deviceId = this.generateDeviceId()
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  /**
   * Generate a unique device identifier
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sync analytics data to Firestore
   */
  async syncAnalytics(
    userId: string, 
    habitId: string, 
    analytics: AnalyticsData
  ): Promise<void> {
    const syncKey = `${userId}_${habitId}`
    
    try {
      this.notifySyncStatus('syncing')
      
      const syncableData: SyncableAnalyticsData = {
        ...analytics,
        syncMetadata: {
          lastSyncAt: serverTimestamp() as Timestamp,
          deviceId: this.deviceId,
          version: Date.now()
        }
      }

      // If offline, cache the data
      if (!navigator.onLine) {
        this.offlineCache.set(syncKey, syncableData)
        this.notifySyncStatus('offline')
        return
      }

      const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
      
      // Check for existing data to handle potential conflicts
      const existingDoc = await getDoc(analyticsRef)
      if (existingDoc.exists()) {
        const existingData = existingDoc.data() as SyncableAnalyticsData
        
        // Check if there's a potential conflict (different device, recent update)
        if (existingData.syncMetadata?.deviceId !== this.deviceId) {
          const existingTime = existingData.syncMetadata?.lastSyncAt?.toMillis() || 0
          const newTime = syncableData.syncMetadata.lastSyncAt?.toMillis() || Date.now()
          const timeDiff = Math.abs(newTime - existingTime)
          
          // If the existing data is very recent (within 5 seconds), resolve conflict
          if (timeDiff < 5000) {
            console.log('Potential simultaneous update detected, resolving conflict')
            const resolvedData = this.resolveConflict(syncableData, existingData)
            await setDoc(analyticsRef, resolvedData, { merge: true })
          } else {
            // Normal update, no conflict
            await setDoc(analyticsRef, syncableData, { merge: true })
          }
        } else {
          // Same device, normal update
          await setDoc(analyticsRef, syncableData, { merge: true })
        }
      } else {
        // No existing data, normal write
        await setDoc(analyticsRef, syncableData, { merge: true })
      }
      
      // Clear any cached data for this key
      this.offlineCache.delete(syncKey)
      
      // Clear retry timeout if it exists
      const retryTimeout = this.retryTimeouts.get(syncKey)
      if (retryTimeout) {
        clearTimeout(retryTimeout)
        this.retryTimeouts.delete(syncKey)
      }
      
      this.notifySyncStatus('synced')
    } catch (error) {
      console.error('Sync error:', error)
      this.notifySyncStatus('error')
      
      // Cache the data for retry
      const syncableData: SyncableAnalyticsData = {
        ...analytics,
        syncMetadata: {
          lastSyncAt: Timestamp.now(),
          deviceId: this.deviceId,
          version: Date.now()
        }
      }
      this.offlineCache.set(syncKey, syncableData)
      
      // Schedule retry
      this.scheduleRetry(userId, habitId, syncKey)
    }
  }

  /**
   * Subscribe to analytics updates from other devices
   */
  subscribeToAnalyticsUpdates(
    userId: string,
    habitId: string,
    callback: (analytics: SyncableAnalyticsData) => void
  ): Unsubscribe {
    const syncKey = `${userId}_${habitId}`
    
    // Clean up existing listener if any
    const existingListener = this.listeners.get(syncKey)
    if (existingListener) {
      existingListener()
    }

    const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
    
    const unsubscribe = onSnapshot(
      analyticsRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.exists() && !snapshot.metadata.fromCache) {
          const data = snapshot.data() as SyncableAnalyticsData
          
          // Only process updates from other devices
          if (data.syncMetadata?.deviceId !== this.deviceId) {
            callback(data)
          }
        }
      },
      (error) => {
        console.error('Analytics subscription error:', error)
        this.notifySyncStatus('error')
      }
    )

    this.listeners.set(syncKey, unsubscribe)
    return unsubscribe
  }

  /**
   * Resolve conflicts between local and remote data using timestamps
   * Handles simultaneous updates from multiple devices by merging non-conflicting fields
   */
  resolveConflict(
    local: SyncableAnalyticsData, 
    remote: SyncableAnalyticsData
  ): SyncableAnalyticsData {
    const localTime = local.syncMetadata?.lastSyncAt?.toMillis() || 0
    const remoteTime = remote.syncMetadata?.lastSyncAt?.toMillis() || 0
    const localVersion = local.syncMetadata?.version || 0
    const remoteVersion = remote.syncMetadata?.version || 0
    
    // Log conflict for debugging
    console.log('Resolving sync conflict:', {
      localDevice: local.syncMetadata?.deviceId,
      remoteDevice: remote.syncMetadata?.deviceId,
      localTime,
      remoteTime,
      localVersion,
      remoteVersion,
      timeDiff: Math.abs(localTime - remoteTime)
    })
    
    // If timestamps are significantly different (>1000ms), use the newer one
    const timeDifference = Math.abs(localTime - remoteTime)
    if (timeDifference > 1000) {
      const winner = localTime > remoteTime ? local : remote
      console.log('Conflict resolved by timestamp:', {
        winner: winner.syncMetadata?.deviceId,
        timeDifference
      })
      return winner
    }
    
    // For near-simultaneous updates (within 1 second), try to merge non-conflicting fields
    if (timeDifference <= 1000) {
      console.log('Attempting field-level merge for simultaneous updates')
      return this.mergeAnalyticsData(local, remote, localTime, remoteTime, localVersion, remoteVersion)
    }
    
    // Fallback to version-based resolution for non-simultaneous updates
    const winner = localVersion >= remoteVersion ? local : remote
    console.log('Conflict resolved by version:', {
      winner: winner.syncMetadata?.deviceId,
      versionDiff: Math.abs(localVersion - remoteVersion)
    })
    return winner
  }

  /**
   * Merge non-conflicting fields from simultaneous updates
   */
  private mergeAnalyticsData(
    local: SyncableAnalyticsData,
    remote: SyncableAnalyticsData,
    localTime: number,
    remoteTime: number,
    localVersion: number,
    remoteVersion: number
  ): SyncableAnalyticsData {
    // Start with the data that has the higher version as base
    const base = localVersion >= remoteVersion ? local : remote
    
    // Create merged result
    const merged: SyncableAnalyticsData = {
      ...base,
      syncMetadata: {
        lastSyncAt: localTime >= remoteTime ? local.syncMetadata!.lastSyncAt : remote.syncMetadata!.lastSyncAt,
        deviceId: base.syncMetadata!.deviceId,
        version: Math.max(localVersion, remoteVersion) + 1 // Increment version for merged data
      }
    }
    
    // Merge insights - combine unique insights from both sources
    if (local.insights && remote.insights && (local.insights.length > 0 || remote.insights.length > 0)) {
      const allInsights = [...local.insights, ...remote.insights]
      const seenIds = new Set<string>()
      
      // Deduplicate insights by ID
      merged.insights = allInsights.filter(insight => {
        if (seenIds.has(insight.id)) {
          return false
        }
        seenIds.add(insight.id)
        return true
      })
      
      console.log('Merged insights:', {
        localCount: local.insights.length,
        remoteCount: remote.insights.length,
        mergedCount: merged.insights.length
      })
    }
    
    // For numerical data, prefer the most recent calculation
    // This includes trends, dayOfWeekStats, timeOfDayDistribution, monthComparison
    // These are typically calculated from the same source data, so we don't merge them
    
    // Update data point count to reflect the merge
    merged.dataPointCount = Math.max(local.dataPointCount || 0, remote.dataPointCount || 0)
    
    // Use the oldest data point from either source
    if (local.oldestDataPoint && remote.oldestDataPoint) {
      const localOldest = local.oldestDataPoint.toMillis()
      const remoteOldest = remote.oldestDataPoint.toMillis()
      merged.oldestDataPoint = localOldest <= remoteOldest ? local.oldestDataPoint : remote.oldestDataPoint
    }
    
    // Use the newest data point from either source
    if (local.newestDataPoint && remote.newestDataPoint) {
      const localNewest = local.newestDataPoint.toMillis()
      const remoteNewest = remote.newestDataPoint.toMillis()
      merged.newestDataPoint = localNewest >= remoteNewest ? local.newestDataPoint : remote.newestDataPoint
    }
    
    console.log('Field-level merge completed:', {
      baseDevice: base.syncMetadata?.deviceId,
      mergedVersion: merged.syncMetadata.version,
      dataPointCount: merged.dataPointCount
    })
    
    return merged
  }

  /**
   * Cache analytics data offline
   */
  cacheAnalyticsOffline(userId: string, habitId: string, analytics: AnalyticsData): void {
    const syncKey = `${userId}_${habitId}`
    const syncableData: SyncableAnalyticsData = {
      ...analytics,
      syncMetadata: {
        lastSyncAt: Timestamp.now(),
        deviceId: this.deviceId,
        version: Date.now()
      }
    }
    
    this.offlineCache.set(syncKey, syncableData)
  }

  /**
   * Get cached analytics data
   */
  getCachedAnalytics(userId: string, habitId: string): SyncableAnalyticsData | null {
    const syncKey = `${userId}_${habitId}`
    return this.offlineCache.get(syncKey) || null
  }

  /**
   * Sync all cached data when coming back online
   */
  private async syncCachedData(): Promise<void> {
    if (!navigator.onLine || this.offlineCache.size === 0) {
      return
    }

    this.notifySyncStatus('syncing')
    
    const syncPromises = Array.from(this.offlineCache.entries()).map(
      async ([syncKey, data]) => {
        const [userId, habitId] = syncKey.split('_')
        
        try {
          // Check if remote data is newer
          const analyticsRef = doc(db, 'users', userId, 'habits', habitId, 'premiumAnalytics', 'data')
          const remoteDoc = await getDoc(analyticsRef)
          
          if (remoteDoc.exists()) {
            const remoteData = remoteDoc.data() as SyncableAnalyticsData
            const resolvedData = this.resolveConflict(data, remoteData)
            
            console.log('Syncing cached data with conflict resolution:', {
              cachedDevice: data.syncMetadata?.deviceId,
              remoteDevice: remoteData.syncMetadata?.deviceId,
              resolvedDevice: resolvedData.syncMetadata?.deviceId
            })
            
            // Always sync the resolved data (could be merged result)
            await setDoc(analyticsRef, resolvedData, { merge: true })
          } else {
            // No remote data, sync our cached data
            console.log('Syncing cached data (no remote conflict):', {
              device: data.syncMetadata?.deviceId
            })
            await setDoc(analyticsRef, data, { merge: true })
          }
          
          // Remove from cache after successful sync
          this.offlineCache.delete(syncKey)
        } catch (error) {
          console.error(`Failed to sync cached data for ${syncKey}:`, error)
          // Keep in cache for next retry
        }
      }
    )

    await Promise.allSettled(syncPromises)
    
    if (this.offlineCache.size === 0) {
      this.notifySyncStatus('synced')
    } else {
      this.notifySyncStatus('error')
    }
  }

  /**
   * Schedule retry for failed sync operations
   */
  private scheduleRetry(userId: string, habitId: string, syncKey: string): void {
    // Clear existing timeout
    const existingTimeout = this.retryTimeouts.get(syncKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Retry after 5 seconds
    const timeout = setTimeout(async () => {
      const cachedData = this.offlineCache.get(syncKey)
      if (cachedData && navigator.onLine) {
        try {
          await this.syncAnalytics(userId, habitId, cachedData)
        } catch (error) {
          console.error('Retry sync failed:', error)
          // Will schedule another retry through the error handling in syncAnalytics
        }
      }
    }, 5000)

    this.retryTimeouts.set(syncKey, timeout)
  }

  /**
   * Handle coming back online
   */
  private async handleOnline(): Promise<void> {
    await this.syncCachedData()
    
    // Also sync any data cached in the offline analytics cache
    await this.syncOfflineAnalyticsCache()
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    this.notifySyncStatus('offline')
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncStatusCallbacks.add(callback)
    
    return () => {
      this.syncStatusCallbacks.delete(callback)
    }
  }

  /**
   * Notify all subscribers of sync status changes
   */
  private notifySyncStatus(status: SyncStatus): void {
    this.syncStatusCallbacks.forEach(callback => callback(status))
  }

  /**
   * Sync offline analytics cache when coming back online
   */
  private async syncOfflineAnalyticsCache(): Promise<void> {
    // This method coordinates with the offline analytics cache
    // The actual syncing is handled by the analyticsRepository
    // when it detects we're back online
    console.log('Coordinating offline analytics cache sync...')
  }

  /**
   * Clean up all listeners and timeouts
   */
  cleanup(): void {
    // Clean up Firestore listeners
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners.clear()
    
    // Clean up retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    
    // Clean up event listeners
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    
    // Clear callbacks
    this.syncStatusCallbacks.clear()
  }
}

// Export singleton instance
export const syncService = new SyncService()