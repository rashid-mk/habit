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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{habit.habitName}</h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p>
              Frequency:{' '}
              {habit.frequency === 'daily'
                ? 'Daily'
                : Array.isArray(habit.frequency)
                ? habit.frequency.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                : habit.frequency}
            </p>
            <p>Duration: {habit.duration} days</p>
            {habit.reminderTime && (
              <p>Reminder: {habit.reminderTime}</p>
            )}
            <p>
              Started:{' '}
              {habit.startDate?.toDate
                ? new Date(habit.startDate.toDate()).toLocaleDateString()
                : 'Recently'}
            </p>
          </div>
        </div>

        {analyticsLoading && (
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}

        {!analyticsLoading && analytics && (
          <div className="grid gap-6 md:grid-cols-2 mb-6">
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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Check-In</h2>
          <CheckInButton
            habitId={habitId || ''}
            date={today}
            isCompleted={isCheckedInToday}
            onCheckIn={handleCheckIn}
          />
        </div>

        {checksLoading && (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {!checksLoading && checks && habit && (
          <TimelineGraph
            checks={checks}
            startDate={habit.startDate?.toDate ? habit.startDate.toDate() : new Date()}
          />
        )}
      </main>
    </div>
  )
}
