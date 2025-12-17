import React, { useState, useCallback, useEffect } from 'react'
import { TimeDistribution } from '../types/analytics'
import { AccessibleDataTable } from './AccessibleDataTable'
import { generateChartDescription, createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'

interface TimeOfDayHeatmapProps {
  distribution: TimeDistribution
  onHourClick?: (hour: number, count: number) => void
  showDataTable?: boolean
}

export const TimeOfDayHeatmap: React.FC<TimeOfDayHeatmapProps> = ({ distribution, onHourClick, showDataTable = false }) => {
  const { hourlyDistribution, peakHours } = distribution
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [touchedHour, setTouchedHour] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(showDataTable)
  const [focusedHour, setFocusedHour] = useState<number>(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Find max count for scaling
  const maxCount = Math.max(...Object.values(hourlyDistribution), 1)
  
  // Format hour for display (12-hour format)
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }
  
  // Get color intensity based on count (WCAG AA compliant colors)
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    
    const intensity = count / maxCount
    // Using WCAG AA compliant green colors with sufficient contrast
    if (intensity >= 0.75) return 'bg-green-800 dark:bg-green-400'
    if (intensity >= 0.5) return 'bg-green-700 dark:bg-green-500'
    if (intensity >= 0.25) return 'bg-green-600 dark:bg-green-600'
    return 'bg-green-500 dark:bg-green-700'
  }

  // Handle hour click
  const handleHourClick = useCallback((hour: number) => {
    const count = hourlyDistribution[hour] || 0
    setSelectedHour(prev => prev === hour ? null : hour)
    if (onHourClick) {
      onHourClick(hour, count)
    }
  }, [hourlyDistribution, onHourClick])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, hour: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleHourClick(hour)
    }
  }, [handleHourClick])

  // Keyboard navigation for heatmap
  const handleHeatmapKeyboard = createKeyboardHandler(
    () => {
      const count = hourlyDistribution[focusedHour] || 0
      handleHourClick(focusedHour)
      announceToScreenReader(`Selected ${formatHour(focusedHour)}: ${count} completion${count !== 1 ? 's' : ''}`)
    },
    undefined,
    {
      onArrowLeft: () => {
        setFocusedHour(prev => prev === 0 ? 23 : prev - 1)
      },
      onArrowRight: () => {
        setFocusedHour(prev => prev === 23 ? 0 : prev + 1)
      },
      onArrowUp: () => {
        setFocusedHour(prev => Math.max(0, prev - 6))
      },
      onArrowDown: () => {
        setFocusedHour(prev => Math.min(23, prev + 6))
      }
    }
  )

  // Generate chart description
  const chartDescription = generateChartDescription(
    'timeOfDay',
    distribution,
    `Peak hours: ${peakHours.map(h => formatHour(h)).join(', ') || 'none identified'}`
  )

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'hour', label: 'Hour', sortable: true },
    { key: 'completions', label: 'Completions', sortable: true },
    { key: 'isPeak', label: 'Peak Hour', sortable: true }
  ]

  const tableData = Array.from({ length: 24 }, (_, hour) => ({
    hour: formatHour(hour),
    completions: hourlyDistribution[hour] || 0,
    isPeak: peakHours.includes(hour) ? 'Yes' : 'No'
  }))
  
  return (
    <div className="space-y-4" data-chart="time-of-day-heatmap">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
          Time of Day Distribution
        </h3>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          aria-label={showTable ? 'Show heatmap view' : 'Show data table view'}
          aria-pressed={showTable}
        >
          {showTable ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Heatmap
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
          caption="Time of day distribution showing completion counts for each hour"
          ariaLabel="Time of day distribution data table"
          className="mt-4"
        />
      ) : (
        <div
          role="img"
          aria-label={chartDescription}
          tabIndex={0}
          onKeyDown={handleHeatmapKeyboard}
          className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-2"
        >
          {onHourClick && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {isMobile 
                ? 'Tap an hour to view details' 
                : 'Tap an hour to view details • Use arrow keys to navigate • Press Enter to select'
              }
            </p>
          )}
          
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-6' : 'grid-cols-6 sm:grid-cols-8 md:grid-cols-12'}`}>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = hourlyDistribution[hour] || 0
              const isPeak = peakHours.includes(hour)
              const isSelected = selectedHour === hour
              const isTouched = touchedHour === hour
              const isFocused = focusedHour === hour
              
              return (
                <div
                  key={hour}
                  className="relative group"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`${formatHour(hour)}: ${count} completion${count !== 1 ? 's' : ''}${isPeak ? ', peak hour' : ''}`}
                    className={`
                      aspect-square rounded-lg transition-all duration-200 cursor-pointer touch-manipulation
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                      ${getColorIntensity(count)}
                      ${isPeak ? 'ring-2 ring-blue-700 dark:ring-blue-300' : ''}
                      ${isSelected ? 'ring-2 ring-indigo-700 dark:ring-indigo-300 scale-125 z-10' : ''}
                      ${isTouched || isFocused ? 'scale-110' : 'hover:scale-110'}
                      ${isFocused ? 'ring-2 ring-indigo-400' : ''}
                      ${isMobile ? 'min-h-[44px]' : ''}
                    `}
                    title={`${formatHour(hour)}: ${count} completion${count !== 1 ? 's' : ''}`}
                    onClick={() => handleHourClick(hour)}
                    onKeyDown={(e) => handleKeyDown(e, hour)}
                    onTouchStart={() => setTouchedHour(hour)}
                    onTouchEnd={() => setTouchedHour(null)}
                    onFocus={() => setFocusedHour(hour)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`font-medium ${isMobile ? 'text-xs' : 'text-xs'} ${
                        count > 0 && maxCount > 0 && count / maxCount >= 0.5 
                          ? 'text-white' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {isMobile && hour > 12 ? hour - 12 : hour}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    {formatHour(hour)}: {count}
                    {isPeak && ' ⭐'}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1" role="img" aria-label="Color intensity scale from low to high completions">
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" aria-label="No completions" />
                <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-700" aria-label="Low completions" />
                <div className="w-4 h-4 rounded bg-green-600 dark:bg-green-600" aria-label="Medium-low completions" />
                <div className="w-4 h-4 rounded bg-green-700 dark:bg-green-500" aria-label="Medium-high completions" />
                <div className="w-4 h-4 rounded bg-green-800 dark:bg-green-400" aria-label="High completions" />
              </div>
              <span>More</span>
            </div>
            
            {peakHours.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-700 ring-2 ring-blue-700 dark:ring-blue-300" aria-label="Peak hour indicator" />
                <span>Peak hours</span>
              </div>
            )}
          </div>

          {/* Selected hour details */}
          {selectedHour !== null && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                {formatHour(selectedHour)}
              </p>
              <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                {hourlyDistribution[selectedHour] || 0} 
                <span className="text-sm font-normal ml-1">
                  completion{(hourlyDistribution[selectedHour] || 0) !== 1 ? 's' : ''}
                </span>
              </p>
              {peakHours.includes(selectedHour) && (
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 flex items-center gap-1">
                  <span>⭐</span> Peak performance hour
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Focused hour announcement for screen readers */}
      {focusedHour !== null && !showTable && (
        <div className="sr-only" aria-live="polite">
          Focused on {formatHour(focusedHour)}: {hourlyDistribution[focusedHour] || 0} completion{(hourlyDistribution[focusedHour] || 0) !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
