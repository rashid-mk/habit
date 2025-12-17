import { useState, useCallback } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { LoadingSpinner } from './LoadingSpinner'
import { getAnalyticsError } from '../utils/errorHandling'

interface ErrorRecoveryProps {
  error: Error
  onRetry?: () => Promise<void> | void
  onReset?: () => void
  operationName?: string
  showDetails?: boolean
  className?: string
}

/**
 * Enhanced error recovery component with multiple recovery options
 * Provides user-friendly error handling with retry logic and detailed feedback
 */
export function ErrorRecovery({
  error,
  onRetry,
  onReset,
  operationName = 'operation',
  showDetails = false,
  className = ''
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showDetailedError, setShowDetailedError] = useState(showDetails)

  const errorInfo = getAnalyticsError(error)
  const maxRetries = 3

  const handleRetry = useCallback(async () => {
    if (!onRetry || retryCount >= maxRetries) return

    setIsRetrying(true)
    try {
      await onRetry()
      setRetryCount(0) // Reset on success
    } catch (retryError) {
      setRetryCount(prev => prev + 1)
      console.error(`Retry ${retryCount + 1} failed:`, retryError)
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, retryCount, maxRetries])

  const handleReset = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
    if (onReset) {
      onReset()
    }
  }, [onReset])

  const getErrorIcon = () => {
    switch (errorInfo.type) {
      case 'insufficient-data':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'network-error':
        return (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'permission-error':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
    }
  }

  const getRecoveryActions = () => {
    const actions = []

    // Retry action for retryable errors
    if (errorInfo.canRetry && onRetry && retryCount < maxRetries) {
      actions.push(
        <button
          key="retry"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Retrying...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </>
          )}
        </button>
      )
    }

    // Reset action
    if (onReset) {
      actions.push(
        <button
          key="reset"
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      )
    }

    // Refresh page action for critical errors
    if (!errorInfo.canRetry || retryCount >= maxRetries) {
      actions.push(
        <button
          key="refresh"
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Page
        </button>
      )
    }

    return actions
  }

  return (
    <div className={`rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {operationName.charAt(0).toUpperCase() + operationName.slice(1)} Failed
          </h3>
          
          <div className="mb-4">
            <ErrorMessage error={error} />
          </div>

          {/* Retry count indicator */}
          {retryCount > 0 && (
            <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
                  {retryCount >= maxRetries && ' - Maximum retries reached'}
                </span>
              </div>
            </div>
          )}

          {/* Recovery actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            {getRecoveryActions()}
          </div>

          {/* Error details toggle */}
          <div className="border-t border-red-200 dark:border-red-700 pt-4">
            <button
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
            >
              {showDetailedError ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showDetailedError && (
              <div className="mt-3 p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-mono text-gray-700 dark:text-gray-300 space-y-2">
                  <div>
                    <strong>Error Type:</strong> {errorInfo.type || 'unknown'}
                  </div>
                  <div>
                    <strong>Can Retry:</strong> {errorInfo.canRetry ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Network Error:</strong> {errorInfo.isNetworkError ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}