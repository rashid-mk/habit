import { useState, useEffect } from 'react'
import { syncService, SyncStatus } from '../services/SyncService'

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    // Listen to browser online/offline events
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Subscribe to sync status changes from SyncService
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status)
      
      // Update last sync time when successfully synced
      if (status === 'synced') {
        setLastSyncTime(new Date())
      }
    })

    return unsubscribe
  }, [])

  return { 
    syncStatus, 
    isOnline, 
    lastSyncTime 
  }
}
