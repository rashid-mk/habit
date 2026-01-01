import { useState, useCallback, useRef, memo } from 'react'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Brush, ReferenceArea } from 'recharts'
import { chartColors, chartConfig } from '../config/chartTheme'
import { AccessibleDataTable } from './AccessibleDataTable'
import { createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'
import dayjs from 'dayjs'

interface ProgressDataPoint {
  date: string
  value: number
}

interface ProgressChartProps {
  data: ProgressDataPoint[]
  habitType: 'count' | 'time'
  targetValue?: number
  height?: number
  onDataPointClick?: (dataPoint: ProgressDataPoint) => void
  enableZoom?: boolean
  showDataTable?: boolean
}

export const ProgressChart = memo(function ProgressChart({ 
  data, 
  habitType, 
  targetValue, 
  height = 300,
  onDataPointClick,
  enableZoom = true,
  showDataTable = false
}: ProgressChartProps) {
  const [zoomState, setZoomState] = useState<{
    left: string | null
    right: string | null
    refAreaLeft: string | null
    refAreaRight: string | null
    isZooming: boolean
  }>({
    left: null,
    right: null,
    refAreaLeft: null,
    refAreaRight: null,
    isZooming: false,
  })
  
  const chartRef = useRef<HTMLDivElement>(null)
  const [isTouching, setIsTouching] = useState(false)
  const [showTable, setShowTable] = useState(showDataTable)
  const [focusedDataPoint, setFocusedDataPoint] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No progress data available
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(point => ({
    date: dayjs(point.date).format('MMM D'),
    fullDate: point.date,
    value: point.value,
    target: targetValue,
  }))

  // Filter data based on zoom state
  const getFilteredData = () => {
    if (!zoomState.left || !zoomState.right) return chartData
    
    const leftIndex = chartData.findIndex(d => d.date === zoomState.left)
    const rightIndex = chartData.findIndex(d => d.date === zoomState.right)
    
    if (leftIndex === -1 || rightIndex === -1) return chartData
    
    return chartData.slice(
      Math.min(leftIndex, rightIndex),
      Math.max(leftIndex, rightIndex) + 1
    )
  }

  const filteredData = getFilteredData()

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none">
          <p className="font-semibold">{dayjs(data.fullDate).format('MMM D, YYYY')}</p>
          <p>
            Value: {data.value}
            {habitType === 'time' && ' min'}
          </p>
          {targetValue && (
            <p className="text-gray-300">Target: {targetValue}{habitType === 'time' && ' min'}</p>
          )}
          {onDataPointClick && (
            <p className="text-xs text-gray-400 mt-1">Click for details</p>
          )}
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value: number) => {
    if (habitType === 'time') {
      return `${value}m`
    }
    return value.toString()
  }

  // Handle click on data point
  const handleClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0 && onDataPointClick) {
      const clickedData = data.activePayload[0].payload
      onDataPointClick({
        date: clickedData.fullDate,
        value: clickedData.value,
      })
    }
  }, [onDataPointClick])

  // Zoom handlers
  const handleMouseDown = useCallback((e: any) => {
    if (!enableZoom || !e || isTouching) return
    setZoomState(prev => ({
      ...prev,
      refAreaLeft: e.activeLabel,
      isZooming: true,
    }))
  }, [enableZoom, isTouching])

  const handleMouseMove = useCallback((e: any) => {
    if (!zoomState.isZooming || !e) return
    setZoomState(prev => ({
      ...prev,
      refAreaRight: e.activeLabel,
    }))
  }, [zoomState.isZooming])

  const handleMouseUp = useCallback(() => {
    if (!zoomState.isZooming) return
    
    const { refAreaLeft, refAreaRight } = zoomState
    
    if (refAreaLeft && refAreaRight && refAreaLeft !== refAreaRight) {
      setZoomState(prev => ({
        ...prev,
        left: refAreaLeft < refAreaRight ? refAreaLeft : refAreaRight,
        right: refAreaLeft < refAreaRight ? refAreaRight : refAreaLeft,
        refAreaLeft: null,
        refAreaRight: null,
        isZooming: false,
      }))
    } else {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: null,
        refAreaRight: null,
        isZooming: false,
      }))
    }
  }, [zoomState])

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    setZoomState({
      left: null,
      right: null,
      refAreaLeft: null,
      refAreaRight: null,
      isZooming: false,
    })
  }, [])

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: any) => {
    if (!enableZoom || !e) return
    setIsTouching(true)
    setZoomState(prev => ({
      ...prev,
      refAreaLeft: e.activeLabel,
      isZooming: true,
    }))
  }, [enableZoom])

  const handleTouchMove = useCallback((e: any) => {
    if (!zoomState.isZooming || !e) return
    setZoomState(prev => ({
      ...prev,
      refAreaRight: e.activeLabel,
    }))
  }, [zoomState.isZooming])

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false)
    handleMouseUp()
  }, [handleMouseUp])

  const isZoomed = zoomState.left !== null && zoomState.right !== null

  // Keyboard navigation for data points
  const handleKeyboardNavigation = createKeyboardHandler(
    () => {
      if (focusedDataPoint !== null && onDataPointClick) {
        const dataPoint = chartData[focusedDataPoint]
        if (dataPoint) {
          onDataPointClick({
            date: dataPoint.fullDate,
            value: dataPoint.value,
          })
          announceToScreenReader(`Selected data point: ${dataPoint.value}${habitType === 'time' ? ' minutes' : ''} on ${dayjs(dataPoint.fullDate).format('MMM D, YYYY')}`)
        }
      }
    },
    undefined,
    {
      onArrowLeft: () => {
        setFocusedDataPoint(prev => prev !== null ? Math.max(0, prev - 1) : 0)
      },
      onArrowRight: () => {
        setFocusedDataPoint(prev => prev !== null ? Math.min(chartData.length - 1, prev + 1) : 0)
      }
    }
  )

  // Generate chart description
  const chartDescription = `Progress chart showing ${habitType === 'time' ? 'duration' : 'count'} values over time. ${chartData.length} data points from ${dayjs(chartData[0]?.fullDate).format('MMM D, YYYY')} to ${dayjs(chartData[chartData.length - 1]?.fullDate).format('MMM D, YYYY')}${targetValue ? `. Target: ${targetValue}${habitType === 'time' ? ' minutes' : ''}` : ''}`

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'value', label: habitType === 'time' ? 'Duration (min)' : 'Count', sortable: true },
    ...(targetValue ? [{ key: 'target', label: 'Target', sortable: false }] : []),
    { key: 'progress', label: 'Progress', sortable: true, format: (value: number) => `${value.toFixed(1)}%` }
  ]

  const tableData = chartData.map(point => ({
    date: dayjs(point.fullDate).format('MMM D, YYYY'),
    value: point.value,
    target: targetValue || 'N/A',
    progress: targetValue ? (point.value / targetValue) * 100 : 100
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" ref={chartRef} data-chart="progress">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Progress Over Time
        </h3>
        <div className="flex items-center gap-2">
          {/* Data table toggle */}
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

          {enableZoom && isZoomed && !showTable && (
            <button
              onClick={handleResetZoom}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
              aria-label="Reset zoom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Screen reader description */}
      <div className="sr-only" aria-live="polite">
        {chartDescription}
      </div>

      {showTable ? (
        <AccessibleDataTable
          data={tableData}
          columns={tableColumns}
          caption={`Progress data showing ${habitType === 'time' ? 'duration' : 'count'} values over time`}
          ariaLabel="Progress data table"
          className="mt-4"
        />
      ) : (
        <>
          {enableZoom && !isZoomed && chartData.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Drag to zoom • Use arrow keys to navigate data points • Press Enter to select
            </p>
          )}
      
          <div
            role="img"
            aria-label={chartDescription}
            tabIndex={0}
            onKeyDown={handleKeyboardNavigation}
            className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart
                data={filteredData}
                margin={chartConfig.margin}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: onDataPointClick ? 'pointer' : enableZoom ? 'crosshair' : 'default' }}
              >
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            allowDataOverflow
          />
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target line if provided */}
          {targetValue && (
            <Line
              type="monotone"
              dataKey="target"
              stroke={chartColors.warning}
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Target"
            />
          )}
          
          {/* Progress area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColors.primary}
            strokeWidth={2}
            fill="url(#progressGradient)"
            animationDuration={chartConfig.animationDuration}
          />
          
          {/* Zoom selection area */}
          {zoomState.refAreaLeft && zoomState.refAreaRight && (
            <ReferenceArea
              x1={zoomState.refAreaLeft}
              x2={zoomState.refAreaRight}
              strokeOpacity={0.3}
              fill={chartColors.primary}
              fillOpacity={0.2}
            />
          )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      
      {/* Focused data point announcement for screen readers */}
      {focusedDataPoint !== null && !showTable && (
        <div className="sr-only" aria-live="polite">
          Focused on data point {focusedDataPoint + 1} of {chartData.length}: 
          {chartData[focusedDataPoint]?.value}{habitType === 'time' ? ' minutes' : ''} on {dayjs(chartData[focusedDataPoint]?.fullDate).format('MMM D, YYYY')}
        </div>
      )}
      
      {/* Brush for pan functionality when zoomed */}
      {enableZoom && chartData.length > 10 && (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors.gray}
                fill={chartColors.grayLight}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke={chartColors.primary}
                fill="transparent"
                onChange={(range) => {
                  if (range.startIndex !== undefined && range.endIndex !== undefined) {
                    setZoomState(prev => ({
                      ...prev,
                      left: chartData[range.startIndex]?.date || null,
                      right: chartData[range.endIndex]?.date || null,
                    }))
                  }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
})
