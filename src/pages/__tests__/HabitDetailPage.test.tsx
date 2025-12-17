import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitDetailPage } from '../HabitDetailPage'
import * as useAuthModule from '../../hooks/useAuth'
import * as usePremiumAccessModule from '../../hooks/usePremiumAccess'
import * as useHabitsModule from '../../hooks/useHabits'
import * as firestore from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore'

vi.mock('../../hooks/useAuth', () => ({
  useAuthState: vi.fn(),
  useAuth: vi.fn(() => ({
    signOut: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
  }))
}))
vi.mock('../../hooks/usePremiumAccess')
vi.mock('firebase/firestore')
vi.mock('../../components/AnalyticsDashboard', () => ({
  AnalyticsDashboard: ({ habit, completions }: any) => (
    <div data-testid="analytics-dashboard">
      Analytics Dashboard for {habit.habitName} with {completions.length} completions
    </div>
  )
}))
vi.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({ data: null, isLoading: false }))
}))
vi.mock('../../hooks/useHabits', () => ({
  useHabit: vi.fn(),
  useHabitAnalytics: vi.fn(),
  useHabitChecks: vi.fn(),
  useDeleteHabit: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
}))
vi.mock('../../hooks/usePerformanceTrace', () => ({
  usePerformanceTrace: vi.fn()
}))

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
    trackingType: 'simple',
    targetValue: 1,
    targetUnit: 'times',
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
    vi.mocked(usePremiumAccessModule.usePremiumAccess).mockReturnValue({
      isPremium: false,
      isLoading: false,
      checkFeatureAccess: vi.fn(),
      refreshPremiumStatus: vi.fn(),
    })
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      data: mockHabit as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    vi.mocked(useHabitsModule.useHabitAnalytics).mockReturnValue({
      data: mockAnalytics as any,
      isLoading: false,
      error: null,
    })
    vi.mocked(useHabitsModule.useHabitChecks).mockReturnValue({
      data: [] as any,
      isLoading: false,
      error: null,
    })
    window.history.pushState({}, '', '/habits/habit-1')
  })

  it('should render habit information', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText('Every Day')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
  })

  it('should display analytics with StreakDisplay and CompletionRateCard', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('should navigate back to dashboard when back button is clicked', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    const backButton = screen.getByLabelText(/back/i)
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should display error message when habit is not found', async () => {
    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Habit not found'),
      refetch: vi.fn(),
    })

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Habit not found')).toBeInTheDocument()
    })
  })

  it('should render habit with specific days frequency', async () => {
    const habitWithSpecificDays = {
      ...mockHabit,
      frequency: ['monday', 'wednesday', 'friday'],
    }

    vi.mocked(useHabitsModule.useHabit).mockReturnValue({
      data: habitWithSpecificDays as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByText('Monday, Wednesday, Friday')).toBeInTheDocument()
  })

  it('should display tab navigation with overview and analytics tabs', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /premium analytics/i })).toBeInTheDocument()
  })

  it('should switch between overview and analytics tabs', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    // Initially on overview tab
    expect(screen.getByText('80%')).toBeInTheDocument() // Overview stats

    // Click analytics tab
    const analyticsTab = screen.getByRole('button', { name: /premium analytics/i })
    fireEvent.click(analyticsTab)

    // Should not show analytics dashboard for free users (mocked as non-premium)
    expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument()
  })

  it('should show analytics dashboard for premium users', async () => {
    // Mock premium user
    vi.mocked(usePremiumAccessModule.usePremiumAccess).mockReturnValue({
      isPremium: true,
      isLoading: false,
      checkFeatureAccess: vi.fn(),
      refreshPremiumStatus: vi.fn(),
    })

    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    // Click analytics tab
    const analyticsTab = screen.getByRole('button', { name: /premium analytics/i })
    fireEvent.click(analyticsTab)

    // Should show analytics dashboard for premium users
    await waitFor(() => {
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument()
    })
  })

  it('should show lock icon for non-premium users on analytics tab', async () => {
    render(<HabitDetailPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Morning Meditation')).toBeInTheDocument()
    })

    // Should show lock icon for non-premium users
    const analyticsTab = screen.getByRole('button', { name: /premium analytics/i })
    expect(analyticsTab.querySelector('svg')).toBeInTheDocument() // Lock icon
  })
})
