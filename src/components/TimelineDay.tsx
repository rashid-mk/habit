import { memo } from 'react'
import { CheckInStatus } from '../hooks/useHabits'

interface TimelineDayProps {
  date: string // YYYY-MM-DD
  dayName: string
  dayNumber: number
  status: CheckInStatus
  habitColor?: string
  isBreakHabit: boolean
  isToday: boolean
  onStatusChange: (date: string) => void
  isLoading: boolean
}

export const TimelineDay = memo(function TimelineDay({
  date,
  dayName,
  dayNumber,
  status,
  habitColor,
  isBreakHabit,
  isToday,
  onStatusChange,
  isLoading,
}: TimelineDayProps) {
  const handleClick = () => {
    if (!isLoading) {
      // Trigger haptic feedback on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10) // Short 10ms vibration
      }
      onStatusChange(date)
    }
  }

  // Get status colors and icons
  const getStatusStyle = () => {
    if (status === 'done') {
      if (isBreakHabit) {
        return {
          bg: habitColor || 'bg-red-500',
          icon: 'checkmark',
          label: 'Completed',
        }
      }
      return {
        bg: habitColor || 'bg-green-500',
        icon: 'checkmark',
        label: 'Completed',
      }
    } else if (status === 'not_done') {
      if (isBreakHabit) {
        return {
          bg: 'bg-orange-500',
          icon: 'x',
          label: 'Failed',
        }
      }
      return {
        bg: 'bg-red-500',
        icon: 'x',
        label: 'Not done',
      }
    }
    // skip
    return {
      bg: 'bg-gray-300 dark:bg-gray-600',
      icon: 'dash',
      label: 'No check-in',
    }
  }

  const statusStyle = getStatusStyle()

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative"
      aria-label={`${dayName} ${dayNumber}, status: ${statusStyle.label}. Tap to change.`}
      aria-pressed={status === 'done'}
    >
      {/* Day name at top */}
      <div className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${
        isToday 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}>
        {dayName}
      </div>

      {/* Circle with status icon */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-full h-full border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            isLoading ? 'opacity-30' : 'opacity-100'
          } ${
            habitColor && status === 'done' ? '' : statusStyle.bg
          } group-hover:scale-110 group-active:scale-95 ${
            isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800' : ''
          }`}
          style={
            habitColor && status === 'done'
              ? { backgroundColor: habitColor }
              : undefined
          }
        >
          {/* Status icon inside circle */}
          {status === 'done' && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'not_done' && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status === 'skip' && (
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          )}
        </div>
      </div>

      {/* Date number at bottom */}
      <div className={`text-[10px] font-semibold mt-0.5 ${
        isToday 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {dayNumber}
      </div>
    </button>
  )
})
