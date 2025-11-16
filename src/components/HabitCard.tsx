import { useState } from 'react'
import { useHabitAnalytics, Habit, useCheckIn } from '../hooks/useHabits'
import dayjs from 'dayjs'

interface HabitCardProps {
  habit: Habit
  onClick: () => void
}

export function HabitCard({ habit, onClick }: HabitCardProps) {
  const { data: analytics, isLoading } = useHabitAnalytics(habit.id)
  const checkInMutation = useCheckIn()
  const [actionTaken, setActionTaken] = useState<'done' | 'skip' | null>(null)
  const isBreakHabit = habit.habitType === 'break'
  const today = dayjs().format('YYYY-MM-DD')

  const handleAction = async (e: React.MouseEvent, action: 'done' | 'skip') => {
    e.stopPropagation() // Prevent card click
    
    if (action === 'done') {
      await checkInMutation.mutateAsync({ habitId: habit.id, date: today })
    }
    setActionTaken(action)
  }

  const getFrequencyDisplay = () => {
    if (habit.frequency === 'daily') return 'Daily'
    if (Array.isArray(habit.frequency)) {
      return habit.frequency.map(d => d.charAt(0).toUpperCase()).join(', ')
    }
    return habit.frequency
  }

  return (
    <div
      onClick={onClick}
      className={`group backdrop-blur-xl rounded-2xl border p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ${
        isBreakHabit
          ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200/20 dark:border-red-800/20 hover:bg-red-50/60 dark:hover:bg-red-900/20'
          : 'bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/20 hover:bg-white/60 dark:hover:bg-gray-800/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`text-lg font-bold transition-colors ${
              isBreakHabit
                ? 'text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}>
              {habit.habitName}
            </h3>
            {isBreakHabit && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                Break
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{getFrequencyDisplay()}</span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
          isBreakHabit
            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
            : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
        }`}>
          <svg className={`w-5 h-5 ${isBreakHabit ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isBreakHabit ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            )}
          </svg>
        </div>
      </div>

      {/* Stats */}
      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200/50 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200/50 rounded w-1/2"></div>
        </div>
      )}

      {!isLoading && analytics && (
        <div className="space-y-3">
          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <span className="text-sm text-gray-600">Streak</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{analytics.currentStreak} days</span>
          </div>

          {/* Completion Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">Completion</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{analytics.completionRate.toFixed(0)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="w-full h-2 bg-gray-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${analytics.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!actionTaken && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleAction(e, 'done')}
              disabled={checkInMutation.isPending}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                isBreakHabit
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{isBreakHabit ? 'Avoided' : 'Done'}</span>
            </button>
            <button
              onClick={(e) => handleAction(e, 'skip')}
              disabled={checkInMutation.isPending}
              className="flex-1 py-2 px-3 rounded-lg font-medium text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span>Skip</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Taken Feedback */}
      {actionTaken && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className={`py-2 px-3 rounded-lg text-center text-sm font-medium ${
            actionTaken === 'done'
              ? isBreakHabit
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {actionTaken === 'done' 
              ? isBreakHabit ? '✓ Avoided today!' : '✓ Completed today!'
              : '→ Skipped for today'}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{habit.duration} days goal</span>
        <span className="flex items-center space-x-1">
          <span>View details</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  )
}
