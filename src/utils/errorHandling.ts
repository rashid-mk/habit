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
