import { useState, useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import { getColorForValue } from '../config/chartTheme'
import { AccessibleDataTable } from './AccessibleDataTable'
import { generateChartDescription, createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'

interface CalendarHeatmapProps {
  completions: { date: string; value: number }[]
  startDate: Date
  endDate: Date
  onDateClick?: (date: string, value: number) => void
  showDataTable?: boolean
}

export function CalendarHeatmap({ completions, startDate, endDate, onDateClick, showDataTable = false }: CalendarHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tooltipData, setTooltipData] = useState<{ date: string; value: number; x: number; y: number } | null>(null)
  const [showTable, setShowTable] = useState(showDataTable)
  const [focusedDateIndex, setFocusedDateIndex] = useState<number>(0)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Create a map for quick lookup
  const completionMap = new Map(
    completions.map(c => [dayjs(c.date).format('YYYY-MM-DD'), c.value])
  )

  // Generate all dates in range
  const dates: { date: string; value: number; dayOfWeek: number }[] = []
  let currentDate = dayjs(startDate)
  const end = dayjs(endDate)

  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const dateStr = currentDate.format('YYYY-MM-DD')
    dates.push({
      date: dateStr,
      value: completionMap.get(dateStr) || 0,
      dayOfWeek: currentDate.day(),
    })
    currentDate = currentDate.add(1, 'day')
  }

  // Find max value for color scaling
  const maxValue = Math.max(...completions.map(c => c.value), 1)

  // Group by weeks
  const weeks: typeof dates[] = []
  let currentWeek: typeof dates = []
  
  // Pad the first week if it doesn't start on Sunday
  const firstDayOfWeek = dates[0]?.dayOfWeek || 0
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', value: 0, dayOfWeek: i })
  }

  dates.forEach(day => {
    currentWeek.push(day)
    if (day.dayOfWeek === 6 || day === dates[dates.length - 1]) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  const cellSize = 12
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Handle cell click
  const handleCellClick = useCallback((date: string, value: number) => {
    setSelectedDate(prev => prev === date ? null : date)
    if (onDateClick) {
      onDateClick(date, value)
    }
  }, [onDateClick])

  // Handle touch/hover for tooltip
  const handleCellInteraction = useCallback((e: React.MouseEvent | React.TouchEvent, date: string, value: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltipData({
      date,
      value,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }, [])

  const handleCellLeave = useCallback(() => {
    setTooltipData(null)
  }, [])

  // Keyboard navigation for calendar
  const handleCalendarKeyboard = createKeyboardHandler(
    () => {
      const date = dates[focusedDateIndex]
      if (date && date.date) {
        handleCellClick(date.date, date.value)
        announceToScreenReader(`Selected ${dayjs(date.date).format('MMM D, YYYY')}: ${date.value} completion${date.value !== 1 ? 's' : ''}`)
      }
    },
    undefined,
    {
      onArrowLeft: () => {
        setFocusedDateIndex(prev => Math.max(0, prev - 1))
      },
      onArrowRight: () => {
        setFocusedDateIndex(prev => Math.min(dates.length - 1, prev + 1))
      },
      onArrowUp: () => {
        setFocusedDateIndex(prev => Math.max(0, prev - 7))
      },
      onArrowDown: () => {
        setFocusedDateIndex(prev => Math.min(dates.length - 1, prev + 7))
      }
    }
  )

  // Generate chart description
  const chartDescription = generateChartDescription(
    'completion',
    { completed: completions.filter(c => c.value > 0).length, missed: completions.filter(c => c.value === 0).length },
    `Calendar view from ${dayjs(startDate).format('MMM D, YYYY')} to ${dayjs(endDate).format('MMM D, YYYY')}`
  )

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'completions', label: 'Completions', sortable: true },
    { key: 'dayOfWeek', label: 'Day of Week', sortable: true }
  ]

  const tableData = dates
    .filter(d => d.date)
    .map(date => ({
      date: dayjs(date.date).format('MMM D, YYYY'),
      completions: date.value,
      dayOfWeek: dayjs(date.date).format('dddd')
    }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative" data-chart="calendar-heatmap">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity Calendar
        </h3>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          aria-label={showTable ? 'Show calendar view' : 'Show data table view'}
          aria-pressed={showTable}
        >
          {showTable ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
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
          caption="Calendar activity data showing daily completion counts"
          ariaLabel="Calendar activity data table"
          className="mt-4"
        />
      ) : (
        <>
          {onDateClick && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Tap a day to view details • Use arrow keys to navigate • Press Enter to select
            </p>
          )}
      
          <div 
            className="overflow-x-auto touch-pan-x"
            role="img"
            aria-label={chartDescription}
            tabIndex={0}
            onKeyDown={handleCalendarKeyboard}
            ref={calendarRef}
          >
            <div className="inline-block min-w-full">
              {/* Day labels */}
              <div className="flex mb-1" role="row">
                <div style={{ width: '14px' }} />
                {dayLabels.map((label, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-600 dark:text-gray-400 text-center"
                    style={{ width: '14px' }}
                    role="columnheader"
                    aria-label={`${label === 'S' ? (i === 0 ? 'Sunday' : 'Saturday') : 
                      label === 'M' ? 'Monday' : 
                      label === 'T' ? (i === 2 ? 'Tuesday' : 'Thursday') : 
                      label === 'W' ? 'Wednesday' : 
                      'Friday'}`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex gap-1" role="grid" aria-label="Calendar heatmap">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1" role="row">
                    {week.map((day, dayIndex) => {
                      if (!day.date) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            style={{
                              width: `${cellSize}px`,
                              height: `${cellSize}px`,
                            }}
                            role="gridcell"
                            aria-hidden="true"
                          />
                        )
                      }

                      const color = getColorForValue(day.value, maxValue)
                      const dateObj = dayjs(day.date)
                      const isSelected = selectedDate === day.date
                      const dateIndex = dates.findIndex(d => d.date === day.date)
                      const isFocused = focusedDateIndex === dateIndex

                      return (
                        <div
                          key={day.date}
                          role="gridcell button"
                          tabIndex={isFocused ? 0 : -1}
                          aria-label={`${dateObj.format('MMM D, YYYY')}: ${day.value} completion${day.value !== 1 ? 's' : ''}`}
                          aria-pressed={isSelected}
                          className={`rounded-sm cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isSelected 
                              ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-125 z-10' 
                              : 'hover:ring-2 hover:ring-indigo-500 hover:scale-110'
                          } ${isFocused ? 'ring-2 ring-indigo-300' : ''}`}
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: color,
                          }}
                          onClick={() => handleCellClick(day.date, day.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleCellClick(day.date, day.value)
                            }
                          }}
                          onMouseEnter={(e) => handleCellInteraction(e, day.date, day.value)}
                          onMouseLeave={handleCellLeave}
                          onTouchStart={(e) => handleCellInteraction(e, day.date, day.value)}
                          onTouchEnd={handleCellLeave}
                          onFocus={() => setFocusedDateIndex(dateIndex)}
                          title={`${dateObj.format('MMM D, YYYY')}: ${day.value} completion${day.value !== 1 ? 's' : ''}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
                <span>Less</span>
                <div className="flex gap-1" role="img" aria-label="Color intensity scale from low to high completions">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="rounded-sm"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: getColorForValue(i * 0.2 * maxValue, maxValue),
                      }}
                      aria-label={`Intensity level ${i + 1} of 6`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Selected date details */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
            {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
          </p>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {completionMap.get(selectedDate) || 0} completion{(completionMap.get(selectedDate) || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Floating tooltip for touch devices */}
      {tooltipData && (
        <div 
          className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipData.x, top: tooltipData.y }}
          role="tooltip"
          aria-live="polite"
        >
          <p className="font-semibold">{dayjs(tooltipData.date).format('MMM D, YYYY')}</p>
          <p>{tooltipData.value} completion{tooltipData.value !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Focused date announcement for screen readers */}
      {focusedDateIndex !== null && !showTable && dates[focusedDateIndex]?.date && (
        <div className="sr-only" aria-live="polite">
          Focused on {dayjs(dates[focusedDateIndex].date).format('MMM D, YYYY')}: {dates[focusedDateIndex].value} completion{dates[focusedDateIndex].value !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
