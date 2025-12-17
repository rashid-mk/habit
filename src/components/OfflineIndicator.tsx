import { useOfflineIndicator, useOfflineAnalytics } from '../hooks/useOfflineAnalytics'

/**
 * OfflineIndicator displays when the user is offline
 * Shows cached data availability and sync status
 */
export function OfflineIndicator() {
  const { isOffline, showIndicator } = useOfflineIndicator()

  if (!showIndicator) {
    return null
  }

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      px-4 py-2 rounded-lg shadow-lg
      transition-all duration-300 ease-in-out
      ${isOffline 
        ? 'bg-orange-100 border border-orange-200 text-orange-800' 
        : 'bg-green-100 border border-green-200 text-green-800'
      }
    `}>
      <div className="flex items-center space-x-2">
        <div className={`
          w-2 h-2 rounded-full
          ${isOffline ? 'bg-orange-500' : 'bg-green-500'}
        `} />
        <span className="text-sm font-medium">
          {isOffline ? (
            'Offline - Using cached data'
          ) : (
            'Back online - Syncing data'
          )}
        </span>
      </div>
    </div>
  )
}

/**
 * CacheStatusBadge shows cache information for analytics
 */
interface CacheStatusBadgeProps {
  habitId: string
  className?: string
}

export function CacheStatusBadge({ habitId, className = '' }: CacheStatusBadgeProps) {
  const { isOnline, isAnalyticsCached, getCacheAge, formatCacheAge } = useOfflineAnalytics()
  
  const isCached = isAnalyticsCached(habitId)
  const cacheAge = getCacheAge(habitId)
  
  if (!isCached && isOnline) {
    return null // No need to show anything when online and not cached
  }

  return (
    <div className={`
      inline-flex items-center px-2 py-1 rounded-md text-xs
      ${isCached 
        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
      }
      ${className}
    `}>
      <div className={`
        w-1.5 h-1.5 rounded-full mr-1.5
        ${isCached ? 'bg-blue-500' : 'bg-gray-400'}
      `} />
      {isCached ? (
        <span>Cached {formatCacheAge(cacheAge)}</span>
      ) : (
        <span>No cache</span>
      )}
    </div>
  )
}

/**
 * AnalyticsCacheInfo shows detailed cache information
 */
export function AnalyticsCacheInfo() {
  const { 
    isOnline, 
    cacheStats, 
    clearAllCache, 
    cleanupExpiredCache, 
    formatCacheSize 
  } = useOfflineAnalytics()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Analytics Cache Status
      </h3>
      
      <div className="space-y-3">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection Status</span>
          <div className="flex items-center space-x-2">
            <div className={`
              w-2 h-2 rounded-full
              ${isOnline ? 'bg-green-500' : 'bg-orange-500'}
            `} />
            <span className={`text-sm font-medium ${
              isOnline ? 'text-green-700' : 'text-orange-700'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Cached Items
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {cacheStats.totalEntries}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Cache Size
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCacheSize(cacheStats.totalSizeBytes)}
            </div>
          </div>
        </div>

        {/* Expired Entries */}
        {cacheStats.expiredEntries > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-orange-600">
              {cacheStats.expiredEntries} expired entries
            </span>
            <button
              onClick={cleanupExpiredCache}
              className="text-xs text-orange-600 hover:text-orange-700 underline"
            >
              Clean up
            </button>
          </div>
        )}

        {/* Cache Actions */}
        {cacheStats.totalEntries > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={clearAllCache}
              className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 
                       border border-red-200 hover:border-red-300 rounded-md
                       transition-colors duration-200"
            >
              Clear All Cache
            </button>
          </div>
        )}
      </div>
    </div>
  )
}