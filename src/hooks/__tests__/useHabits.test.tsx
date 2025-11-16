import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateHabit, useCheckIn } from '../useHabits'
import * as useAuthModule from '../useAuth'
import * as firestore from 'firebase/firestore'

vi.mock('../useAuth')
vi.mock('firebase/firestore')
vi.mock('dayjs', () => ({
  default: vi.fn((date?: string) => ({
    format: (fmt: string) => date || '2025-11-15',
  })),
}))

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

describe('useCreateHabit', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' }
  const mockHabitData = {
    habitName: 'Morning Meditation',
    frequency: 'daily' as const,
    duration: 30,
    reminderTime: '09:00',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: mockUser as any,
      loading: false,
    })
  })

  it('should create habit document in Firestore', async () => {
    const mockHabitId = 'habit-123'
    const mockAddDoc = vi.fn().mockResolvedValue({ id: mockHabitId })
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockImplementation(mockAddDoc)
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockHabitData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify habit document was created
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        habitName: 'Morning Meditation',
        frequency: 'daily',
        duration: 30,
        reminderTime: '09:00',
        isActive: true,
      })
    )

    // Verify analytics document was initialized
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalDays: 0,
        completedDays: 0,
      })
    )
  })

  it('should create habit with specific days frequency', async () => {
    const mockHabitId = 'habit-456'
    const mockAddDoc = vi.fn().mockResolvedValue({ id: mockHabitId })
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockImplementation(mockAddDoc)
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const habitDataWithSpecificDays = {
      habitName: 'Gym Workout',
      frequency: ['monday', 'wednesday', 'friday'],
      duration: 30,
    }

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(habitDataWithSpecificDays)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        habitName: 'Gym Workout',
        frequency: ['monday', 'wednesday', 'friday'],
      })
    )
  })

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: null,
      loading: false,
    })

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockHabitData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('User must be authenticated to create a habit')
  })

  it('should handle permission-denied error', async () => {
    const permissionError = new Error('Permission denied')
    ;(permissionError as any).code = 'permission-denied'
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockRejectedValue(permissionError)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockHabitData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('You do not have permission to create habits')
  })

  it('should handle unavailable error', async () => {
    const unavailableError = new Error('Service unavailable')
    ;(unavailableError as any).code = 'unavailable'
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockRejectedValue(unavailableError)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockHabitData)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Connection lost. Please check your internet connection')
  })

  it('should return habitId on success', async () => {
    const mockHabitId = 'habit-789'
    const mockAddDoc = vi.fn().mockResolvedValue({ id: mockHabitId })
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockImplementation(mockAddDoc)
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCreateHabit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockHabitData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({ habitId: mockHabitId })
  })
})


describe('useCheckIn', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: mockUser as any,
      loading: false,
    })
  })

  it('should write check document to Firestore with correct dateKey', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false })
    
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ habitId: 'habit-123', date: '2025-11-15' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify check document was created with correct structure
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dateKey: '2025-11-15',
        habitId: 'habit-123',
      })
    )
  })

  it('should prevent duplicate check-ins for same date', async () => {
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => true })
    
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit-123', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toBe('Already completed today')
    }

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: null,
      loading: false,
    })

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit-123', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toBe('User must be authenticated to check in')
    }

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should handle permission-denied error', async () => {
    const permissionError = new Error('Permission denied')
    ;(permissionError as any).code = 'permission-denied'
    
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false })
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)
    vi.mocked(firestore.setDoc).mockRejectedValue(permissionError)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit-123', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toBe('You do not have permission to check in')
    }

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should handle unavailable error with offline message', async () => {
    const unavailableError = new Error('Service unavailable')
    ;(unavailableError as any).code = 'unavailable'
    
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false })
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)
    vi.mocked(firestore.setDoc).mockRejectedValue(unavailableError)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    try {
      await result.current.mutateAsync({ habitId: 'habit-123', date: '2025-11-15' })
    } catch (error: any) {
      expect(error.message).toBe('Connection lost. Changes will sync when online')
    }

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should return dateKey on success', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false })
    
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ habitId: 'habit-123', date: '2025-11-15' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({ dateKey: '2025-11-15' })
  })

  it('should format date as YYYY-MM-DD for document ID', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false })
    
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    const { result } = renderHook(() => useCheckIn(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ habitId: 'habit-123', date: '2025-11-15' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify dateKey is in correct format
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dateKey: '2025-11-15',
      })
    )
  })
})
