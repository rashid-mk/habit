import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../useAuth'
import * as firebaseAuth from 'firebase/auth'
import * as firestore from 'firebase/firestore'

vi.mock('firebase/auth')
vi.mock('firebase/firestore')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login with email and password', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.loginWithEmail.mutate({
      email: 'test@example.com',
      password: 'password123',
    })

    await waitFor(() => expect(result.current.loginWithEmail.isSuccess).toBe(true))
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled()
  })

  it('should signup and create user profile', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com', displayName: null }
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any)
    vi.mocked(firestore.setDoc).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.signup.mutate({
      email: 'test@example.com',
      password: 'password123',
    })

    await waitFor(() => expect(result.current.signup.isSuccess).toBe(true))
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled()
    expect(firestore.setDoc).toHaveBeenCalled()
  })

  it('should login with Google', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' }
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue({
      user: mockUser,
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    result.current.loginWithGoogle.mutate()

    await waitFor(() => expect(result.current.loginWithGoogle.isSuccess).toBe(true))
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalled()
  })
})
