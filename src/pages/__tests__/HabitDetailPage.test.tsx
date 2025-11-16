import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitDetailPage } from '../HabitDetailPage'
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

const createWrapper = (habitId: string = 'habit-1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/habits/:habitId" element={children} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('HabitDetailPage', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' }
  const mockHabit = {
    id: 'habit-1',
    habitName: 'Morning Meditation',
    frequency: 'daily',
    duration: 30,
    reminderTime: '09:00',
    startDate: Timestamp.now(),
    createdAt: Timestamp.now(),
    isActive: true,
  }
  const mockAnalytics = {
    currentStreak: 5,
    longestStreak: 10,
    completionRate: 80,
    totalDays: 10,
    completedDays: 8,
    lastUpdated: Timestamp.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: mockUser as any,
      loading: false,
    })
    window.history.pushState({}, '', '/habits/habit-1')
  })

  it('should render habit information', async () => {
    const mockGetDoc = vi.fn()
      .mockResolvedValueOnce({
        exists: () => true,
        id: mockHabit.id,
        data: () => mockHabit,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => mockAnalytics,
      })

    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText(/frequency: daily/i)).toBeInTheDocument()
    expect(screen.getByText(/duration: 30 days/i)).toBeInTheDocument()
    expect(screen.getByText(/reminder: 09:00/i)).toBeInTheDocument()
  })

  it('should display analytics with StreakDisplay and CompletionRateCard', async () => {
    const mockGetDoc = vi.fn()
      .mockResolvedValueOnce({
        exists: () => true,
        id: mockHabit.id,
        data: () => mockHabit,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => mockAnalytics,
      })

    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('8 of 10 days completed')).toBeInTheDocument()
  })

  it('should navigate back to dashboard when back button is clicked', async () => {
    const mockGetDoc = vi.fn()
      .mockResolvedValueOnce({
        exists: () => true,
        id: mockHabit.id,
        data: () => mockHabit,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => mockAnalytics,
      })

    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should display error message when habit is not found', async () => {
    const mockGetDoc = vi.fn().mockResolvedValue({
      exists: () => false,
    })

    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/habit not found/i)).toBeInTheDocument()
    })
  })

  it('should render habit with specific days frequency', async () => {
    const habitWithSpecificDays = {
      ...mockHabit,
      frequency: ['monday', 'wednesday', 'friday'],
    }

    const mockGetDoc = vi.fn()
      .mockResolvedValueOnce({
        exists: () => true,
        id: habitWithSpecificDays.id,
        data: () => habitWithSpecificDays,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => mockAnalytics,
      })

    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.getDoc).mockImplementation(mockGetDoc)

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText(/frequency: monday, wednesday, friday/i)).toBeInTheDocument()
  })
})
