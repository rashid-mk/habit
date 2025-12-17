interface InsufficientDataMessageProps {
  minimumRequired: number
  currentCount: number
  dataType?: string
  analysisType?: string
  className?: string
}

/**
 * Component to display user-friendly insufficient data messages
 * Provides guidance on how to get more data for analytics
 */
export function InsufficientDataMessage({
  minimumRequired,
  currentCount,
  dataType = 'data points',
  analysisType = 'this analysis',
  className = ''
}: InsufficientDataMessageProps) {
  const remaining = minimumRequired - currentCount
  
  return (
    <div className={`text-center p-8 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
        <svg
          className="w-8 h-8 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Not Enough Data Yet
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Need at least <span className="font-semibold text-blue-600 dark:text-blue-400">{minimumRequired}</span> {dataType} for {analysisType}.
      </p>
      
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Progress:</span>
          <span className="font-medium">
            {currentCount} / {minimumRequired} {dataType}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((currentCount / minimumRequired) * 100, 100)}%` }}
          />
        </div>
        
        {remaining > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {remaining} more {dataType} needed
          </p>
        )}
      </div>
      
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
          How to get more data:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 text-left space-y-1">
          <li className="flex items-start">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Complete your habit more consistently
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Wait for more data to accumulate over time
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Check back in a few days or weeks
          </li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Compact version for smaller spaces
 */
export function InsufficientDataBanner({
  minimumRequired,
  currentCount,
  dataType = 'data points',
  className = ''
}: Omit<InsufficientDataMessageProps, 'analysisType'>) {
  const remaining = minimumRequired - currentCount
  
  return (
    <div className={`p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 ${className}`}>
      <div className="flex items-start">
        <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Need {remaining} more {dataType} for this analysis
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Progress: {currentCount} / {minimumRequired} {dataType}
          </p>
        </div>
      </div>
    </div>
  )
}