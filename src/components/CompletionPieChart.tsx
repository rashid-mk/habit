import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { chartColors } from '../config/chartTheme'
import { AccessibleDataTable } from './AccessibleDataTable'
import { generateChartDescription, createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'

interface CompletionPieChartProps {
  completed: number
  missed: number
  height?: number
  onSegmentClick?: (segment: 'completed' | 'missed') => void
  showDataTable?: boolean
}

export function CompletionPieChart({ completed, missed, height = 300, onSegmentClick, showDataTable = false }: CompletionPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(showDataTable)
  const [focusedSegment, setFocusedSegment] = useState<number>(0)
  const total = completed + missed

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  const data = [
    { name: 'Completed', value: completed, percentage: ((completed / total) * 100).toFixed(1), type: 'completed' as const },
    { name: 'Missed', value: missed, percentage: ((missed / total) * 100).toFixed(1), type: 'missed' as const },
  ]

  // WCAG AA compliant colors
  const COLORS = [chartColors.success, chartColors.danger] // Using WCAG AA compliant colors from theme
  const HOVER_COLORS = [chartColors.success, chartColors.danger] // Same colors for consistency

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none">
          <p className="font-semibold">{data.name}</p>
          <p>{data.value} days ({data.percentage}%)</p>
          {onSegmentClick && (
            <p className="text-xs text-gray-400 mt-1">Click to view details</p>
          )}
        </div>
      )
    }
    return null
  }

  // Handle segment click
  const handleClick = useCallback((_data: any, index: number) => {
    if (onSegmentClick) {
      onSegmentClick(data[index].type)
    }
    setActiveIndex(prev => prev === index ? null : index)
  }, [onSegmentClick, data])

  // Handle mouse/touch enter
  const handleEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index)
  }, [])

  // Handle mouse/touch leave
  const handleLeave = useCallback(() => {
    if (!onSegmentClick) {
      setActiveIndex(null)
    }
  }, [onSegmentClick])

  // Keyboard navigation for pie chart
  const handleChartKeyboard = createKeyboardHandler(
    () => {
      if (onSegmentClick) {
        onSegmentClick(data[focusedSegment].type)
        announceToScreenReader(`Selected ${data[focusedSegment].name}: ${data[focusedSegment].value} (${data[focusedSegment].percentage}%)`)
      }
      setActiveIndex(focusedSegment)
    },
    undefined,
    {
      onArrowLeft: () => {
        setFocusedSegment(prev => prev === 0 ? data.length - 1 : prev - 1)
      },
      onArrowRight: () => {
        setFocusedSegment(prev => prev === data.length - 1 ? 0 : prev + 1)
      }
    }
  )

  // Generate chart description
  const chartDescription = generateChartDescription(
    'completion',
    { completed, missed },
    `${((completed / total) * 100).toFixed(1)}% completion rate`
  )

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'category', label: 'Category', sortable: true },
    { key: 'count', label: 'Count', sortable: true },
    { key: 'percentage', label: 'Percentage', sortable: true, format: (value: number) => `${value}%` }
  ]

  const tableData = data.map(item => ({
    category: item.name,
    count: item.value,
    percentage: parseFloat(item.percentage)
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" data-chart="completion-pie">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Completion Distribution
        </h3>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          aria-label={showTable ? 'Show pie chart view' : 'Show data table view'}
          aria-pressed={showTable}
        >
          {showTable ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
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
          caption="Completion distribution showing completed vs missed occurrences"
          ariaLabel="Completion distribution data table"
          className="mt-4"
        />
      ) : (
        <div
          role="img"
          aria-label={chartDescription}
          tabIndex={0}
          onKeyDown={handleChartKeyboard}
          className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        >
          {onSegmentClick && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Tap a segment to view details • Use arrow keys to navigate • Press Enter to select
            </p>
          )}
          
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.name}: ${props.percentage}%`}
                outerRadius={activeIndex !== null || focusedSegment !== null ? 85 : 80}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                animationDuration={300}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={handleClick}
                style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
              >
                {data.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index || focusedSegment === index ? HOVER_COLORS[index] : COLORS[index % COLORS.length]}
                    stroke={activeIndex === index || focusedSegment === index ? '#fff' : 'none'}
                    strokeWidth={activeIndex === index || focusedSegment === index ? 2 : 0}
                    style={{ 
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      filter: activeIndex === index || focusedSegment === index ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' : 'none',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-gray-800 dark:text-gray-200">
                    {value} ({entry.payload.percentage}%)
                  </span>
                )}
                onClick={(e: any) => {
                  const index = data.findIndex(d => d.name === e.value)
                  if (index !== -1) {
                    handleClick(data[index], index)
                  }
                }}
                wrapperStyle={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Selected segment details */}
      {activeIndex !== null && onSegmentClick && (
        <div className={`mt-4 p-3 rounded-lg border ${
          activeIndex === 0 
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
        }`}>
          <p className={`text-sm font-medium ${
            activeIndex === 0 
              ? 'text-green-900 dark:text-green-100' 
              : 'text-red-900 dark:text-red-100'
          }`}>
            {data[activeIndex].name} Days
          </p>
          <p className={`text-2xl font-bold ${
            activeIndex === 0 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {data[activeIndex].value} <span className="text-sm font-normal">({data[activeIndex].percentage}%)</span>
          </p>
        </div>
      )}
      
      {/* Focused segment announcement for screen readers */}
      {focusedSegment !== null && !showTable && (
        <div className="sr-only" aria-live="polite">
          Focused on {data[focusedSegment].name}: {data[focusedSegment].value} ({data[focusedSegment].percentage}%)
        </div>
      )}
    </div>
  )
}
