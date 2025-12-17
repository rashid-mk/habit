import { useParams, useNavigate } from 'react-router-dom'
import { useHabit, useHabitAnalytics, useHabitChecks, useDeleteHabit } from '../hooks/useHabits'
import { ErrorMessage } from '../components/ErrorMessage'
import { Navigation } from '../components/Navigation'
import { DetailedBreakdownView } from '../components/DetailedBreakdownView'
import { ExportModal } from '../components/ExportModal'
import { AnalyticsDashboard } from '../components/AnalyticsDashboard'

import { usePremiumAccess } from '../hooks/usePremiumAccess'
import { useState } from 'react'
import dayjs from 'dayjs'
import { usePerformanceTrace } from '../hooks/usePerformanceTrace'

type TabType = 'overview' | 'analytics'

export function HabitDetailPage() {
  const { habitId } = useParams<{ habitId: string }>()
  const navigate = useNavigate()
  const { data: habit, isLoading: habitLoading, error: habitError, refetch: refetchHabit } = useHabit(habitId || '')
  const { data: analytics, isLoading: analyticsLoading } = useHabitAnalytics(habitId || '')
  const { data: checks, isLoading: checksLoading } = useHabitChecks(habitId || '')
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess()
  const deleteHabitMutation = useDeleteHabit()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Track habit detail page load performance
  usePerformanceTrace('habit_detail_page_load')

  const handleDelete = async () => {
    if (!habitId) return
    try {
      await deleteHabitMutation.mutateAsync(habitId)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete habit:', error)
    }
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-sm transition-all flex items-center space-x-2 border border-indigo-200 dark:border-indigo-800 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 shadow-xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Overview
              </div>
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-300" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'analytics'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Premium Analytics
                {!isPremium && !premiumLoading && (
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {activeTab === 'analytics' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl border border-white/20 dark:border-gray-700/20 p-8 shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Delete Habit?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Are you sure you want to delete "{habit.habitName}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteHabitMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deleteHabitMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Habit</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          habits={[habit]}
          completions={checks || []}
          onClose={() => setShowExportModal(false)}
        />

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
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

              {/* Completed Days */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.completedDays}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
              </div>

              {/* Current Streak */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.currentStreak}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              </div>

              {/* Total Days Since Start */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalDays}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Days Active</p>
              </div>
            </div>
          </div>
        )}





        {/* Last 30 Days History */}
        {!checksLoading && checks && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Last 30 Days History
              </h2>
              {(habit.trackingType === 'count' || habit.trackingType === 'time') && (() => {
                const today = dayjs()
                const last30DaysData = checks.filter(check => {
                  const checkDate = dayjs(check.dateKey)
                  return checkDate.isAfter(today.subtract(30, 'day')) && checkDate.isBefore(today.add(1, 'day'))
                })
                
                if (habit.trackingType === 'count') {
                  const totalCount = last30DaysData.reduce((sum, check) => sum + (check.progressValue || 0), 0)
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-800">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Count</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCount}</p>
                      </div>
                    </div>
                  )
                } else {
                  const totalMinutes = last30DaysData.reduce((sum, check) => sum + (check.progressValue || 0), 0)
                  const unit = habit.targetUnit || 'minutes'
                  const displayValue = unit === 'hours' ? Math.floor(totalMinutes / 60) : totalMinutes
                  const displayUnit = unit === 'hours' ? 'hrs' : 'min'
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-800">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Time</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{displayValue} {displayUnit}</p>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
            {/* Visualization based on tracking type */}
            {(() => {
              const last30Days = []
              const today = dayjs()
              const habitStart = dayjs(habit.startDate.toDate())
              const selectedDays = habit.frequency === 'daily' ? null : habit.frequency
              const trackingType = habit.trackingType || 'simple'
              
              for (let i = 29; i >= 0; i--) {
                const date = today.subtract(i, 'day')
                const dateKey = date.format('YYYY-MM-DD')
                const check = checks.find(c => c.dateKey === dateKey)
                
                const isBeforeStart = date.isBefore(habitStart, 'day')
                const dayNameLower = date.format('dddd').toLowerCase()
                const isActiveDay = !selectedDays || selectedDays.includes(dayNameLower)
                
                let status: 'done' | 'not_done' | 'skip' = 'skip'
                let progressValue = 0
                
                if (check) {
                  status = check.status || 'done'
                  progressValue = check.progressValue || 0
                }
                
                last30Days.push({
                  date,
                  dateKey,
                  status,
                  progressValue,
                  dayNumber: date.date(),
                  monthDay: date.format('MMM D'),
                  isBeforeStart,
                  isActiveDay
                })
              }
              
              // SIMPLE HABITS: Grid with checkmarks/X
              if (trackingType === 'simple') {
                return (
                  <div className="grid grid-cols-10 gap-2">
                    {last30Days.map((day, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col items-center group relative"
                      >
                        <div className={`w-full aspect-square rounded-lg transition-all duration-200 flex items-center justify-center ${
                          day.isBeforeStart || !day.isActiveDay
                            ? 'bg-gray-100 dark:bg-gray-800 opacity-30'
                            : day.status === 'done'
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-md group-hover:scale-110'
                            : day.status === 'not_done'
                            ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-md group-hover:scale-110'
                            : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                        }`}>
                          {!day.isBeforeStart && day.isActiveDay && day.status === 'done' && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {!day.isBeforeStart && day.isActiveDay && day.status === 'not_done' && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] mt-1 ${
                          day.isBeforeStart || !day.isActiveDay 
                            ? 'text-gray-400 dark:text-gray-600' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {day.dayNumber}
                        </span>
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap shadow-lg">
                            {day.monthDay}: {day.isBeforeStart ? 'Before start' : !day.isActiveDay ? 'Not active' : day.status === 'done' ? '✓ Done' : day.status === 'not_done' ? '✗ Not Done' : '- Skipped'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              
              // COUNT & TIME HABITS: Heatmap-style grid (like GitHub contributions)
              const targetValue = habit.targetValue || 1
              const unit = habit.targetUnit || 'minutes'
              
              // Calculate intensity levels (0-4) based on progress
              const getIntensityLevel = (value: number) => {
                if (value === 0) return 0
                const percentage = (value / targetValue) * 100
                if (percentage >= 100) return 4 // Goal reached
                if (percentage >= 75) return 3  // 75-99%
                if (percentage >= 50) return 2  // 50-74%
                if (percentage >= 25) return 1  // 25-49%
                return 1 // 1-24%
              }
              
              return (
                <div className="space-y-3">
                  {/* Heatmap Grid */}
                  <div className="grid grid-cols-10 gap-2">
                    {last30Days.map((day, index) => {
                      const intensity = getIntensityLevel(day.progressValue)
                      const isComplete = day.progressValue >= targetValue
                      
                      // Color classes based on intensity
                      let colorClass = ''
                      if (day.isBeforeStart || !day.isActiveDay) {
                        colorClass = 'bg-gray-100 dark:bg-gray-800 opacity-40'
                      } else if (intensity === 0) {
                        colorClass = 'bg-gray-200 dark:bg-gray-700'
                      } else if (intensity === 1) {
                        colorClass = trackingType === 'count' 
                          ? 'bg-blue-200 dark:bg-blue-900/40' 
                          : 'bg-green-200 dark:bg-green-900/40'
                      } else if (intensity === 2) {
                        colorClass = trackingType === 'count'
                          ? 'bg-blue-400 dark:bg-blue-700/60'
                          : 'bg-green-400 dark:bg-green-700/60'
                      } else if (intensity === 3) {
                        colorClass = trackingType === 'count'
                          ? 'bg-blue-500 dark:bg-blue-600/80'
                          : 'bg-green-500 dark:bg-green-600/80'
                      } else {
                        colorClass = trackingType === 'count'
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-green-600 dark:bg-green-500'
                      }
                      
                      return (
                        <div key={index} className="flex flex-col items-center group relative">
                          {/* Heatmap square */}
                          <div className={`w-full aspect-square rounded-lg transition-all duration-200 ${colorClass} hover:scale-110 hover:shadow-lg cursor-pointer border border-gray-300/20 dark:border-gray-600/20`}>
                            {/* Show value inside square for completed goals */}
                            {isComplete && day.progressValue > 0 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Day number */}
                          <span className={`text-[10px] mt-1 font-medium ${
                            day.isBeforeStart || !day.isActiveDay 
                              ? 'text-gray-400 dark:text-gray-600' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {day.dayNumber}
                          </span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl border border-gray-700 dark:border-gray-600">
                              <div className="font-semibold mb-1">{day.monthDay}</div>
                              {day.isBeforeStart ? (
                                <div className="text-gray-300">Before start</div>
                              ) : !day.isActiveDay ? (
                                <div className="text-gray-300">Not active</div>
                              ) : trackingType === 'count' ? (
                                <div className="space-y-1">
                                  <div>
                                    <span className="text-white font-bold text-base">{day.progressValue}</span>
                                    <span className="text-gray-300"> / {targetValue}</span>
                                  </div>
                                  <div className="text-gray-400 text-[10px]">
                                    {day.progressValue === 0 ? 'No activity' : 
                                     isComplete ? '✓ Goal reached!' : 
                                     `${Math.round((day.progressValue / targetValue) * 100)}% of goal`}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div>
                                    {unit === 'hours' ? (
                                      <>
                                        <span className="text-white font-bold text-base">{Math.floor(day.progressValue / 60)}h {day.progressValue % 60}m</span>
                                        <span className="text-gray-300"> / {Math.floor(targetValue / 60)}h</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-white font-bold text-base">{day.progressValue}</span>
                                        <span className="text-gray-300"> / {targetValue} min</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-gray-400 text-[10px]">
                                    {day.progressValue === 0 ? 'No activity' : 
                                     isComplete ? '✓ Goal reached!' : 
                                     `${Math.round((day.progressValue / targetValue) * 100)}% of goal`}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Intensity legend */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300/20 dark:border-gray-600/20"></div>
                      <div className={`w-4 h-4 rounded border border-gray-300/20 dark:border-gray-600/20 ${
                        trackingType === 'count' ? 'bg-blue-200 dark:bg-blue-900/40' : 'bg-green-200 dark:bg-green-900/40'
                      }`}></div>
                      <div className={`w-4 h-4 rounded border border-gray-300/20 dark:border-gray-600/20 ${
                        trackingType === 'count' ? 'bg-blue-400 dark:bg-blue-700/60' : 'bg-green-400 dark:bg-green-700/60'
                      }`}></div>
                      <div className={`w-4 h-4 rounded border border-gray-300/20 dark:border-gray-600/20 ${
                        trackingType === 'count' ? 'bg-blue-500 dark:bg-blue-600/80' : 'bg-green-500 dark:bg-green-600/80'
                      }`}></div>
                      <div className={`w-4 h-4 rounded border border-gray-300/20 dark:border-gray-600/20 ${
                        trackingType === 'count' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-green-600 dark:bg-green-500'
                      }`}></div>
                    </div>
                    <span>More</span>
                  </div>
                </div>
              )
            })()}
            
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs flex-wrap">
              {(habit.trackingType || 'simple') === 'simple' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Done</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-orange-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Not Done</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-gray-600 dark:text-gray-400">Skipped</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-t from-green-500 to-emerald-400"></div>
                    <span className="text-gray-600 dark:text-gray-400">Goal Reached</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-t from-blue-500 to-blue-400"></div>
                    <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
                    <span className="text-gray-600 dark:text-gray-400">No Activity</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 opacity-30"></div>
                <span className="text-gray-600 dark:text-gray-400">Inactive</span>
              </div>
            </div>
          </div>
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

        {/* Detailed Breakdown Views */}
        {!checksLoading && checks && (
          <DetailedBreakdownView
            checks={checks}
            habitStartDate={habit.startDate.toDate()}
            habitFrequency={habit.frequency}
            trackingType={habit.trackingType}
            targetValue={habit.targetValue}
            targetUnit={habit.targetUnit}
          />
        )}

              {/* Delete Habit Section */}
              <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Once you delete a habit, there is no going back. Please be certain.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 rounded-xl bg-red-500/10 dark:bg-red-900/20 hover:bg-red-500/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold text-sm transition-all flex items-center space-x-2 border-2 border-red-300 dark:border-red-800 hover:border-red-400 dark:hover:border-red-700 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Habit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Premium Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              {!premiumLoading && checks ? (
                <AnalyticsDashboard
                  habit={habit}
                  completions={checks}
                  className="space-y-6"
                />
              ) : (
                <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-8 shadow-xl">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
