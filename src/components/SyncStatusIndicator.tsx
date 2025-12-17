import { useState, useEffect } from 'react'
import { syncService, SyncStatus } from '../services/SyncService'

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Subscribe to sync status changes from SyncService
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status)
      
      // Update last sync time when successfully synced
      if (status === 'synced') {
        setLastSyncTime(new Date())
        setIsRetrying(false)
      }
    })

    return unsubscribe
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    // The SyncService will automatically retry cached data when online
    // We just need to trigger a sync attempt by simulating coming back online
    if (navigator.onLine) {
      window.dispatchEvent(new Event('online'))
    }
    
    // Reset retry state after a delay
    setTimeout(() => {
      setIsRetrying(false)
    }, 2000)
  }

  const formatLastSyncTime = (time: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      const diffHours = Math.floor(diffMinutes / 60)
      return `${diffHours}h ago`
    }
  }

  // Don't show indicator when synced and recently synced
  if (syncStatus === 'synced' && lastSyncTime && (new Date().getTime() - lastSyncTime.getTime()) < 5000) {
    return null
  }

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/90',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700',
          dotColor: 'bg-green-500',
          animate: false,
          message: lastSyncTime ? `Synced ${formatLastSyncTime(lastSyncTime)}` : 'Synced'
        }
      case 'syncing':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/90',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-300 dark:border-blue-700',
          dotColor: 'bg-blue-500',
          animate: true,
          message: 'Syncing...'
        }
      case 'offline':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/90',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          dotColor: 'bg-yellow-500',
          animate: false,
          message: 'Offline - Changes will sync when online'
        }
      case 'error':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/90',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700',
          dotColor: 'bg-red-500',
          animate: false,
          message: 'Sync failed'
        }
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-900/90',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-300 dark:border-gray-700',
          dotColor: 'bg-gray-500',
          animate: false,
          message: 'Unknown status'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 pointer-events-none">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto ${config.bgColor} ${config.textColor} ${config.borderColor} border`}
      >
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} ${config.animate ? 'animate-pulse' : ''}`}
        />
        <span className="text-sm font-medium">
          {config.message}
        </span>
        
        {/* Retry button for error state */}
        {syncStatus === 'error' && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-2 px-2 py-1 text-xs font-medium bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Retry sync"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  )
}
