import { useCallback, useRef } from 'react'
import { CheckIn } from './useHabits'
import { TimePeriod } from '../types/analytics'

interface WorkerMessage {
  id: string
  type: string
  data: any
}

interface WorkerResponse {
  id: string
  type: 'SUCCESS' | 'ERROR'
  result?: any
  error?: string
}

/**
 * Hook for using Web Worker for heavy analytics calculations
 * Provides performance optimization by offloading calculations from main thread
 */
export function useAnalyticsWorker() {
  const workerRef = useRef<Worker | null>(null)
  const pendingCallbacks = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map())

  // Initialize worker
  const initWorker = useCallback(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker('/analytics-worker.js')
        
        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
          const { id, type, result, error } = e.data
          const callbacks = pendingCallbacks.current.get(id)
          
          if (callbacks) {
            if (type === 'SUCCESS') {
              callbacks.resolve(result)
            } else {
              callbacks.reject(new Error(error || 'Worker calculation failed'))
            }
            pendingCallbacks.current.delete(id)
          }
        }
        
        workerRef.current.onerror = (error) => {
          console.error('Analytics worker error:', error)
          // Fallback to main thread calculation
          workerRef.current = null
        }
      } catch (error) {
        console.warn('Web Worker not supported, falling back to main thread calculations')
        workerRef.current = null
      }
    }
  }, [])

  // Generic worker calculation function
  const calculateInWorker = useCallback(async <T>(
    type: string,
    data: any
  ): Promise<T> => {
    initWorker()
    
    // Fallback to main thread if worker not available
    if (!workerRef.current) {
      throw new Error('Worker not available, use fallback calculation')
    }
    
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)
      pendingCallbacks.current.set(id, { resolve, reject })
      
      const message: WorkerMessage = { id, type, data }
      workerRef.current!.postMessage(message)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingCallbacks.current.has(id)) {
          pendingCallbacks.current.delete(id)
          reject(new Error('Worker calculation timeout'))
        }
      }, 10000)
    })
  }, [initWorker])

  // Specific calculation methods
  const calculateCompletionRate = useCallback(async (
    completions: CheckIn[],
    startDate: Date,
    endDate: Date
  ): Promise<number> => {
    try {
      return await calculateInWorker('CALCULATE_COMPLETION_RATE', {
        completions,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    } catch (error) {
      // Fallback to main thread calculation
      console.warn('Worker calculation failed, using main thread:', error)
      throw error
    }
  }, [calculateInWorker])

  const calculateDayOfWeekStats = useCallback(async (
    completions: CheckIn[]
  ) => {
    try {
      return await calculateInWorker('CALCULATE_DAY_OF_WEEK_STATS', {
        completions
      })
    } catch (error) {
      console.warn('Worker calculation failed, using main thread:', error)
      throw error
    }
  }, [calculateInWorker])

  const calculateTimeDistribution = useCallback(async (
    completions: CheckIn[]
  ) => {
    try {
      return await calculateInWorker('CALCULATE_TIME_DISTRIBUTION', {
        completions
      })
    } catch (error) {
      console.warn('Worker calculation failed, using main thread:', error)
      throw error
    }
  }, [calculateInWorker])

  const calculateTrend = useCallback(async (
    completions: CheckIn[],
    period: TimePeriod
  ) => {
    try {
      return await calculateInWorker('CALCULATE_TREND', {
        completions,
        period
      })
    } catch (error) {
      console.warn('Worker calculation failed, using main thread:', error)
      throw error
    }
  }, [calculateInWorker])

  // Cleanup worker on unmount
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingCallbacks.current.clear()
  }, [])

  return {
    calculateCompletionRate,
    calculateDayOfWeekStats,
    calculateTimeDistribution,
    calculateTrend,
    cleanup,
    isWorkerSupported: typeof Worker !== 'undefined'
  }
}