interface AnalyticsSkeletonProps {
  variant?: 'dashboard' | 'chart' | 'insight' | 'export' | 'breakdown'
  className?: string
}

export function AnalyticsSkeleton({ variant = 'dashboard', className = '' }: AnalyticsSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
          </div>

          {/* Navigation skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <AnalyticsSkeleton variant="chart" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsSkeleton variant="insight" />
            <AnalyticsSkeleton variant="chart" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div className={`backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse ${className}`}>
        <div className="flex items-center mb-6">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </div>
        
        {/* Chart area */}
        <div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-4"></div>
        
        {/* Chart legend/controls */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-16"></div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'insight') {
    return (
      <div className={`backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse ${className}`}>
        <div className="flex items-center mb-6">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'export') {
    return (
      <div className={`backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse ${className}`}>
        <div className="flex items-center mb-6">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-gray-100 dark:bg-gray-700">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-3"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded-lg w-24 mx-auto"></div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'breakdown') {
    return (
      <div className={`backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse ${className}`}>
        {/* Tab navigation skeleton */}
        <div className="flex space-x-1 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
          ))}
        </div>
        
        {/* Calendar/timeline skeleton */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default skeleton
  return (
    <div className={`backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse ${className}`}>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  )
}