import { createPerformanceTrace } from '../hooks/usePerformanceTrace'

/**
 * Wrapper to monitor Cloud Function execution time
 * @param functionName - Name of the Cloud Function
 * @param fn - The async function to execute
 * @returns Result of the function
 */
export async function monitorCloudFunction<T>(
  functionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const trace = createPerformanceTrace(`cloud_function_${functionName}`)
  trace.start()
  
  const startTime = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - startTime
    
    trace.putMetric('execution_time', Math.round(duration))
    trace.putAttribute('status', 'success')
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    trace.putMetric('execution_time', Math.round(duration))
    trace.putAttribute('status', 'error')
    
    throw error
  } finally {
    trace.stop()
  }
}

/**
 * Monitor page load performance using Web Vitals
 */
export function initWebVitalsMonitoring() {
  // Monitor First Contentful Paint (FCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime)
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      // PerformanceObserver not supported
      console.warn('PerformanceObserver not supported')
    }
  }

  // Monitor Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('LCP monitoring not supported')
    }
  }

  // Monitor First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime
          console.log('FID:', fid)
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('FID monitoring not supported')
    }
  }
}

/**
 * Log performance metrics to console in development
 */
export function logPerformanceMetrics() {
  if (import.meta.env.DEV && window.performance) {
    const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (perfData) {
      console.group('Performance Metrics')
      console.log('DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms')
      console.log('TCP Connection:', perfData.connectEnd - perfData.connectStart, 'ms')
      console.log('Request Time:', perfData.responseStart - perfData.requestStart, 'ms')
      console.log('Response Time:', perfData.responseEnd - perfData.responseStart, 'ms')
      console.log('DOM Interactive:', perfData.domInteractive - perfData.fetchStart, 'ms')
      console.log('DOM Complete:', perfData.domComplete - perfData.fetchStart, 'ms')
      console.log('Total Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms')
      console.groupEnd()
    }
  }
}
