import { getUserFriendlyError } from '../utils/errorHandling'

interface ErrorMessageProps {
  error: unknown
  onRetry?: () => void
  variant?: 'default' | 'compact' | 'banner'
  showIcon?: boolean
  className?: string
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  variant = 'default',
  showIcon = true,
  className = ''
}: ErrorMessageProps) {
  const userError = getUserFriendlyError(error)

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-slideInUp ${className}`}>
        {showIcon && (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{userError.message}</span>
        {userError.canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 font-medium underline transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 animate-slideInDown ${className}`}>
        <div className="flex items-start">
          {showIcon && (
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <div className={showIcon ? "ml-3 flex-1" : "flex-1"}>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{userError.message}</p>
            {userError.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 btn-ghost text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 animate-slideInUp glass-effect ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center animate-pulse">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
        <div className={showIcon ? "ml-4 flex-1" : "flex-1"}>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-800 dark:text-red-200 leading-relaxed mb-4">{userError.message}</p>
          {userError.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
