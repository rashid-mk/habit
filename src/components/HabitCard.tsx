import { useState } from 'react'
import { useHabitAnalytics, Habit, useCheckIn, useUndoCheckIn, useHabitChecks, useToggleCheckIn } from '../hooks/useHabits'
import dayjs from 'dayjs'
import { SevenDayTimeline } from './SevenDayTimeline'

interface HabitCardProps {
  habit: Habit
  onClick: () => void
}

export function HabitCard({ habit, onClick }: HabitCardProps) {
  const { data: analytics, isLoading } = useHabitAnalytics(habit.id)
  const checkInMutation = useCheckIn()
  const undoCheckInMutation = useUndoCheckIn()
  const toggleCheckInMutation = useToggleCheckIn()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showDisappointment, setShowDisappointment] = useState(false)
  // Default to 'build' if habitType is not set (for backward compatibility)
  const isBreakHabit = habit.habitType === 'break'
  const today = dayjs().format('YYYY-MM-DD')
  
  // Fetch today's check-in status
  const { data: todayChecks } = useHabitChecks({
    habitId: habit.id,
    startDate: today,
    endDate: today,
  })
  
  // Determine today's status from Firestore
  const todayCheck = todayChecks?.[0]
  const todayStatus: 'done' | 'not_done' | null = todayCheck 
    ? (todayCheck.status || 'done') 
    : null

  const handleAction = async (e: React.MouseEvent, action: 'done' | 'not_done' | 'skip') => {
    e.stopPropagation() // Prevent card click
    
    if (action === 'done') {
      if (todayStatus === 'done') {
        // If already done, unmark it (delete check-in)
        await undoCheckInMutation.mutateAsync({ habitId: habit.id, date: today })
      } else {
        // Show celebration when marking as done
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 1000)
        
        // Mark as done
        await checkInMutation.mutateAsync({ habitId: habit.id, date: today })
      }
    } else if (action === 'not_done') {
      if (todayStatus === 'not_done') {
        // If already not_done, unmark it (delete check-in)
        await undoCheckInMutation.mutateAsync({ habitId: habit.id, date: today })
      } else {
        // Show disappointment animation when marking as not done
        if (todayStatus === 'done') {
          setShowDisappointment(true)
          setTimeout(() => setShowDisappointment(false), 1000)
        }
        
        // Mark as not_done - we need to create a check-in with not_done status
        // First delete any existing check-in
        if (todayStatus) {
          await undoCheckInMutation.mutateAsync({ habitId: habit.id, date: today })
        }
        // Then create a not_done check-in using toggle from skip
        await toggleCheckInMutation.mutateAsync({ 
          habitId: habit.id, 
          date: today, 
          currentStatus: 'skip' 
        })
        // Toggle again to get to not_done (skip → done → not_done)
        await toggleCheckInMutation.mutateAsync({ 
          habitId: habit.id, 
          date: today, 
          currentStatus: 'done' 
        })
      }
    } else if (action === 'skip') {
      // Delete check-in to mark as skipped
      await undoCheckInMutation.mutateAsync({ habitId: habit.id, date: today })
    }
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div
        className={`group backdrop-blur-xl rounded-2xl border-2 p-4 cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden w-full flex flex-col ${
          isExpanded ? '' : 'hover:scale-105'
        } ${
          isBreakHabit
            ? 'bg-gradient-to-br from-red-50/60 to-orange-50/60 dark:from-red-900/20 dark:to-orange-900/20 border-red-300/40 dark:border-red-700/40 hover:border-red-400/60 dark:hover:border-red-600/60 hover:shadow-red-200/50 dark:hover:shadow-red-900/50'
            : 'bg-gradient-to-br from-white/60 to-blue-50/40 dark:from-gray-800/60 dark:to-blue-900/20 border-blue-200/30 dark:border-gray-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/50 hover:shadow-blue-200/50 dark:hover:shadow-blue-900/50'
        }`}
      >
        {/* Decorative Corner Badge */}
        <div className={`absolute top-0 right-0 w-20 h-20 transform translate-x-8 -translate-y-8 rotate-45 ${
          isBreakHabit
            ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10'
            : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'
        }`}></div>
      {/* Compact Header - Always Visible */}
      <div className="space-y-3 relative z-10">
        {/* Top Row: Name and Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1" onClick={onClick}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`text-lg font-bold transition-colors ${
                isBreakHabit
                  ? 'text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                  : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
              }`}>
                {habit.habitName}
              </h3>
              <span 
                className={`px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm text-white flex-shrink-0 ${
                  !habit.color && (isBreakHabit
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500')
                }`}
                style={habit.color ? { 
                  background: `linear-gradient(to right, ${habit.color}, ${habit.color}dd)`
                } : undefined}
              >
                {isBreakHabit ? 'break' : 'build'}
              </span>
            </div>
            
            {/* Today's Status Indicator */}
            {todayStatus && (
              <div className={`text-xs font-medium flex items-center gap-1 ${
                todayStatus === 'done'
                  ? isBreakHabit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {todayStatus === 'done' ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{isBreakHabit ? 'Resisted today' : 'Completed today'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{isBreakHabit ? 'Failed today' : 'Not done today'}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={(e) => handleAction(e, 'done')}
                disabled={checkInMutation.isPending || undoCheckInMutation.isPending}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                  todayStatus === 'done'
                    ? isBreakHabit
                      ? 'bg-gradient-to-br from-red-600 to-orange-600 ring-2 ring-red-400 ring-offset-2 dark:ring-offset-gray-800'
                      : 'bg-gradient-to-br from-green-600 to-emerald-600 ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-800'
                    : isBreakHabit
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-500/30'
                    : 'bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95`}
                title={isBreakHabit ? "Resisted" : "Done"}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              
              {/* Celebration Animation */}
              {showCelebration && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const distance = 40 + Math.random() * 20;
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                        style={{
                          background: isBreakHabit 
                            ? `hsl(${Math.random() * 60}, 100%, ${50 + Math.random() * 20}%)`
                            : `hsl(${120 + Math.random() * 60}, 100%, ${50 + Math.random() * 20}%)`,
                          animation: 'popOut 0.8s ease-out forwards',
                          transform: `translate(-50%, -50%)`,
                          '--tx': `${x}px`,
                          '--ty': `${y}px`,
                          animationDelay: `${i * 0.03}s`,
                          boxShadow: '0 0 8px currentColor',
                        } as React.CSSProperties}
                      />
                    );
                  })}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl" style={{
                    animation: 'popScale 0.6s ease-out'
                  }}>
                    ✨
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={(e) => handleAction(e, 'not_done')}
                disabled={checkInMutation.isPending || undoCheckInMutation.isPending || toggleCheckInMutation.isPending}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  todayStatus === 'not_done'
                    ? isBreakHabit
                      ? 'bg-orange-200 dark:bg-orange-800 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-gray-800 text-orange-700 dark:text-orange-200'
                      : 'bg-red-200 dark:bg-red-800 ring-2 ring-red-400 ring-offset-2 dark:ring-offset-gray-800 text-red-700 dark:text-red-200'
                    : isBreakHabit
                    ? 'bg-orange-100/80 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700'
                    : 'bg-red-100/80 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95`}
                title={isBreakHabit ? "Failed" : "Not Done"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Disappointment Animation */}
              {showDisappointment && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * (Math.PI / 180);
                    const distance = 25 + Math.random() * 15;
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                        style={{
                          background: '#666',
                          animation: 'dropDown 1s ease-in forwards',
                          transform: `translate(-50%, -50%)`,
                          '--tx': `${x}px`,
                          '--ty': `${y + 30}px`,
                          animationDelay: `${i * 0.1}s`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl" style={{
                    animation: 'sadShake 0.8s ease-out'
                  }}>
                    😞
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={(e) => handleAction(e, 'skip')}
              disabled={checkInMutation.isPending || undoCheckInMutation.isPending || toggleCheckInMutation.isPending}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                !todayStatus
                  ? 'bg-gray-300 dark:bg-gray-600 ring-2 ring-gray-400 ring-offset-2 dark:ring-offset-gray-800 text-gray-700 dark:text-gray-200'
                  : 'bg-gray-100/80 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95`}
              title="Skip"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Polished Expand Button - Only when collapsed */}
        {!isExpanded && (
          <button
            onClick={toggleExpand}
            className={`mt-4 w-full py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group/btn ${
              isBreakHabit
                ? 'bg-red-100/60 dark:bg-red-900/20 hover:bg-red-200/80 dark:hover:bg-red-900/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-300'
                : 'bg-blue-100/60 dark:bg-blue-900/20 hover:bg-blue-200/80 dark:hover:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300'
            }`}
            title="Show Details"
          >
            <span className="text-sm font-medium">Show Details</span>
            <svg className="w-4 h-4 transition-transform group-hover/btn:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
        {/* 7-Day Timeline */}
        <div onClick={(e) => e.stopPropagation()}>
          <SevenDayTimeline
            habitId={habit.id}
            habitStartDate={habit.startDate}
            habitColor={habit.color}
            isBreakHabit={isBreakHabit}
          />
        </div>

      {/* Stats */}
      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200/50 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200/50 rounded w-1/2"></div>
        </div>
      )}

      {!isLoading && analytics && (
        <div className="space-y-3 relative z-10">
          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isBreakHabit
                  ? 'bg-orange-500/20 dark:bg-orange-500/30'
                  : 'bg-orange-500/20 dark:bg-orange-500/30'
              }`}>
                <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <span className={`text-sm font-medium ${
                isBreakHabit
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isBreakHabit ? 'Clean Streak' : 'Streak'}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              isBreakHabit
                ? 'text-red-900 dark:text-red-100'
                : 'text-gray-900 dark:text-white'
            }`}>
              {analytics.currentStreak} days
            </span>
          </div>

          {/* Completion Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isBreakHabit
                  ? 'bg-red-500/20 dark:bg-red-500/30'
                  : 'bg-green-500/20 dark:bg-green-500/30'
              }`}>
                <svg className={`w-4 h-4 ${
                  isBreakHabit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isBreakHabit ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <span className={`text-sm font-medium ${
                isBreakHabit
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isBreakHabit ? 'Success Rate' : 'Completion'}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              isBreakHabit
                ? 'text-red-900 dark:text-red-100'
                : 'text-gray-900 dark:text-white'
            }`}>
              {analytics.completionRate.toFixed(0)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="w-full h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isBreakHabit
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${analytics.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{habit.duration} days goal</span>
        <button 
          onClick={onClick}
          className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <span>View details</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Collapse Button */}
      {isExpanded && (
        <button
          onClick={toggleExpand}
          className="mt-4 w-full py-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center border border-gray-200/50 dark:border-gray-600/50"
          title="Hide Details"
        >
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
        </div>
      )}
    </div>
  )
}
