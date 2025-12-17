import { describe, it, expect, vi } from 'vitest'
import { 
  getUserFriendlyError, 
  retryWithBackoff, 
  createAnalyticsError, 
  getAnalyticsError, 
  retryAnalyticsOperation 
} from '../errorHandling'
import { FirebaseError } from 'firebase/app'

describe('getUserFriendlyError', () => {
  it('handles Firebase permission-denied error', () => {
    const error = new FirebaseError('permission-denied', 'Permission denied')
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('permission')
    expect(result.canRetry).toBe(false)
    expect(result.isNetworkError).toBe(false)
  })

  it('handles Firebase unavailable error', () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('Connection lost')
    expect(result.canRetry).toBe(true)
    expect(result.isNetworkError).toBe(true)
  })

  it('handles Firebase not-found error', () => {
    const error = new FirebaseError('not-found', 'Not found')
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('not found')
    expect(result.canRetry).toBe(false)
  })

  it('handles auth/user-not-found error', () => {
    const error = new FirebaseError('auth/user-not-found', 'User not found')
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('No account found')
    expect(result.canRetry).toBe(false)
  })

  it('handles auth/wrong-password error', () => {
    const error = new FirebaseError('auth/wrong-password', 'Wrong password')
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('Incorrect password')
    expect(result.canRetry).toBe(false)
  })

  it('handles standard Error objects', () => {
    const error = new Error('Custom error message')
    const result = getUserFriendlyError(error)

    expect(result.message).toBe('Custom error message')
    expect(result.canRetry).toBe(true)
  })

  it('handles unknown error types', () => {
    const error = { unknown: 'error' }
    const result = getUserFriendlyError(error)

    expect(result.message).toContain('unexpected error')
    expect(result.canRetry).toBe(true)
  })
})

describe('createAnalyticsError', () => {
  it('creates analytics error with correct properties', () => {
    const error = createAnalyticsError('Test message', 'insufficient-data', false, 28)

    expect(error.message).toBe('Test message')
    expect(error.type).toBe('insufficient-data')
    expect(error.canRetry).toBe(false)
    expect(error.requiresMinimumData).toBe(28)
  })

  it('creates analytics error with default canRetry', () => {
    const error = createAnalyticsError('Test message', 'calculation-error')

    expect(error.canRetry).toBe(true)
    expect(error.requiresMinimumData).toBeUndefined()
  })
})

describe('getAnalyticsError', () => {
  it('handles insufficient-data analytics error', () => {
    const error = createAnalyticsError('Need more data', 'insufficient-data', false, 28)
    const result = getAnalyticsError(error)

    expect(result.message).toContain('Need at least 28 data points')
    expect(result.canRetry).toBe(false)
    expect(result.type).toBe('insufficient-data')
  })

  it('handles calculation-error analytics error', () => {
    const error = createAnalyticsError('Calculation failed', 'calculation-error')
    const result = getAnalyticsError(error)

    expect(result.message).toContain('Unable to calculate analytics')
    expect(result.canRetry).toBe(true)
    expect(result.type).toBe('calculation-error')
  })

  it('handles permission-error analytics error', () => {
    const error = createAnalyticsError('No permission', 'permission-error', false)
    const result = getAnalyticsError(error)

    expect(result.message).toContain('do not have permission')
    expect(result.canRetry).toBe(false)
    expect(result.type).toBe('permission-error')
  })

  it('falls back to general error handling for non-analytics errors', () => {
    const error = new Error('General error')
    const result = getAnalyticsError(error)

    expect(result.message).toBe('General error')
    expect(result.canRetry).toBe(true)
  })
})

describe('retryAnalyticsOperation', () => {
  it('succeeds on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    const result = await retryAnalyticsOperation(operation, 'test-operation', 2)

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on retryable errors', async () => {
    const error = createAnalyticsError('Network error', 'network-error', true)
    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    const result = await retryAnalyticsOperation(operation, 'test-operation', 2)

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('does not retry insufficient-data errors', async () => {
    const error = createAnalyticsError('Need more data', 'insufficient-data', false)
    const operation = vi.fn().mockRejectedValue(error)

    await expect(retryAnalyticsOperation(operation, 'test-operation', 2)).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('logs errors for debugging', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Test error')
    const operation = vi.fn().mockRejectedValue(error)

    await expect(retryAnalyticsOperation(operation, 'test-operation', 1)).rejects.toThrow()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Analytics operation "test-operation" failed (attempt 1):',
      error
    )

    consoleSpy.mockRestore()
  })
})

describe('retryWithBackoff', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await retryWithBackoff(fn, 3, 100)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on network errors', async () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    const result = await retryWithBackoff(fn, 3, 10)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry on non-retryable errors', async () => {
    const error = new FirebaseError('permission-denied', 'Permission denied')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws after max retries', async () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('uses exponential backoff', async () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    const fn = vi.fn().mockRejectedValue(error)
    const startTime = Date.now()

    await expect(retryWithBackoff(fn, 3, 50)).rejects.toThrow()

    const duration = Date.now() - startTime
    // Should wait at least 50ms + 100ms = 150ms (exponential backoff)
    expect(duration).toBeGreaterThanOrEqual(150)
  })
})
