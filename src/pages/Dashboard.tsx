import { useAuthState } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useHabits } from '../hooks/useHabits'
import { HabitCard } from '../components/HabitCard'
import { ErrorMessage } from '../components/ErrorMessage'
import { SkeletonCard } from '../components/SkeletonCard'
import { ProfileDropdown } from '../components/ProfileDropdown'
import { useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { usePerformanceTrace } from '../hooks/usePerformanceTrace'
import { useViewSettings } from '../contexts/ViewSettingsContext'

export function Dashboard() {
  const { user } = useAuthState()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: habits, isLoading, error, refetch } = useHabits()
  const { viewType } = useViewSettings()
  
  // Track dashboard page load performance
  const { putMetric } = usePerformanceTrace('dashboard_page_load')
  
  // Track when data is loaded
  if (!isLoading && habits) {
    putMetric('habits_count', habits.length)
  }

  // Prefetch habit details and analytics when hovering over a habit card
  const prefetchHabitData = async (habitId: string) => {
    if (!user) return

    // Prefetch habit details
    await queryClient.prefetchQuery({
      queryKey: ['habit', user.uid, habitId],
      queryFn: async () => {
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        const habitDoc = await getDoc(habitRef)
        if (!habitDoc.exists()) {
          throw new Error('Habit not found')
        }
        return { id: habitDoc.id, ...habitDoc.data() }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Prefetch analytics
    await queryClient.prefetchQuery({
      queryKey: ['analytics', user.uid, habitId],
      queryFn: async () => {
        const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
        const analyticsDoc = await getDoc(analyticsRef)
        if (!analyticsDoc.exists()) {
          return {
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
            totalDays: 0,
            completedDays: 0,
          }
        }
        return analyticsDoc.data()
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  // Calculate stats
  const totalHabits = habits?.length || 0
  const activeToday = habits?.filter(h => h.isActive).length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Navigation */}
      <nav className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Habit Tracker
              </h1>
            </div>
            <ProfileDropdown />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Track your progress and build better habits</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Habits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalHabits}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Habits</h3>
          <button
            onClick={() => navigate('/habits/create')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:scale-110 transition-all duration-200 flex items-center space-x-3 font-bold text-lg shadow-lg shadow-blue-500/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Habit</span>
          </button>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && <ErrorMessage error={error} onRetry={() => refetch()} />}

        {!isLoading && !error && habits && habits.length === 0 && (
          <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-3xl border border-white/20 dark:border-gray-700/20 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No habits yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start your journey by creating your first habit!
            </p>
            <button
              onClick={() => navigate('/habits/create')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your First Habit</span>
            </button>
          </div>
        )}

        {!isLoading && !error && habits && habits.length > 0 && (
          <div className={viewType === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start' : 'flex flex-col gap-4 max-w-4xl mx-auto'}>
            {habits.map((habit) => (
              <div
                key={habit.id}
                onMouseEnter={() => prefetchHabitData(habit.id)}
                onTouchStart={() => prefetchHabitData(habit.id)}
              >
                <HabitCard
                  habit={habit}
                  onClick={() => navigate(`/habits/${habit.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
