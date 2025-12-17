import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalyticsErrorHandler, useInsufficientDataHandler } from '../useAnalyticsErrorHandler'
import { createAnalyticsError } from '../../utils/errorHandling'

describe('useAnalyticsErrorHandler', () => {
  it('initializes with no error', () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.hasError).toBe(false)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
  })

  it('handles errors correctly', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useAnalyticsErrorHandler({ onError }))

    const testError = new Error('Test error')

    act(() => {
      result.current.handleError(testError, 'test operation')
    })

    expect(result.current.error).toBe(testError)
    expect(result.current.hasError).toBe(true)
    expect(onError).toHaveBeenCalledWith(testError)
  })

  it('clears error state', () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test error'))
    })

    expect(result.current.hasError).toBe(true)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.hasError).toBe(false)
    expect(result.current.retryCount).toBe(0)
  })

  it('executes operations with error handling', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useAnalyticsErrorHandler({ onSuccess }))

    const operation = vi.fn().mockResolvedValue('success')

    let operationResult: string | null = null
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation, 'test')
    })

    expect(operationResult).toBe('success')
    expect(onSuccess).toHaveBeenCalled()
    expect(result.current.hasError).toBe(false)
  })

  it('handles operation failures', async () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'))

    let operationResult: string | null = 'initial'
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation, 'test')
    })

    expect(operationResult).toBeNull()
    expect(result.current.hasError).toBe(true)
    expect(result.current.error?.message).toBe('Operation failed')
  })

  it('validates data requirements', () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    // Valid data
    const validResult = result.current.validateDataRequirements([1, 2, 3, 4, 5], 3, 'items')
    expect(validResult).toBe(true)
    expect(result.current.hasError).toBe(false)

    // Invalid data
    const invalidResult = result.current.validateDataRequirements([1, 2], 5, 'items')
    expect(invalidResult).toBe(false)
    expect(result.current.hasError).toBe(true)
    expect(result.current.error?.message).toContain('Need at least 5 items')
  })

  it('wraps calculations with error handling', () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    // Successful calculation
    const successResult = result.current.wrapCalculation(() => 42, 'test calculation')
    expect(successResult).toBe(42)
    expect(result.current.hasError).toBe(false)

    // Failed calculation
    const failResult = result.current.wrapCalculation(() => {
      throw new Error('Calculation error')
    }, 'test calculation')
    expect(failResult).toBeNull()
    expect(result.current.hasError).toBe(true)
  })

  it('determines retry capability based on error type', () => {
    const { result } = renderHook(() => useAnalyticsErrorHandler())

    // Retryable error
    act(() => {
      result.current.handleError(createAnalyticsError('Network error', 'network-error', true))
    })
    expect(result.current.canRetry).toBe(true)

    // Non-retryable error
    act(() => {
      result.current.handleError(createAnalyticsError('Insufficient data', 'insufficient-data', false))
    })
    expect(result.current.canRetry).toBe(false)
  })

  it('performs retry operations', async () => {
    const onRetry = vi.fn()
    const { result } = renderHook(() => useAnalyticsErrorHandler({ onRetry }))

    // Set up error state
    act(() => {
      result.current.handleError(createAnalyticsError('Retryable error', 'calculation-error', true))
    })

    const operation = vi.fn().mockResolvedValue('retry success')

    let retryResult: string | null = null
    await act(async () => {
      retryResult = await result.current.retry(operation, 'retry test')
    })

    expect(retryResult).toBe('retry success')
    expect(onRetry).toHaveBeenCalled()
    expect(result.current.hasError).toBe(false)
  })
})

describe('useInsufficientDataHandler', () => {
  it('initializes with no insufficient data sections', () => {
    const { result } = renderHook(() => useInsufficientDataHandler())

    expect(result.current.insufficientDataSections.size).toBe(0)
    expect(result.current.hasInsufficientData('test')).toBe(false)
  })

  it('checks data requirements correctly', () => {
    const { result } = renderHook(() => useInsufficientDataHandler())

    // Sufficient data
    act(() => {
      const hasEnough = result.current.checkDataRequirements('section1', [1, 2, 3, 4, 5], 3)
      expect(hasEnough).toBe(true)
    })
    expect(result.current.hasInsufficientData('section1')).toBe(false)

    // Insufficient data
    act(() => {
      const hasEnough = result.current.checkDataRequirements('section2', [1, 2], 5)
      expect(hasEnough).toBe(false)
    })
    expect(result.current.hasInsufficientData('section2')).toBe(true)
  })

  it('updates insufficient data sections correctly', () => {
    const { result } = renderHook(() => useInsufficientDataHandler())

    // Add insufficient data section
    act(() => {
      result.current.checkDataRequirements('section1', [1], 5)
    })
    expect(result.current.insufficientDataSections.has('section1')).toBe(true)

    // Remove when data becomes sufficient
    act(() => {
      result.current.checkDataRequirements('section1', [1, 2, 3, 4, 5, 6], 5)
    })
    expect(result.current.insufficientDataSections.has('section1')).toBe(false)
  })

  it('generates appropriate insufficient data messages', () => {
    const { result } = renderHook(() => useInsufficientDataHandler())

    const message = result.current.getInsufficientDataMessage(28, 'days of data')
    expect(message).toContain('Need at least 28 days of data')
    expect(message).toContain('Complete your habit more consistently')
  })

  it('handles null or undefined data arrays', () => {
    const { result } = renderHook(() => useInsufficientDataHandler())

    act(() => {
      const hasEnough = result.current.checkDataRequirements('section1', null as any, 5)
      expect(hasEnough).toBe(false)
    })
    expect(result.current.hasInsufficientData('section1')).toBe(true)
  })
})