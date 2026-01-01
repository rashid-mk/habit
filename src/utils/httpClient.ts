/**
 * HTTP Client Utility
 * Minimal AJAX system for external API calls with proper error handling,
 * retry logic, timeout support, and request cancellation
 */

export interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  params?: Record<string, string>
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public data?: any
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

class HttpClient {
  private config: HttpClientConfig

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retries: 2,
      retryDelay: 1000,
      ...config,
    }
  }

  /**
   * Make an HTTP request with timeout, retry, and cancellation support
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = this.config.retryDelay,
      params,
      ...fetchConfig
    } = config

    // Build full URL with query parameters
    const fullUrl = this.buildUrl(url, params)

    // Merge headers
    const headers = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...fetchConfig.headers,
    }

    let lastError: Error | null = null
    let attempt = 0

    while (attempt <= (retries || 0)) {
      try {
        const response = await this.fetchWithTimeout(fullUrl, {
          ...fetchConfig,
          headers,
        }, timeout)

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          throw new HttpError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            errorData
          )
        }

        // Parse response
        return await this.parseResponse<T>(response)
      } catch (error) {
        lastError = error as Error

        // Don't retry on client errors (4xx) or timeout errors
        if (
          error instanceof HttpError &&
          error.status &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw error
        }

        // Don't retry on timeout
        if (error instanceof TimeoutError) {
          throw error
        }

        // Retry on network errors or 5xx errors
        if (attempt < (retries || 0)) {
          attempt++
          await this.delay(retryDelay || 1000)
          continue
        }

        throw error
      }
    }

    throw lastError || new Error('Request failed')
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * Fetch with timeout support using AbortController
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout?: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : null

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      if (timeoutId) clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`)
      }

      throw error
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string>): string {
    const baseUrl = this.config.baseURL
      ? `${this.config.baseURL}${url}`
      : url

    if (!params || Object.keys(params).length === 0) {
      return baseUrl
    }

    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&')

    return `${baseUrl}?${queryString}`
  }

  /**
   * Parse successful response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.includes('text/')) {
      return response.text() as any
    }

    // Return blob for binary data
    return response.blob() as any
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(
    response: Response
  ): Promise<{ message?: string; [key: string]: any }> {
    try {
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        return await response.json()
      }

      const text = await response.text()
      return { message: text }
    } catch {
      return { message: response.statusText }
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance with default config
export const httpClient = new HttpClient()

// Export factory function for custom instances
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config)
}
