import { Component, ReactNode } from 'react'
import { getAnalyticsError } from '../utils/errorHandling'
import { ErrorMessage } from './ErrorMessage'

interface AnalyticsErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
  fallback?: (error: Error, resetError: () => void) => ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface AnalyticsErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary specifically designed for analytics sections
 * Provides analytics-specific error handling and recovery
 */
export class AnalyticsErrorBoundary extends Component<
  AnalyticsErrorBoundaryProps,
  AnalyticsErrorBoundaryState
> {
  constructor(props: AnalyticsErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): AnalyticsErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const sectionName = this.props.sectionName || 'Analytics'
    
    // Log error for debugging and monitoring
    console.error(`${sectionName} Error Boundary caught an error:`, error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Log to performance monitoring if available
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${sectionName}: ${error.message}`,
        fatal: false,
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      // Get analytics-specific error information
      const analyticsError = getAnalyticsError(this.state.error)
      const sectionName = this.props.sectionName || 'Analytics'

      return (
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {sectionName} Unavailable
            </h3>
            
            <div className="mb-6">
              <ErrorMessage 
                error={this.state.error} 
                onRetry={analyticsError.canRetry ? this.resetError : undefined}
              />
            </div>

            {/* Additional context for specific error types */}
            {analyticsError.type === 'insufficient-data' && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      How to get more data:
                    </p>
                    <ul className="mt-1 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
                      <li>Complete your habit more consistently</li>
                      <li>Wait for more data to accumulate over time</li>
                      <li>Check back in a few days or weeks</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {analyticsError.type === 'permission-error' && (
              <div className="mt-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Upgrade to Premium to access advanced analytics
                  </p>
                </div>
              </div>
            )}

            {/* Retry button for retryable errors */}
            {analyticsError.canRetry && (
              <button
                onClick={this.resetError}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}