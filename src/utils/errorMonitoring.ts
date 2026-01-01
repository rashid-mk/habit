/**
 * Enhanced error monitoring and logging utilities
 * Provides centralized error tracking for analytics operations
 */

export interface ErrorContext {
  operation: string
  component?: string
  userId?: string
  habitId?: string
  timestamp: string
  userAgent: string
  url: string
  errorType?: string
  canRetry?: boolean
  isNetworkError?: boolean
  additionalData?: Record<string, any>
}

export interface ErrorMetrics {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByOperation: Record<string, number>
  retryableErrors: number
  networkErrors: number
  lastError?: {
    timestamp: string
    operation: string
    message: string
  }
}

class ErrorMonitoringService {
  private errorLog: Array<{ error: Error; context: ErrorContext }> = []
  private maxLogSize = 100 // Keep last 100 errors in memory
  
  /**
   * Log an error with context for monitoring and debugging
   */
  logError(error: Error, context: Partial<ErrorContext>) {
    const fullContext: ErrorContext = {
      operation: context.operation || 'unknown',
      component: context.component,
      userId: context.userId,
      habitId: context.habitId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: context.errorType,
      canRetry: context.canRetry,
      isNetworkError: context.isNetworkError,
      additionalData: context.additionalData
    }

    // Add to in-memory log
    this.errorLog.push({ error, context: fullContext })
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Enhanced console logging for development
    if (import.meta.env.DEV) {
      console.group(`🚨 Analytics Error: ${fullContext.operation}`)
      console.error('Error:', error)
      console.log('Context:', fullContext)
      console.trace('Stack trace')
      console.groupEnd()
    }

    // Log to external monitoring service (Google Analytics, Sentry, etc.)
    this.logToExternalService(error, fullContext)
    
    // Log to browser's performance monitoring if available
    this.logToPerformanceMonitoring(error, fullContext)
  }

  /**
   * Log error to external monitoring services
   */
  private logToExternalService(error: Error, context: ErrorContext) {
    // Google Analytics 4 error tracking
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${context.operation}: ${error.message}`,
        fatal: false,
        custom_map: {
          operation: context.operation,
          component: context.component || 'unknown',
          error_type: context.errorType || 'unknown',
          can_retry: context.canRetry?.toString() || 'unknown',
          is_network_error: context.isNetworkError?.toString() || 'false'
        }
      })
    }

    // Send to custom error tracking endpoint if configured
    if (import.meta.env.VITE_ERROR_TRACKING_ENDPOINT) {
      // Use HTTP client for better error handling and retry logic
      import('./httpClient').then(({ httpClient }) => {
        httpClient.post(
          import.meta.env.VITE_ERROR_TRACKING_ENDPOINT!,
          {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context
          },
          {
            timeout: 5000, // 5 second timeout for error tracking
            retries: 1, // Only retry once for error tracking
          }
        ).catch(err => {
          console.warn('Failed to send error to tracking endpoint:', err)
        })
      })
    }
  }

  /**
   * Log to browser's performance monitoring
   */
  private logToPerformanceMonitoring(_error: Error, context: ErrorContext) {
    // Use Performance Observer API if available
    if ('PerformanceObserver' in window) {
      try {
        // Mark the error occurrence
        performance.mark(`error-${context.operation}-${Date.now()}`)
        
        // Add custom performance entry if supported
        if ('measure' in performance) {
          performance.measure(
            `analytics-error-${context.operation}`,
            `error-${context.operation}-${Date.now()}`
          )
        }
      } catch (perfError) {
        console.warn('Failed to log to performance monitoring:', perfError)
      }
    }
  }

  /**
   * Get error metrics for monitoring dashboard
   */
  getErrorMetrics(): ErrorMetrics {
    const metrics: ErrorMetrics = {
      totalErrors: this.errorLog.length,
      errorsByType: {},
      errorsByOperation: {},
      retryableErrors: 0,
      networkErrors: 0
    }

    this.errorLog.forEach(({ error, context }) => {
      // Count by error type
      const errorType = context.errorType || error.name || 'unknown'
      metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1

      // Count by operation
      metrics.errorsByOperation[context.operation] = (metrics.errorsByOperation[context.operation] || 0) + 1

      // Count retryable errors
      if (context.canRetry) {
        metrics.retryableErrors++
      }

      // Count network errors
      if (context.isNetworkError) {
        metrics.networkErrors++
      }
    })

    // Get last error
    if (this.errorLog.length > 0) {
      const lastEntry = this.errorLog[this.errorLog.length - 1]
      metrics.lastError = {
        timestamp: lastEntry.context.timestamp,
        operation: lastEntry.context.operation,
        message: lastEntry.error.message
      }
    }

    return metrics
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): Array<{ error: Error; context: ErrorContext }> {
    return this.errorLog.slice(-limit)
  }

  /**
   * Clear error log (useful for testing or memory management)
   */
  clearErrorLog() {
    this.errorLog = []
  }

  /**
   * Check if there are critical errors that need attention
   */
  hasCriticalErrors(): boolean {
    const recentErrors = this.getRecentErrors(5)
    const criticalErrorTypes = ['permission-error', 'calculation-error']
    
    return recentErrors.some(({ context }) => 
      criticalErrorTypes.includes(context.errorType || '')
    )
  }

  /**
   * Get error rate for a specific operation
   */
  getErrorRateForOperation(operation: string, timeWindowMs: number = 5 * 60 * 1000): number {
    const cutoffTime = Date.now() - timeWindowMs
    const recentErrors = this.errorLog.filter(({ context }) => 
      context.operation === operation && 
      new Date(context.timestamp).getTime() > cutoffTime
    )
    
    return recentErrors.length
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService()

/**
 * Decorator function to automatically log errors from async functions
 */
export function withErrorMonitoring<T extends any[], R>(
  operation: string,
  component?: string
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        errorMonitoring.logError(error as Error, {
          operation,
          component,
          additionalData: {
            methodName: propertyKey,
            arguments: args.length
          }
        })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Higher-order function to wrap functions with error monitoring
 */
export function monitorErrors<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string,
  component?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      errorMonitoring.logError(error as Error, {
        operation,
        component,
        additionalData: {
          arguments: args.length
        }
      })
      throw error
    }
  }
}