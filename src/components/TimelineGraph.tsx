import dayjs from 'dayjs'
import { CheckIn } from '../hooks/useHabits'

interface TimelineGraphProps {
  checks: CheckIn[]
  startDate: Date
}

export function TimelineGraph({ checks, startDate }: TimelineGraphProps) {
  // Generate date range for last 30 days
  const generateDateRange = (): string[] => {
    const dates: string[] = []
    const today = dayjs()
    
    for (let i = 29; i >= 0; i--) {
      dates.push(today.subtract(i, 'day').format('YYYY-MM-DD'))
    }
    
    return dates
  }

  // Check if a date has a check-in
  const isDateCompleted = (date: string): boolean => {
    return checks.some(check => check.dateKey === date)
  }

  const dateRange = generateDateRange()
  const habitStartDate = dayjs(startDate)

  return (
    <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        30-Day Timeline
      </h3>
      
      <div className="grid grid-cols-10 gap-2">
        {dateRange.map((date) => {
          const isCompleted = isDateCompleted(date)
          const dateObj = dayjs(date)
          const isBeforeStart = dateObj.isBefore(habitStartDate, 'day')
          const isToday = dateObj.isSame(dayjs(), 'day')
          
          return (
            <div
              key={date}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200 hover:scale-110
                ${isBeforeStart 
                  ? 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500' 
                  : isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white shadow-lg' 
                    : 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }
                ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800' : ''}
              `}
              title={`${dateObj.format('MMM D')}: ${
                isBeforeStart 
                  ? 'Before start' 
                  : isCompleted 
                    ? 'Completed' 
                    : 'Missed'
              }`}
            >
              {dateObj.format('D')}
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 rounded shadow-sm"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100/50 dark:bg-red-900/30 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Before start</span>
        </div>
      </div>
    </div>
  )
}
