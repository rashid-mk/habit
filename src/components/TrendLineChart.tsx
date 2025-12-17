import { useState, useCallback, useRef, useEffect } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Brush, ReferenceArea } from 'recharts'
import { DataPoint } from '../types/analytics'
import { chartColors, chartConfig } from '../config/chartTheme'
import { LoadingSpinner } from './LoadingSpinner'
import { AccessibleDataTable } from './AccessibleDataTable'
import { generateChartDescription, createKeyboardHandler, announceToScreenReader } from '../utils/accessibility'
import { Tooltip as TooltipComponent } from './Tooltip'
import dayjs from 'dayjs'

interface TrendLineChartProps {
  dataPoints: DataPoint[]
  height?: number
  onDataPointClick?: (dataPoint: DataPoint) => void
  enableZoom?: boolean
  isLoading?: boolean
  showDataTable?: boolean
}

export function TrendLineChart({ 
  dataPoints, 
  height = 300, 
  onDataPointClick,
  enableZoom = true,
  isLoading = false,
  showDataTable = false
}: TrendLineChartProps) {
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [touchStartTime, setTouchStartTime] = useState<number>(0)
  const [lastTap, setLastTap] = useState<number>(0)

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" style={{ height: height + 100 }}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading chart...
          </span>
        </div>
      </div>
    )
  }

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  // Format data for chart
  const chartData = dataPoints.map(point => ({
    date: dayjs(point.date).format('MMM D'),
    fullDate: point.date,
    value: point.value,
    displayValue: point.value === 1 ? 'Completed' : 'Missed',
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
          <p>{data.displayValue}</p>
          {onDataPointClick && (
            <p className="text-xs text-gray-400 mt-1">Click for details</p>
          )}
        </div>
      )
    }
    return null
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

  // Enhanced touch handlers for mobile support
  const handleTouchStart = useCallback((e: any) => {
    if (!e) return
    
    const now = Date.now()
    setTouchStartTime(now)
    setIsTouching(true)
    
    // Handle double tap for zoom reset on mobile
    if (now - lastTap < 300) {
      handleResetZoom()
      setLastTap(0)
      return
    }
    setLastTap(now)
    
    if (enableZoom) {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: e.activeLabel,
        isZooming: true,
      }))
    }
  }, [enableZoom, lastTap, handleResetZoom])

  const handleTouchMove = useCallback((e: any) => {
    if (!zoomState.isZooming || !e) return
    setZoomState(prev => ({
      ...prev,
      refAreaRight: e.activeLabel,
    }))
  }, [zoomState.isZooming])

  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartTime
    setIsTouching(false)
    
    // If it's a quick tap (< 200ms), treat as click for data point selection
    if (touchDuration < 200 && !zoomState.isZooming && onDataPointClick) {
      // Will be handled by chart click handler
    } else {
      handleMouseUp()
    }
  }, [handleMouseUp, touchStartTime, zoomState.isZooming, onDataPointClick])

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
          announceToScreenReader(`Selected data point: ${dataPoint.displayValue} on ${dayjs(dataPoint.fullDate).format('MMM D, YYYY')}`)
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

  // Generate chart description for screen readers
  const chartDescription = generateChartDescription(
    'trend',
    chartData,
    `Showing ${chartData.length} data points from ${dayjs(chartData[0]?.fullDate).format('MMM D, YYYY')} to ${dayjs(chartData[chartData.length - 1]?.fullDate).format('MMM D, YYYY')}`
  )

  // Prepare data for accessible table
  const tableColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'displayValue', label: 'Status', sortable: true },
    { key: 'value', label: 'Completed', sortable: true, format: (value: number) => value === 1 ? 'Yes' : 'No' }
  ]

  const tableData = chartData.map(point => ({
    date: dayjs(point.fullDate).format('MMM D, YYYY'),
    displayValue: point.displayValue,
    value: point.value
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6" ref={chartRef} data-chart="trend-line">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
          Completion Trend
        </h3>
        <div className="flex items-center gap-2">
          {/* Data table toggle */}
          <TooltipComponent content={showTable ? 'Switch to interactive chart view' : 'Switch to accessible data table view'}>
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 transition-smooth hover:scale-105"
              aria-label={showTable ? 'Show chart view' : 'Show data table view'}
              aria-pressed={showTable}
              data-chart-controls
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
          </TooltipComponent>
          
          {enableZoom && isZoomed && !showTable && (
            <TooltipComponent content="Reset chart zoom to show all data">
              <button
                onClick={handleResetZoom}
                className={`text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 touch-manipulation transition-smooth hover:scale-105 ${isMobile ? 'text-xs p-2' : 'text-sm'}`}
                aria-label="Reset zoom"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                {!isMobile && 'Reset Zoom'}
              </button>
            </TooltipComponent>
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
          caption="Completion trend data showing daily habit completion status over time"
          ariaLabel="Completion trend data table"
          className="mt-4"
        />
      ) : (
        <>
          {enableZoom && !isZoomed && chartData.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {isMobile 
                ? 'Tap to select • Double tap to reset zoom • Pinch to zoom' 
                : 'Drag to zoom • Use arrow keys to navigate data points • Press Enter to select'
              }
            </p>
          )}
          
          <div
            role="img"
            aria-label={chartDescription}
            tabIndex={0}
            onKeyDown={handleKeyboardNavigation}
            className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            <ResponsiveContainer width="100%" height={isMobile ? Math.max(height * 0.8, 200) : height}>
              <AreaChart
                data={filteredData}
                margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 5 } : chartConfig.margin}
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
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'currentColor', fontSize: isMobile ? 10 : 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  allowDataOverflow
                  interval={isMobile ? 'preserveStartEnd' : 0}
                />
                <YAxis 
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(value) => value === 1 ? 'Done' : 'Miss'}
                  tick={{ fill: 'currentColor', fontSize: isMobile ? 10 : 12 }}
                  className="text-gray-600 dark:text-gray-400"
                  width={isMobile ? 40 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  fill="url(#trendGradient)"
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
        </>
      )}
      
      {/* Focused data point announcement for screen readers */}
      {focusedDataPoint !== null && (
        <div className="sr-only" aria-live="polite">
          Focused on data point {focusedDataPoint + 1} of {chartData.length}: 
          {chartData[focusedDataPoint]?.displayValue} on {dayjs(chartData[focusedDataPoint]?.fullDate).format('MMM D, YYYY')}
        </div>
      )}
    </div>
  )
}
