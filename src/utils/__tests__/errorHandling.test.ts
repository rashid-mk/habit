import { describe, it, expect, vi } from 'vitest'
import { getUserFriendlyError, retryWithBackoff } from '../errorHandling'
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
