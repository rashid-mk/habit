import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { httpClient, HttpError, TimeoutError, createHttpClient } from '../httpClient'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('HttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse),
      })

      const result = await httpClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({}),
      })

      await httpClient.get('/test', {
        params: { page: '1', limit: '10' }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/test?page=1&limit=10',
        expect.any(Object)
      )
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'test' }
      const responseData = { id: 1 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await httpClient.post('/test', requestData)

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual(responseData)
    })
  })

  describe('Error handling', () => {
    it('should throw HttpError for 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ message: 'Resource not found' }),
      })

      await expect(httpClient.get('/test')).rejects.toThrow(HttpError)
      
      try {
        await httpClient.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError)
        expect((error as HttpError).status).toBe(404)
        expect((error as HttpError).statusText).toBe('Not Found')
      }
    })

    it('should throw TimeoutError on timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(resolve, 10000) // Long delay
        })
      )

      const promise = httpClient.get('/test', { timeout: 1000 })
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(1000)
      
      await expect(promise).rejects.toThrow(TimeoutError)
    })

    it('should retry on 5xx errors', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ message: 'Server error' }),
      })

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: 'success' }),
      })

      const result = await httpClient.get('/test', { retries: 1 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ message: 'Bad request' }),
      })

      await expect(httpClient.get('/test', { retries: 2 })).rejects.toThrow(HttpError)
      expect(mockFetch).toHaveBeenCalledTimes(1) // No retries
    })
  })

  describe('Custom configuration', () => {
    it('should use custom base URL', async () => {
      const customClient = createHttpClient({
        baseURL: 'https://api.example.com'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({}),
      })

      await customClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })

    it('should use custom headers', async () => {
      const customClient = createHttpClient({
        headers: {
          'Authorization': 'Bearer token',
          'X-API-Key': 'key'
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({}),
      })

      await customClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
          'X-API-Key': 'key',
        },
        signal: expect.any(AbortSignal),
      })
    })
  })

  describe('Response parsing', () => {
    it('should parse JSON responses', async () => {
      const responseData = { message: 'success' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
      })

      const result = await httpClient.get('/test')
      expect(result).toEqual(responseData)
    })

    it('should parse text responses', async () => {
      const responseText = 'plain text response'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(responseText),
      })

      const result = await httpClient.get('/test')
      expect(result).toBe(responseText)
    })

    it('should handle blob responses', async () => {
      const blob = new Blob(['binary data'])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/octet-stream']]),
        blob: () => Promise.resolve(blob),
      })

      const result = await httpClient.get('/test')
      expect(result).toBe(blob)
    })
  })
})