import { useMemo, useState, memo } from 'react'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'
import { useHabitChecks, useToggleCheckIn, CheckInStatus } from '../hooks/useHabits'
import { TimelineDay } from './TimelineDay'

interface SevenDayTimelineProps {
  habitId: string
  habitStartDate: Timestamp
  habitColor?: string
  isBreakHabit: boolean
}

export const SevenDayTimeline = memo(function SevenDayTimeline({
  habitId,
  habitColor,
  isBreakHabit,
}: SevenDayTimelineProps) {
  const [loadingDate, setLoadingDate] = useState<string | null>(null)
  
  // Calculate previous 7 days (not including today)
  const dateRange = useMemo(() => {
    const today = dayjs()
    const dates = []
    
    // Start from yesterday (i=1) and go back 7 days
    // Always show all 7 days regardless of habit start date
    for (let i = 1; i <= 7; i++) {
      const date = today.subtract(i, 'day')
      dates.push({
        dateKey: date.format('YYYY-MM-DD'),
        dayName: date.format('ddd'),
        dayNumber: date.date(),
        isToday: false, // None of these are today
      })
    }
    
    return dates
  }, [])

  // Fetch check-ins for the date range
  const startDateStr = dateRange[dateRange.length - 1]?.dateKey
  const endDateStr = dateRange[0]?.dateKey
  
  const { data: checks, isLoading: isLoadingChecks } = useHabitChecks({
    habitId,
    startDate: startDateStr,
    endDate: endDateStr,
  })

  const toggleMutation = useToggleCheckIn()

  // Map checks to dates and determine status
  const timelineDates = useMemo(() => {
    if (!checks) return dateRange.map(d => ({ ...d, status: 'skip' as CheckInStatus }))
    
    const checkMap = new Map(checks.map(c => [c.dateKey, c]))
    
    return dateRange.map(date => {
      const check = checkMap.get(date.dateKey)
      let status: CheckInStatus = 'skip'
      
      if (check) {
        // If status field exists, use it; otherwise default to 'done' for backward compatibility
        status = check.status || 'done'
      }
      
      return {
        ...date,
        status,
      }
    })
  }, [checks, dateRange])

  const handleStatusChange = async (date: string) => {
    const dateData = timelineDates.find(d => d.dateKey === date)
    if (!dateData) return

    setLoadingDate(date)
    try {
      await toggleMutation.mutateAsync({
        habitId,
        date,
        currentStatus: dateData.status,
      })
    } catch (error) {
      console.error('Failed to toggle status:', error)
    } finally {
      setLoadingDate(null)
    }
  }

  // Always show the timeline section, even if no dates yet
  return (
    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Last 7 Days
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tap any day to cycle: Skip → Done → Not Done
        </p>
      </div>
      
      <div className={`backdrop-blur-sm rounded-2xl border p-5 ${
        isBreakHabit
          ? 'bg-red-50/30 dark:bg-red-900/10 border-red-200/30 dark:border-red-800/30'
          : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200/30 dark:border-blue-800/30'
      }`}>
        {isLoadingChecks ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {timelineDates.map((date) => (
              <TimelineDay
                key={date.dateKey}
                date={date.dateKey}
                dayName={date.dayName}
                dayNumber={date.dayNumber}
                status={date.status}
                habitColor={habitColor}
                isBreakHabit={isBreakHabit}
                isToday={date.isToday}
                onStatusChange={handleStatusChange}
                isLoading={loadingDate === date.dateKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
