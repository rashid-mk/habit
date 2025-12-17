import { FirebaseError } from 'firebase/app'

export interface UserFriendlyError {
  message: string
  canRetry: boolean
  isNetworkError: boolean
}

/**
 * Convert Firebase and other errors into user-friendly messages
 */
export function getUserFriendlyError(error: unknown): UserFriendlyError {
  // Handle Firebase errors
  if (error instanceof FirebaseError) {
    return handleFirebaseError(error)
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      canRetry: true,
      isNetworkError: false,
    }
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    canRetry: true,
    isNetworkError: false,
  }
}

/**
 * Handle Firebase-specific errors
 */
function handleFirebaseError(error: FirebaseError): UserFriendlyError {
  switch (error.code) {
    // Firestore errors
    case 'permission-denied':
      return {
        message: 'You do not have permission to perform this action. Please sign in again.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'unavailable':
      return {
        message: 'Connection lost. Please check your internet connection.',
        canRetry: true,
        isNetworkError: true,
      }

    case 'not-found':
      return {
        message: 'The requested data was not found.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'already-exists':
      return {
        message: 'This item already exists.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'resource-exhausted':
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        canRetry: true,
        isNetworkError: false,
      }

    case 'deadline-exceeded':
    case 'cancelled':
      return {
        message: 'The request took too long. Please try again.',
        canRetry: true,
        isNetworkError: true,
      }

    // Auth errors
    case 'auth/user-not-found':
      return {
        message: 'No account found with this email.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'auth/wrong-password':
      return {
        message: 'Incorrect password.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'auth/email-already-in-use':
      return {
        message: 'Email already registered.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'auth/weak-password':
      return {
        message: 'Password must be at least 6 characters.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'auth/invalid-email':
      return {
        message: 'Invalid email address.',
        canRetry: false,
        isNetworkError: false,
      }

    case 'auth/network-request-failed':
      return {
        message: 'Network error. Please check your connection.',
        canRetry: true,
        isNetworkError: true,
      }

    default:
      return {
        message: error.message || 'An error occurred. Please try again.',
        canRetry: true,
        isNetworkError: false,
      }
  }
}

/**
 * Analytics-specific error types
 */
export interface AnalyticsError extends Error {
  type: 'insufficient-data' | 'calculation-error' | 'network-error' | 'permission-error' | 'unknown'
  canRetry: boolean
  requiresMinimumData?: number
}

/**
 * Create analytics-specific error
 */
export function createAnalyticsError(
  message: string,
  type: AnalyticsError['type'],
  canRetry: boolean = true,
  requiresMinimumData?: number
): AnalyticsError {
  const error = new Error(message) as AnalyticsError
  error.type = type
  error.canRetry = canRetry
  error.requiresMinimumData = requiresMinimumData
  return error
}

/**
 * Handle analytics-specific errors
 */
export function getAnalyticsError(error: unknown): UserFriendlyError & { type?: string } {
  // Handle analytics-specific errors
  if (error && typeof error === 'object' && 'type' in error) {
    const analyticsError = error as AnalyticsError
    
    switch (analyticsError.type) {
      case 'insufficient-data':
        return {
          message: analyticsError.requiresMinimumData 
            ? `Need at least ${analyticsError.requiresMinimumData} data points for this analysis`
            : 'Insufficient data for this analysis. Try again after more habit completions.',
          canRetry: false,
          isNetworkError: false,
          type: 'insufficient-data'
        }
      
      case 'calculation-error':
        return {
          message: 'Unable to calculate analytics. Please try again.',
          canRetry: true,
          isNetworkError: false,
          type: 'calculation-error'
        }
      
      case 'network-error':
        return {
          message: 'Connection lost while loading analytics. Please check your internet connection.',
          canRetry: true,
          isNetworkError: true,
          type: 'network-error'
        }
      
      case 'permission-error':
        return {
          message: 'You do not have permission to view these analytics. Please upgrade to premium.',
          canRetry: false,
          isNetworkError: false,
          type: 'permission-error'
        }
      
      default:
        return {
          message: analyticsError.message || 'An error occurred while processing analytics.',
          canRetry: analyticsError.canRetry,
          isNetworkError: false,
          type: 'unknown'
        }
    }
  }
  
  // Fall back to general error handling
  return getUserFriendlyError(error)
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const userError = getUserFriendlyError(error)

      // Don't retry if it's not a network error or can't be retried
      if (!userError.canRetry || !userError.isNetworkError) {
        throw error
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Retry analytics operations with specific error handling
 */
export async function retryAnalyticsOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 2
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Enhanced error logging with more context
      const errorContext = {
        operation: operationName,
        attempt: attempt + 1,
        maxRetries,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
      
      console.error(`Analytics operation failed:`, errorContext)
      
      // Log to performance monitoring if available
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: `Analytics: ${operationName} failed (attempt ${attempt + 1})`,
          fatal: false,
          custom_map: {
            operation: operationName,
            attempt: attempt + 1
          }
        })
      }
      
      const userError = getAnalyticsError(error)
      
      // Don't retry certain error types
      if (!userError.canRetry || userError.type === 'insufficient-data' || userError.type === 'permission-error') {
        // Log final failure
        console.error(`Analytics operation "${operationName}" failed permanently:`, {
          reason: 'Non-retryable error',
          errorType: userError.type,
          canRetry: userError.canRetry
        })
        throw error
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt)
        console.log(`Retrying analytics operation "${operationName}" in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Log final failure after all retries exhausted
  console.error(`Analytics operation "${operationName}" failed after ${maxRetries} attempts`)
  
  if ((window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      description: `Analytics: ${operationName} failed after all retries`,
      fatal: true,
      custom_map: {
        operation: operationName,
        maxRetries
      }
    })
  }

  throw lastError
}
