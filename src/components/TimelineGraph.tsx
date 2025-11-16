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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Timeline</h3>
      
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
                aspect-square rounded flex items-center justify-center text-xs
                ${isBeforeStart 
                  ? 'bg-gray-100 text-gray-400' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-100 text-red-600'
                }
                ${isToday ? 'ring-2 ring-blue-500' : ''}
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

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span className="text-gray-600">Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">Before start</span>
        </div>
      </div>
    </div>
  )
}
