import { useEffect, useRef } from 'react'
import { trace, performance } from '../config/firebase'

/**
 * Hook to track performance metrics for a specific operation
 * @param traceName - Name of the trace (e.g., 'page_load', 'check_in')
 * @param enabled - Whether to enable tracing (default: true)
 */
export function usePerformanceTrace(traceName: string, enabled = true) {
  const traceRef = useRef<ReturnType<typeof trace> | null>(null)

  useEffect(() => {
    if (!enabled || !performance) return

    // Start trace when component mounts
    const perfTrace = trace(performance, traceName)
    perfTrace.start()
    traceRef.current = perfTrace

    return () => {
      // Stop trace when component unmounts
      if (traceRef.current) {
        traceRef.current.stop()
      }
    }
  }, [traceName, enabled])

  // Return methods to add custom metrics and attributes
  return {
    putMetric: (metricName: string, value: number) => {
      if (traceRef.current) {
        traceRef.current.putMetric(metricName, value)
      }
    },
    putAttribute: (attributeName: string, value: string) => {
      if (traceRef.current) {
        traceRef.current.putAttribute(attributeName, value)
      }
    },
    incrementMetric: (metricName: string, incrementBy = 1) => {
      if (traceRef.current) {
        traceRef.current.incrementMetric(metricName, incrementBy)
      }
    },
  }
}

/**
 * Manually create and manage a performance trace
 * @param traceName - Name of the trace
 * @returns Object with start and stop methods
 */
export function createPerformanceTrace(traceName: string) {
  if (!performance) {
    return {
      start: () => {},
      stop: () => {},
      putMetric: () => {},
      putAttribute: () => {},
    }
  }

  const perfTrace = trace(performance, traceName)

  return {
    start: () => perfTrace.start(),
    stop: () => perfTrace.stop(),
    putMetric: (metricName: string, value: number) => perfTrace.putMetric(metricName, value),
    putAttribute: (attributeName: string, value: string) => perfTrace.putAttribute(attributeName, value),
  }
}
