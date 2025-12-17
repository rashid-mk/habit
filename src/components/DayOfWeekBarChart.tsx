import { useState, useCallback, useEffect } from 'react'
import { DayOfWeekStats, DayOfWeek, DayStats } from '../types/analytics'
import { AccessibleDataTable } from './AccessibleDataTable'
import { generateChartDescription, createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'

interface DayOfWeekBarChartProps {
  stats: DayOfWeekStats
  onDayClick?: (day: DayOfWeek, stats: DayStats) => void
  showDataTable?: boolean
}

export function DayOfWeekBarChart({ stats, onDayClick, showDataTable = false }: DayOfWeekBarChartProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null)
  const [showTable, setShowTable] = useState(showDataTable)
  const [focusedDay, setFocusedDay] = useState<number>(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [touchedDay, setTouchedDay] = useState<DayOfWeek | null>(null)
  
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Find max rate for scaling
  const maxRate = Math.max(...days.map(day => stats[day].completionRate))

  // Handle day click
  const handleDayClick = useCallback((day: DayOfWeek) => {
    setSelectedDay(prev => prev === day ? null : day)
    if (onDayClick) {
      onDayClick(day, stats[day])
    }
  }, [onDayClick, stats])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, day: DayOfWeek) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleDayClick(day)
    }
  }, [handleDayClick])

  // Keyboard navigation for chart
  const handleChartKeyboard = createKeyboardHandler(
    () => {
      const day = days[focusedDay]
      if (day) {
        handleDayClick(day)
        announceToScreenReader(`Selected ${day}: ${stats[day].completionRate.toFixed(1)}% completion rate`)
      }
    },
    undefined,
    {
      onArrowUp: () => {
        setFocusedDay(prev => Math.max(0, prev - 1))
      },
      onArrowDown: () => {
        setFocusedDay(prev => Math.min(days.length - 1, prev + 1))
      }
    }
  )

  // Generate chart description
  const chartDescription = generateChartDescription(
    'dayOfWeek',
    stats,
    `Best day: ${stats.bestDay} (${stats[stats.bestDay].completionRate.toFixed(1)}%), Worst day: ${stats.worstDay} (${stats[stats.worstDay].completionRate.toFixed(1)}%)`
  )

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'day', label: 'Day', sortable: true },
    { key: 'completionRate', label: 'Completion Rate (%)', sortable: true, format: (value: number) => `${value.toFixed(1)}%` },
    { key: 'completed', label: 'Completed', sortable: true },
    { key: 'scheduled', label: 'Scheduled', sortable: true },
    { key: 'performance', label: 'Performance', sortable: false }
  ]

  const tableData = days.map(day => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    completionRate: stats[day].completionRate,
    completed: stats[day].totalCompletions,
    scheduled: stats[day].totalScheduled,
    performance: day === stats.bestDay ? 'Best' : day === stats.worstDay ? 'Worst' : 'Average'
  }))

  return (
    <div className="space-y-3" data-chart="day-of-week-bar">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
          Day of Week Performance
        </h3>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          aria-label={showTable ? 'Show chart view' : 'Show data table view'}
          aria-pressed={showTable}
        >
          {showTable ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chart
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9" />
              </svg>
              Table
            </>
          )}
        </button>
      </div>

      {/* Screen reader description */}
      <div className="sr-only" aria-live="polite">
        {chartDescription}
      </div>

      {showTable ? (
        <AccessibleDataTable
          data={tableData}
          columns={tableColumns}
          caption="Day of week performance showing completion rates for each day"
          ariaLabel="Day of week performance data table"
          className="mt-4"
        />
      ) : (
        <div
          role="img"
          aria-label={chartDescription}
          tabIndex={0}
          onKeyDown={handleChartKeyboard}
          className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-2"
        >
          {onDayClick && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {isMobile 
                ? 'Tap a day to view details' 
                : 'Tap a day to view details • Use arrow keys to navigate • Press Enter to select'
              }
            </p>
          )}
          
          {days.map((day, index) => {
        const dayStats = stats[day]
        const rate = dayStats.completionRate
        const isBest = day === stats.bestDay
        const isWorst = day === stats.worstDay
        const isSelected = selectedDay === day
        const isHovered = hoveredDay === day
        const isFocused = focusedDay === index

        // Calculate bar width percentage
        const barWidth = maxRate > 0 ? (rate / maxRate) * 100 : 0

        return (
            <div 
              key={day} 
              className={`space-y-1 rounded-lg transition-all cursor-pointer touch-manipulation ${
                isMobile ? 'p-3' : 'p-2'
              } ${
                isSelected 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' 
                  : isHovered || isFocused || touchedDay === day
                    ? 'bg-gray-50 dark:bg-gray-700/50' 
                    : ''
              } ${isFocused ? 'ring-2 ring-indigo-300' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${day}: ${rate.toFixed(1)}% completion rate, ${dayStats.totalCompletions} of ${dayStats.totalScheduled} completed${isBest ? ', best performing day' : isWorst ? ', worst performing day' : ''}`}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => handleKeyDown(e, day)}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onTouchStart={() => {
                setTouchedDay(day)
                setHoveredDay(day)
              }}
              onTouchEnd={() => {
                setTouchedDay(null)
                setHoveredDay(null)
              }}
              onFocus={() => setFocusedDay(index)}
            >
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium capitalize ${
                  isBest ? 'text-green-800 dark:text-green-200' :
                  isWorst ? 'text-red-800 dark:text-red-200' :
                  'text-gray-800 dark:text-gray-200'
                }`}>
                  {day}
                  {isBest && (
                    <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded border border-green-300 dark:border-green-700">
                      Best
                    </span>
                  )}
                  {isWorst && (
                    <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-0.5 rounded border border-red-300 dark:border-red-700">
                      Worst
                    </span>
                  )}
                </span>
                <span className={`font-semibold ${
                  isBest ? 'text-green-800 dark:text-green-200' :
                  isWorst ? 'text-red-800 dark:text-red-200' :
                  'text-gray-900 dark:text-white'
                }`}>
                  {rate.toFixed(1)}%
                </span>
              </div>
              <div className={`relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden ${isMobile ? 'h-10' : 'h-8'}`}>
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-300 ${
                    isBest ? 'bg-green-700 dark:bg-green-500' :
                    isWorst ? 'bg-red-700 dark:bg-red-500' :
                    'bg-blue-700 dark:bg-blue-500'
                  } ${isHovered || isSelected || isFocused || touchedDay === day ? 'opacity-90' : ''}`}
                  style={{ 
                    width: `${barWidth}%`,
                    transform: isHovered || isSelected || isFocused || touchedDay === day ? 'scaleY(1.05)' : 'scaleY(1)',
                  }}
                  role="progressbar"
                  aria-valuenow={rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${rate.toFixed(1)}% completion rate`}
                >
                  {rate > 15 && (
                    <div className="flex items-center justify-end h-full pr-3">
                      <span className="text-xs font-medium text-white">
                        {dayStats.totalCompletions}/{dayStats.totalScheduled}
                      </span>
                    </div>
                  )}
                </div>
                {rate <= 15 && dayStats.totalScheduled > 0 && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {dayStats.totalCompletions}/{dayStats.totalScheduled}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Expanded details when selected */}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-xs">Completed</p>
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        {dayStats.totalCompletions}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-xs">Scheduled</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {dayStats.totalScheduled}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}
      
      {/* Focused day announcement for screen readers */}
      {focusedDay !== null && !showTable && (
        <div className="sr-only" aria-live="polite">
          Focused on {days[focusedDay]}: {stats[days[focusedDay]].completionRate.toFixed(1)}% completion rate
        </div>
      )}
    </div>
  )
}
