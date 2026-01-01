# HTTP Client & AJAX System

This application uses a modern, Firebase-first architecture where most data operations go through Firebase SDK. However, for external API integrations, we provide a robust HTTP client system.

## Architecture Overview

### Primary Data Layer: Firebase
- **Firebase Firestore**: Real-time database with offline persistence
- **Firebase Auth**: Authentication and user management
- **Firebase Functions**: Serverless backend operations
- **React Query**: Caching, synchronization, and optimistic updates

### External API Layer: HTTP Client
- **httpClient**: Minimal AJAX utility for external APIs
- **useHttpQuery**: React Query integration for external endpoints
- **networkStatus**: Network-aware request management

## When to Use What

### Use Firebase SDK (Primary - 95% of cases)
```typescript
// ✅ CORRECT: Use Firebase for app data
import { useHabits } from '../hooks/useHabits'

const { data: habits } = useHabits()
```

### Use HTTP Client (External APIs only)
```typescript
// ✅ CORRECT: Use HTTP client for external services
import { useHttpQuery } from '../hooks/useHttpQuery'

const { data } = useHttpQuery({
  url: 'https://api.external-service.com/data',
  queryKey: ['external-data'],
})
```

## HTTP Client Features

### 1. Basic Usage

```typescript
import { httpClient } from '../utils/httpClient'

// GET request
const data = await httpClient.get('/api/endpoint')

// POST request
const result = await httpClient.post('/api/endpoint', {
  name: 'value'
})

// With custom config
const data = await httpClient.get('/api/endpoint', {
  timeout: 5000,
  retries: 3,
  headers: { 'Authorization': 'Bearer token' }
})
```

### 2. React Query Integration

```typescript
import { useHttpQuery, useHttpMutation } from '../hooks/useHttpQuery'

// Query (GET)
function MyComponent() {
  const { data, isLoading, error } = useHttpQuery({
    url: 'https://api.example.com/data',
    queryKey: ['my-data'],
    staleTime: 60000, // 1 minute
  })

  return <div>{data?.value}</div>
}

// Mutation (POST/PUT/DELETE)
function MyForm() {
  const mutation = useHttpMutation('/api/submit', {
    method: 'POST',
    onSuccess: () => {
      console.log('Success!')
    }
  })

  const handleSubmit = () => {
    mutation.mutate({ name: 'value' })
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```

### 3. Network-Aware Requests

```typescript
import { useNetworkStatus } from '../utils/networkStatus'

function MyComponent() {
  const { 
    isOnline, 
    isSlowConnection,
    recommendedTimeout,
    executeWhenOnline 
  } = useNetworkStatus()

  const handleAction = async () => {
    // Automatically waits for online status
    await executeWhenOnline(async () => {
      return await httpClient.post('/api/action', data)
    })
  }

  if (!isOnline) {
    return <div>You're offline. Changes will sync when online.</div>
  }

  if (isSlowConnection) {
    return <div>Slow connection detected. Using optimized settings.</div>
  }

  return <button onClick={handleAction}>Perform Action</button>
}
```

### 4. File Uploads

```typescript
import { useFileUpload } from '../hooks/useHttpQuery'

function FileUploader() {
  const upload = useFileUpload()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      upload.mutate({
        endpoint: 'https://api.example.com/upload',
        file,
        additionalData: { userId: '123' }
      })
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {upload.isLoading && <p>Uploading...</p>}
      {upload.isSuccess && <p>Upload complete!</p>}
    </div>
  )
}
```

### 5. Webhooks

```typescript
import { useWebhookSender } from '../hooks/useHttpQuery'

function NotificationSender() {
  const webhook = useWebhookSender()

  const sendNotification = () => {
    webhook.mutate({
      url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      payload: {
        text: 'Habit completed!',
        channel: '#habits'
      }
    })
  }

  return <button onClick={sendNotification}>Send Notification</button>
}
```

### 6. External Service Integration

```typescript
import { useExternalService } from '../hooks/useHttpQuery'

function StripeIntegration() {
  const { data: subscription } = useExternalService(
    'stripe',
    'https://api.stripe.com/v1/subscriptions/sub_123',
    {
      config: {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_KEY}`
        }
      }
    }
  )

  return <div>Subscription: {subscription?.status}</div>
}
```

## Error Handling

The HTTP client provides comprehensive error handling:

```typescript
import { HttpError, TimeoutError } from '../utils/httpClient'

