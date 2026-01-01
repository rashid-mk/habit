/**
 * Network Status Utility
 * Handles online/offline detection and network-aware request management
 */

export interface NetworkStatus {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export type NetworkStatusCallback = (status: NetworkStatus) => void

class NetworkStatusManager {
  private callbacks = new Set<NetworkStatusCallback>()
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
  }

  constructor() {
    this.initializeListeners()
    this.updateConnectionInfo()
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback)
    
    // Immediately call with current status
    callback(this.getStatus())
    
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline
  }

  /**
   * Check if connection is slow (2G or slower)
   */
  isSlowConnection(): boolean {
    const effectiveType = this.currentStatus.effectiveType
    return effectiveType === 'slow-2g' || effectiveType === '2g'
  }

  /**
   * Check if connection is fast (4G or better)
   */
  isFastConnection(): boolean {
    const effectiveType = this.currentStatus.effectiveType
    return effectiveType === '4g' || !effectiveType // Assume fast if unknown
  }

  /**
   * Get recommended timeout based on connection speed
   */
  getRecommendedTimeout(): number {
    if (!this.isOnline()) return 0
    if (this.isSlowConnection()) return 60000 // 1 minute for slow connections
    if (this.isFastConnection()) return 10000 // 10 seconds for fast connections
    return 30000 // 30 seconds default
  }

  /**
   * Get recommended retry count based on connection
   */
  getRecommendedRetries(): number {
    if (!this.isOnline()) return 0
    if (this.isSlowConnection()) return 1 // Fewer retries on slow connections
    return 2 // Standard retry count
  }

  /**
   * Wait for online status
   */
  waitForOnline(timeout: number = 30000): Promise<void> {
    if (this.isOnline()) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error('Timeout waiting for online status'))
      }, timeout)

      const unsubscribe = this.subscribe((status) => {
        if (status.isOnline) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve()
        }
      })
    })
  }

  /**
   * Execute function when online, queue when offline
   */
  async executeWhenOnline<T>(
    fn: () => Promise<T>,
    options: { timeout?: number; retryWhenOnline?: boolean } = {}
  ): Promise<T> {
    const { timeout = 30000, retryWhenOnline = true } = options

    if (this.isOnline()) {
      try {
        return await fn()
      } catch (error) {
        if (retryWhenOnline && !this.isOnline()) {
          // Connection lost during execution, wait and retry
          await this.waitForOnline(timeout)
          return await fn()
        }
        throw error
      }
    } else {
      // Wait for connection and then execute
      await this.waitForOnline(timeout)
      return await fn()
    }
  }

  private initializeListeners(): void {
    // Basic online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Network Information API (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', this.handleConnectionChange)
    }
  }

  private handleOnline = (): void => {
    this.currentStatus.isOnline = true
    this.updateConnectionInfo()
    this.notifyCallbacks()
  }

  private handleOffline = (): void => {
    this.currentStatus.isOnline = false
    this.notifyCallbacks()
  }

  private handleConnectionChange = (): void => {
    this.updateConnectionInfo()
    this.notifyCallbacks()
  }

  private updateConnectionInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.currentStatus.connectionType = connection.type
        this.currentStatus.effectiveType = connection.effectiveType
        this.currentStatus.downlink = connection.downlink
        this.currentStatus.rtt = connection.rtt
      }
    }
  }

  private notifyCallbacks(): void {
    const status = this.getStatus()
    this.callbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in network status callback:', error)
      }
    })
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusManager()

/**
 * React hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(() => networkStatus.getStatus())

  React.useEffect(() => {
    return networkStatus.subscribe(setStatus)
  }, [])

  return {
    ...status,
    isSlowConnection: networkStatus.isSlowConnection(),
    isFastConnection: networkStatus.isFastConnection(),
    recommendedTimeout: networkStatus.getRecommendedTimeout(),
    recommendedRetries: networkStatus.getRecommendedRetries(),
    waitForOnline: networkStatus.waitForOnline.bind(networkStatus),
    executeWhenOnline: networkStatus.executeWhenOnline.bind(networkStatus),
  }
}

// Import React for the hook
import React from 'react'