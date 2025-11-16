import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHabits, useCheckIn } from '../useHabits'
import { FirebaseError } from 'firebase/app'
import { ReactNode } from 'react'

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
}))

// Mock useAuthState
vi.mock('../useAuth', () => ({
  useAuthState: () => ({
    user: { uid: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000 }),
  },
}))

describe('useHabits error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('handles permission-denied error', async () => {
    const { getDocs } = await import('firebase/firestore')
    vi.mocked(getDocs).mockRejectedValue(
      new FirebaseError('permission-denied', 'Permission denied')
    )

    const { result } = renderHook(() => useHabits(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('permission')
    })
  })

  it('handles unavailable error (offline)', async () => {
    const { getDocs } = await import('firebase/firestore')
    vi.mocked(getDocs).mockRejectedValue(
      new FirebaseError('unavailable', 'Service unavailable')
    )

    const { result } = renderHook(() => useHabits(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Connection lost')
    })
  })

  it('handles not-found error', async () => {
    const { getDocs } = await import('firebase/firestore')
    vi.mocked(getDocs).mockRejectedValue(
      new FirebaseError('not-found', 'Not found')
    )

    const { result } = renderHook(() => useHabits(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Failed to load habits')
    })
  })
})

describe('useCheckIn error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('handles offline check-in with unavailable error', async () => {
    const { setDoc } = await import('firebase/firestore')
    vi.mocked(setDoc).mockRejectedValue(
      new FirebaseError('unavailable', 'Service unavailable')
    )

    const { result } = renderHook(() => useCheckIn(), { wrapper })

    await waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined()
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit1', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toContain('Changes will sync when online')
    }
  })

  it('handles duplicate check-in error', async () => {
    const { getDoc, setDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ dateKey: '2025-11-15' }),
    } as any)

    const { result } = renderHook(() => useCheckIn(), { wrapper })

    await waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined()
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit1', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toContain('Already completed today')
    }

    expect(setDoc).not.toHaveBeenCalled()
  })

  it('handles permission-denied error on check-in', async () => {
    const { setDoc } = await import('firebase/firestore')
    vi.mocked(setDoc).mockRejectedValue(
      new FirebaseError('permission-denied', 'Permission denied')
    )

    const { result } = renderHook(() => useCheckIn(), { wrapper })

    await waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined()
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit1', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toContain('permission')
    }
  })
})
