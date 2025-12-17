import { useState, useCallback } from 'react'
import { getAnalyticsError, retryAnalyticsOperation, createAnalyticsError } from '../utils/errorHandling'
import { errorMonitoring } from '../utils/errorMonitoring'

interface AnalyticsErrorState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
}

interface UseAnalyticsErrorHandlerOptions {
  maxRetries?: number
  onError?: (error: Error) => void
  onRetry?: () => void
  onSuccess?: () => void
}

/**
 * Hook for handling analytics errors with retry logic
 * Provides error state management and retry functionality
 */
export function useAnalyticsErrorHandler(options: UseAnalyticsErrorHandlerOptions = {}) {
  const { maxRetries = 2, onError, onRetry, onSuccess } = options
  
  const [errorState, setErrorState] = useState<AnalyticsErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0
  })

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0
    })
  }, [])

  const handleError = useCallback((error: unknown, operationName?: string) => {
    const analyticsError = error instanceof Error ? error : new Error(String(error))
    
    // Enhanced error logging with categorization
    const errorCategory = getAnalyticsError(analyticsError)
    
    // Log to centralized error monitoring service
    errorMonitoring.logError(analyticsError, {
      operation: operationName || 'unknown',
      component: 'useAnalyticsErrorHandler',
      errorType: errorCategory.type || 'unknown',
      canRetry: errorCategory.canRetry,
      isNetworkError: errorCategory.isNetworkError
    })
    
    setErrorState(prev => ({
      error: analyticsError,
      isRetrying: false,
      retryCount: prev.retryCount
    }))

    // Call custom error handler
    if (onError) {
      onError(analyticsError)
    }
  }, [onError])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    try {
      clearError()
      const result = await retryAnalyticsOperation(operation, operationName, maxRetries)
      
      if (onSuccess) {
        onSuccess()
      }
      
      return result
    } catch (error) {
      handleError(error, operationName)
      return null
    }
  }, [clearError, handleError, maxRetries, onSuccess])

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    _operationName: string
  ): Promise<T | null> => {
    if (!errorState.error) {
      return null
    }

    const userError = getAnalyticsError(errorState.error)
    if (!userError.canRetry) {
      return null
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }))

    if (onRetry) {
      onRetry()
    }

    try {
      const result = await operation()
      
      clearError()
      
      if (onSuccess) {
        onSuccess()
      }
      
      return result
    } catch (error) {
      setErrorState(prev => ({
        error: error instanceof Error ? error : new Error(String(error)),
        isRetrying: false,
        retryCount: prev.retryCount
      }))
      
      return null
    }
  }, [errorState.error, clearError, onRetry, onSuccess])

  const validateDataRequirements = useCallback((
    data: any[],
    minimumRequired: number,
    dataType: string
  ): boolean => {
    if (!data || data.length < minimumRequired) {
      const error = createAnalyticsError(
        `Need at least ${minimumRequired} ${dataType} for this analysis`,
        'insufficient-data',
        false,
        minimumRequired
      )
      handleError(error, `${dataType} validation`)
      return false
    }
    return true
  }, [handleError])

  const wrapCalculation = useCallback(<T>(
    calculation: () => T,
    calculationName: string
  ): T | null => {
    try {
      return calculation()
    } catch (error) {
      const calculationError = createAnalyticsError(
        `Failed to calculate ${calculationName}`,
        'calculation-error',
        true
      )
      handleError(calculationError, calculationName)
      return null
    }
  }, [handleError])

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasError: !!errorState.error,
    canRetry: errorState.error ? getAnalyticsError(errorState.error).canRetry : false,
    clearError,
    handleError,
    executeWithErrorHandling,
    retry,
    validateDataRequirements,
    wrapCalculation
  }
}

/**
 * Hook for handling insufficient data errors specifically
 */
export function useInsufficientDataHandler() {
  const [insufficientDataSections, setInsufficientDataSections] = useState<Set<string>>(new Set())

  const checkDataRequirements = useCallback((
    sectionName: string,
    data: any[],
    minimumRequired: number,
    _dataType: string = 'data points'
  ): boolean => {
    const hasEnoughData = data && data.length >= minimumRequired

    setInsufficientDataSections(prev => {
      const newSet = new Set(prev)
      if (hasEnoughData) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return newSet
    })

    return hasEnoughData
  }, [])

  const getInsufficientDataMessage = useCallback((
    minimumRequired: number,
    dataType: string = 'data points'
  ): string => {
    const message = `Need at least ${minimumRequired} ${dataType} for this analysis. Complete your habit more consistently to see insights here.`
    return message
  }, [])

  return {
    insufficientDataSections,
    checkDataRequirements,
    getInsufficientDataMessage,
    hasInsufficientData: (sectionName: string) => insufficientDataSections.has(sectionName)
  }
}