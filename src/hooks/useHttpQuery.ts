/**
 * React Query integration for external HTTP APIs
 * Provides hooks for external API calls with caching, error handling, and retry logic
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { httpClient, HttpError, RequestConfig } from '../utils/httpClient'

export interface UseHttpQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  url: string
  config?: RequestConfig
  enabled?: boolean
}

export interface UseHttpMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  config?: RequestConfig
}

/**
 * Hook for GET requests with React Query caching
 */
export function useHttpQuery<T = any>(options: UseHttpQueryOptions<T>) {
  const { url, config, enabled = true, ...queryOptions } = options

  return useQuery<T, Error>({
    ...queryOptions,
    enabled,
    queryFn: async () => {
      try {
        return await httpClient.get<T>(url, config)
      } catch (error) {
        // Transform HTTP errors for better error handling
        if (error instanceof HttpError) {
          throw new Error(`${error.message} (${error.status})`)
        }
        throw error
      }
    },
  })
}

/**
 * Hook for POST/PUT/PATCH/DELETE mutations
 */
export function useHttpMutation<TData = any, TVariables = any>(
  url: string,
  options: UseHttpMutationOptions<TData, TVariables> = {}
) {
  const { method = 'POST', config, ...mutationOptions } = options

  return useMutation<TData, Error, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      try {
        switch (method) {
          case 'POST':
            return await httpClient.post<TData>(url, variables, config)
          case 'PUT':
            return await httpClient.put<TData>(url, variables, config)
          case 'PATCH':
            return await httpClient.patch<TData>(url, variables, config)
          case 'DELETE':
            return await httpClient.delete<TData>(url, config)
          default:
            throw new Error(`Unsupported HTTP method: ${method}`)
        }
      } catch (error) {
        // Transform HTTP errors for better error handling
        if (error instanceof HttpError) {
          throw new Error(`${error.message} (${error.status})`)
        }
        throw error
      }
    },
  })
}

/**
 * Hook for external API health checks
 */
export function useApiHealthCheck(
  url: string,
  options: Partial<Omit<UseHttpQueryOptions<{ status: string; timestamp: string }>, 'url'>> = {}
) {
  return useHttpQuery({
    ...options,
    url,
    queryKey: ['api-health', url],
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute (renamed from cacheTime in newer versions)
    retry: 1, // Only retry once for health checks
    retryDelay: 2000, // 2 second delay
  })
}

/**
 * Hook for webhook/notification sending
 */
export function useWebhookSender() {
  const queryClient = useQueryClient()

  return useMutation<
    { success: boolean; id?: string },
    Error,
    { url: string; payload: any; headers?: Record<string, string> }
  >({
    mutationFn: async ({ url, payload, headers }) => {
      return await httpClient.post(url, payload, {
        headers,
        timeout: 10000, // 10 second timeout for webhooks
        retries: 2, // Retry webhooks twice
      })
    },
    onSuccess: () => {
      // Invalidate any related queries if needed
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })
}

/**
 * Hook for file uploads to external services
 */
export function useFileUpload() {
  return useMutation<
    { url: string; id: string },
    Error,
    { endpoint: string; file: File; additionalData?: Record<string, any> }
  >({
    mutationFn: async ({ endpoint, file, additionalData }) => {
      const formData = new FormData()
      formData.append('file', file)
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
      }

      return await httpClient.request(endpoint, {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
        timeout: 60000, // 1 minute for file uploads
        retries: 1, // Only retry once for uploads
      })
    },
  })
}

/**
 * Hook for external service integration (e.g., Stripe, third-party APIs)
 */
export function useExternalService<T = any>(
  serviceName: string,
  endpoint: string,
  options: Partial<UseHttpQueryOptions<T>> = {}
) {
  return useHttpQuery({
    ...options,
    url: endpoint,
    queryKey: ['external-service', serviceName, endpoint],
    staleTime: 300000, // 5 minutes for external services
    gcTime: 600000, // 10 minutes (renamed from cacheTime in newer versions)
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof HttpError && error.status && error.status >= 400 && error.status < 500) {
        return false
      }
      // Retry up to 3 times for server errors
      return failureCount < 3
    },
  })
}