try {
  const data = await httpClient.get('/api/endpoint')
} catch (error) {
  if (error instanceof HttpError) {
    console.error(`HTTP ${error.status}: ${error.message}`)
    console.error('Response data:', error.data)
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out')
  } else {
    console.error('Network error:', error)
  }
}
```

## Configuration

### Global Configuration

```typescript
import { createHttpClient } from '../utils/httpClient'

const apiClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  retryDelay: 2000,
  headers: {
    'Authorization': 'Bearer token',
    'X-API-Key': 'key'
  }
})

// Use configured client
const data = await apiClient.get('/endpoint')
```

### Per-Request Configuration

```typescript
const data = await httpClient.get('/endpoint', {
  timeout: 5000,      // Override timeout
  retries: 1,         // Override retries
  retryDelay: 500,    // Override retry delay
  params: {           // Query parameters
    page: '1',
    limit: '10'
  },
  headers: {          // Additional headers
    'X-Custom': 'value'
  }
})
```

## Best Practices

### 1. Use Firebase for App Data
```typescript
// ❌ DON'T: Use HTTP client for app data
const habits = await httpClient.get('/api/habits')

// ✅ DO: Use Firebase hooks
const { data: habits } = useHabits()
```

### 2. Cache External API Calls
```typescript
// ✅ DO: Use React Query for caching
const { data } = useHttpQuery({
  url: 'https://api.external.com/data',
  queryKey: ['external-data'],
  staleTime: 300000, // 5 minutes
  cacheTime: 600000, // 10 minutes
})
```

### 3. Handle Network Status
```typescript
// ✅ DO: Check network status for critical operations
const { isOnline, executeWhenOnline } = useNetworkStatus()

if (!isOnline) {
  showOfflineMessage()
  return
}

await executeWhenOnline(() => sendData())
```

### 4. Set Appropriate Timeouts
```typescript
// ✅ DO: Use shorter timeouts for health checks
await httpClient.get('/health', { timeout: 3000 })

// ✅ DO: Use longer timeouts for file uploads
await httpClient.post('/upload', file, { timeout: 60000 })
```

### 5. Implement Proper Error Handling
```typescript
// ✅ DO: Handle different error types
try {
  await httpClient.post('/api/action', data)
} catch (error) {
  if (error instanceof HttpError && error.status === 401) {
    redirectToLogin()
  } else if (error instanceof TimeoutError) {
    showTimeoutMessage()
  } else {
    showGenericError()
  }
}
```

## Testing

### Mock HTTP Requests

```typescript
import { vi } from 'vitest'
import { httpClient } from '../utils/httpClient'

vi.mock('../utils/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

// In test
vi.mocked(httpClient.get).mockResolvedValue({ data: 'test' })
```

### Test Network Status

```typescript
import { networkStatus } from '../utils/networkStatus'

// Simulate offline
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
})

window.dispatchEvent(new Event('offline'))
```

## Performance Considerations

1. **Caching**: Use React Query's caching for external APIs
2. **Retries**: Limit retries to avoid overwhelming servers
3. **Timeouts**: Set appropriate timeouts based on operation type
4. **Network Awareness**: Adjust behavior based on connection speed
5. **Request Cancellation**: Automatic cancellation on timeout via AbortController

## Security

1. **HTTPS Only**: Always use HTTPS for external APIs
2. **API Keys**: Store API keys in environment variables
3. **CORS**: Ensure proper CORS configuration on external APIs
4. **Rate Limiting**: Implement rate limiting for external API calls
5. **Input Validation**: Validate all data before sending

## Migration Guide

If you need to add external API integration:

1. **Identify the need**: Confirm it's truly external (not Firebase)
2. **Use HTTP client**: Import and use `httpClient` or `useHttpQuery`
3. **Add caching**: Configure React Query caching strategy
4. **Handle errors**: Implement proper error handling
5. **Test offline**: Verify behavior when offline

## Summary

- **Firebase SDK**: Use for 95% of app data operations
- **HTTP Client**: Use only for external API integrations
- **React Query**: Provides caching and synchronization
- **Network Status**: Enables network-aware behavior
- **Error Handling**: Comprehensive error types and retry logic

The app is already well-architected with Firebase. The HTTP client system is available for future external integrations but should be used sparingly.
