import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from '../Dashboard'
import * as useAuthModule from '../../hooks/useAuth'
import * as firestore from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore'

vi.mock('../../hooks/useAuth')
vi.mock('firebase/firestore')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' }
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: mockUser as any,
      loading: false,
    })
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      signOut: { mutateAsync: mockSignOut } as any,
    } as any)
  })

  it('should render dashboard with navigation', () => {
    const mockGetDocs = vi.fn().mockResolvedValue({
      forEach: vi.fn(),
    })
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText(/habit tracker/i)).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new habit/i })).toBeInTheDocument()
  })

  it('should display loading state while fetching habits', () => {
    const mockGetDocs = vi.fn(() => new Promise(() => {}))
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText(/my habits/i)).toBeInTheDocument()
  })

  it('should display empty state when no habits exist', async () => {
    const mockGetDocs = vi.fn().mockResolvedValue({
      forEach: vi.fn(),
    })
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    render(<Dashboard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/welcome to your habit tracking dashboard/i)).toBeInTheDocument()
    })
  })

  it('should render habit list with mock data', async () => {
    const mockHabits = [
      {
        id: 'habit-1',
        habitName: 'Morning Meditation',
        frequency: 'daily',
        duration: 30,
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      },
      {
        id: 'habit-2',
        habitName: 'Gym Workout',
        frequency: ['monday', 'wednesday', 'friday'],
        duration: 30,
        reminderTime: '18:00',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      },
    ]

    const mockGetDocs = vi.fn().mockResolvedValue({
      forEach: (callback: any) => {
        mockHabits.forEach((habit) => {
          callback({
            id: habit.id,
            data: () => habit,
          })
        })
      },
    })

    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    const mockGetDoc = vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({
        currentStreak: 5,
        longestStreak: 10,
        completionRate: 80,
        totalDays: 10,
        completedDays: 8,
        lastUpdated: Timestamp.now(),
      }),
    })
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<Dashboard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
      expect(screen.getByText('Gym Workout')).toBeInTheDocument()
    })

    expect(screen.getByText(/daily/i)).toBeInTheDocument()
    expect(screen.getByText(/monday, wednesday, friday/i)).toBeInTheDocument()
  })

  it('should navigate to habit detail page when habit card is clicked', async () => {
    const mockHabits = [
      {
        id: 'habit-1',
        habitName: 'Morning Meditation',
        frequency: 'daily',
        duration: 30,
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      },
    ]

    const mockGetDocs = vi.fn().mockResolvedValue({
      forEach: (callback: any) => {
        mockHabits.forEach((habit) => {
          callback({
            id: habit.id,
            data: () => habit,
          })
        })
      },
    })

    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    const mockGetDoc = vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({
        currentStreak: 5,
        longestStreak: 10,
        completionRate: 80,
        totalDays: 10,
        completedDays: 8,
        lastUpdated: Timestamp.now(),
      }),
    })
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<Dashboard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    const habitCard = screen.getByText('Morning Meditation').closest('div')
    if (habitCard) {
      fireEvent.click(habitCard)
    }

    expect(mockNavigate).toHaveBeenCalledWith('/habits/habit-1')
  })

  it('should navigate to create habit page when create button is clicked', () => {
    const mockGetDocs = vi.fn().mockResolvedValue({
      forEach: vi.fn(),
    })
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.query).mockReturnValue({} as any)
    vi.mocked(firestore.getDocs).mockImplementation(mockGetDocs)

    render(<Dashboard />, { wrapper: createWrapper() })

    const createButton = screen.getByRole('button', { name: /create new habit/i })
    fireEvent.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/habits/create')
  })
})
