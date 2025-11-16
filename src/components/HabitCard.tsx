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
  const [actionTaken, setActionTaken] = useState<'done' | 'skip' | 'failed' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([])
  // Default to 'build' if habitType is not set (for backward compatibility)
  const isBreakHabit = habit.habitType === 'break'
  const today = dayjs().format('YYYY-MM-DD')

  const handleAction = async (e: React.MouseEvent, action: 'done' | 'skip' | 'failed') => {
    e.stopPropagation() // Prevent card click
    
    if (action === 'done') {
      // Trigger confetti animation
      setShowConfetti(true)
      
      // Generate particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: -Math.random() * 150 - 50,
        color: isBreakHabit 
          ? ['#ef4444', '#f97316', '#fb923c'][Math.floor(Math.random() * 3)]
          : ['#3b82f6', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 3)],
        delay: Math.random() * 0.1,
      }))
      setParticles(newParticles)
      
      // Clear confetti after animation
      setTimeout(() => {
        setShowConfetti(false)
        setParticles([])
      }, 1000)
      
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
    <>
      <style>{`
        @keyframes confetti-pop {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(1) rotate(360deg);
          }
        }
      `}</style>
      <div
        onClick={onClick}
        className={`group backdrop-blur-xl rounded-2xl border-2 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden ${
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
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`text-lg font-bold transition-colors ${
              isBreakHabit
                ? 'text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}>
              {habit.habitName}
            </h3>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shadow-sm ${
              isBreakHabit
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
            }`}>
              {isBreakHabit ? 'Break' : 'Build'}
            </span>
          </div>
          <div className={`flex items-center space-x-2 text-sm ${
            isBreakHabit
              ? 'text-red-700 dark:text-red-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{getFrequencyDisplay()}</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg ${
          isBreakHabit
            ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/30'
            : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-blue-500/30'
        }`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isBreakHabit ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

      {/* Quick Actions */}
      {!actionTaken && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <div className="grid grid-cols-2 gap-2 relative">
            <button
              onClick={(e) => handleAction(e, 'done')}
              disabled={checkInMutation.isPending}
              className={`relative col-span-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg overflow-visible ${
                isBreakHabit
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-red-500/30 hover:shadow-red-500/50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:scale-105 active:scale-95`}
            >
              {/* Confetti Particles */}
              {showConfetti && particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    animation: `confetti-pop 0.8s ease-out forwards`,
                    animationDelay: `${particle.delay}s`,
                    // @ts-ignore
                    '--tx': `${particle.x}px`,
                    '--ty': `${particle.y}px`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: particle.color,
                      boxShadow: `0 0 15px ${particle.color}`,
                    }}
                  />
                </div>
              ))}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isBreakHabit ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                )}
              </svg>
              <span>{isBreakHabit ? 'Resisted Today' : 'Done'}</span>
            </button>
            
            <button
              onClick={(e) => handleAction(e, 'failed')}
              disabled={checkInMutation.isPending}
              className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 hover:scale-105 active:scale-95 ${
                isBreakHabit
                  ? 'bg-orange-100/80 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                  : 'bg-red-100/80 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{isBreakHabit ? 'Failed' : 'Not Done'}</span>
            </button>
            
            <button
              onClick={(e) => handleAction(e, 'skip')}
              disabled={checkInMutation.isPending}
              className="py-2.5 px-3 rounded-xl font-semibold text-sm bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 hover:scale-105 active:scale-95"
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
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <div className={`py-3 px-4 rounded-xl text-center text-sm font-semibold shadow-lg ${
            actionTaken === 'done'
              ? isBreakHabit
                ? 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-200 border-2 border-red-300 dark:border-red-700'
                : 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-200 border-2 border-green-300 dark:border-green-700'
              : actionTaken === 'failed'
              ? isBreakHabit
                ? 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 text-orange-700 dark:text-orange-200 border-2 border-orange-300 dark:border-orange-700'
                : 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-200 border-2 border-red-300 dark:border-red-700'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600'
          }`}>
            {actionTaken === 'done' 
              ? isBreakHabit 
                ? '🛡️ Successfully resisted today!' 
                : '✓ Completed today!'
              : actionTaken === 'failed'
              ? isBreakHabit
                ? '❌ Failed today - Keep trying!'
                : '❌ Not done today'
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
    </>
  )
}
