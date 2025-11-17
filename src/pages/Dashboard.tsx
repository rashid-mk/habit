import { useState, useMemo } from 'react'
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
import dayjs from 'dayjs'

export function Dashboard() {
  const { user } = useAuthState()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: habits, isLoading, error, refetch } = useHabits()
  const { viewType } = useViewSettings()
  const [sortBy, setSortBy] = useState<'name' | 'created'>('created')
  const [showAllHabits, setShowAllHabits] = useState(false)
  
  // Track dashboard page load performance
  const { putMetric } = usePerformanceTrace('dashboard_page_load')
  
  // Track when data is loaded
  if (!isLoading && habits) {
    putMetric('habits_count', habits.length)
  }
  
  // Filter and sort habits based on selected options
  const filteredAndSortedHabits = useMemo(() => {
    if (!habits) return []
    
    let filtered = [...habits]
    
    // Filter by today's day if showAllHabits is false
    if (!showAllHabits) {
      const today = dayjs().format('dddd').toLowerCase() // e.g., "monday", "tuesday"
      filtered = filtered.filter(habit => {
        // If frequency is 'daily', always show
        if (habit.frequency === 'daily') return true
        
        // If frequency is an array of days, check if today is included
        if (Array.isArray(habit.frequency)) {
          return habit.frequency.some(day => day.toLowerCase() === today)
        }
        
        return false
      })
    }
    
    // Sort the filtered habits
    if (sortBy === 'name') {
      return filtered.sort((a, b) => a.habitName.localeCompare(b.habitName))
    } else {
      // Sort by creation date (newest first)
      return filtered.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime
      })
    }
  }, [habits, sortBy, showAllHabits])

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
  const activeToday = useMemo(() => {
    if (!habits) return 0
    
    const today = dayjs().format('dddd').toLowerCase()
    return habits.filter(habit => {
      // If frequency is 'daily', it's active today
      if (habit.frequency === 'daily') return true
      
      // If frequency is an array of days, check if today is included
      if (Array.isArray(habit.frequency)) {
        return habit.frequency.some(day => day.toLowerCase() === today)
      }
      
      return false
    }).length
  }, [habits])

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
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

        {/* Create Habit Button - Prominent and Centered */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => navigate('/habits/create')}
            className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-4 font-bold text-xl shadow-xl"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Create New Habit</span>
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Habits Section */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Habits</h3>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Show All/Today Toggle */}
            {habits && habits.length > 0 && (
              <div className="flex items-center gap-2 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-1 border border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={() => setShowAllHabits(false)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    !showAllHabits
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Today</span>
                </button>
                <button
                  onClick={() => setShowAllHabits(true)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    showAllHabits
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="text-sm font-medium">All</span>
                </button>
              </div>
            )}
            
            {/* Modern Sort Toggle */}
            {habits && habits.length > 0 && (
              <div className="flex items-center gap-2 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-1 border border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={() => setSortBy('created')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    sortBy === 'created'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Recent</span>
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    sortBy === 'name'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="text-sm font-medium">A-Z</span>
                </button>
              </div>
            )}
          </div>
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

        {!isLoading && !error && filteredAndSortedHabits && filteredAndSortedHabits.length > 0 && (
          <div className={viewType === 'grid' ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4 max-w-4xl mx-auto'}>
            {filteredAndSortedHabits.map((habit) => (
              <div
                key={habit.id}
                onMouseEnter={() => prefetchHabitData(habit.id)}
                onTouchStart={() => prefetchHabitData(habit.id)}
                className="w-full"
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
