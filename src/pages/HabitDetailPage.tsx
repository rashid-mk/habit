import { useParams } from 'react-router-dom'
import { useHabit, useHabitAnalytics, useCheckIn, useHabitChecks } from '../hooks/useHabits'
import { StreakDisplay } from '../components/StreakDisplay'
import { CompletionRateCard } from '../components/CompletionRateCard'
import { CheckInButton } from '../components/CheckInButton'
import { TimelineGraph } from '../components/TimelineGraph'
import { ErrorMessage } from '../components/ErrorMessage'
import { Navigation } from '../components/Navigation'
import { useState } from 'react'
import dayjs from 'dayjs'
import { usePerformanceTrace } from '../hooks/usePerformanceTrace'

export function HabitDetailPage() {
  const { habitId } = useParams<{ habitId: string }>()
  const { data: habit, isLoading: habitLoading, error: habitError, refetch: refetchHabit } = useHabit(habitId || '')
  const { data: analytics, isLoading: analyticsLoading } = useHabitAnalytics(habitId || '')
  const { data: checks, isLoading: checksLoading } = useHabitChecks(habitId || '')
  const checkInMutation = useCheckIn()
  const [isCheckedInToday, setIsCheckedInToday] = useState(false)

  // Track habit detail page load performance
  usePerformanceTrace('habit_detail_page_load')

  const today = dayjs().format('YYYY-MM-DD')

  const handleCheckIn = async (habitId: string, date: string) => {
    await checkInMutation.mutateAsync({ habitId, date })
    setIsCheckedInToday(true)
  }

  if (habitLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation showBackButton backTo="/dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </main>
      </div>
    )
  }

  if (habitError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation showBackButton backTo="/dashboard" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage error={habitError} onRetry={() => refetchHabit()} />
        </main>
      </div>
    )
  }

  if (!habit) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation showBackButton backTo="/dashboard" title={habit.habitName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{habit.habitName}</h1>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {habit.frequency === 'daily'
                    ? 'Every Day'
                    : Array.isArray(habit.frequency)
                    ? habit.frequency.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                    : habit.frequency}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {habit.duration} days goal
                </span>
                {habit.reminderTime && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {habit.reminderTime}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-4">
              <CheckInButton
                habitId={habitId || ''}
                date={today}
                isCompleted={isCheckedInToday}
                onCheckIn={handleCheckIn}
              />
            </div>
          </div>
        </div>

        {/* Overview Statistics */}
        {!analyticsLoading && analytics && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Score */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - analytics.completionRate / 100)}`}
                      className="text-blue-500 dark:text-blue-400 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round(analytics.completionRate)}%
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Score</p>
              </div>

              {/* Month */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.completedDays}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
              </div>

              {/* Year */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalDays}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">All Time</p>
              </div>

              {/* Total */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalDays}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Streaks Section */}
        {!analyticsLoading && analytics && (
          <div className="grid gap-6 md:grid-cols-2">
            <StreakDisplay
              currentStreak={analytics.currentStreak}
              longestStreak={analytics.longestStreak}
            />
            <CompletionRateCard
              completionRate={analytics.completionRate}
              totalDays={analytics.totalDays}
              completedDays={analytics.completedDays}
            />
          </div>
        )}

        {/* History Chart */}
        {!checksLoading && checks && checks.length > 0 && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              History
            </h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {checks.slice(-14).map((check, index) => {
                const isCompleted = check.completedAt !== null
                const height = isCompleted ? Math.random() * 60 + 40 : 20
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {dayjs(check.dateKey).format('DD')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Calendar View */}
        {!checksLoading && checks && habit && (
          <TimelineGraph
            checks={checks}
            startDate={habit.startDate?.toDate ? habit.startDate.toDate() : new Date()}
          />
        )}

        {/* Best Streaks */}
        {!analyticsLoading && analytics && analytics.longestStreak > 0 && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Best Streaks
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Longest Streak</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Your personal best</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.longestStreak}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">days</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Streak</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Keep it going!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.currentStreak}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {analyticsLoading && (
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
