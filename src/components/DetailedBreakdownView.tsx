import { useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { CheckIn } from '../hooks/useHabits'

dayjs.extend(isoWeek)

type ViewPeriod = 'week' | 'month' | 'quarter' | 'year'

interface DetailedBreakdownViewProps {
  checks: CheckIn[]
  habitStartDate: Date
  habitFrequency: string | string[]
  trackingType?: 'simple' | 'count' | 'time'
  targetValue?: number
  targetUnit?: string
}

export function DetailedBreakdownView({
  checks,
  habitStartDate,
  habitFrequency,
  trackingType = 'simple',
  targetValue = 1,
  targetUnit = 'minutes'
}: DetailedBreakdownViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ViewPeriod>('week')

  const isActiveDay = (date: dayjs.Dayjs): boolean => {
    if (habitFrequency === 'daily') return true
    if (Array.isArray(habitFrequency)) {
      const dayName = date.format('dddd').toLowerCase()
      return habitFrequency.includes(dayName)
    }
    return true
  }

  const getCheckForDate = (dateKey: string): CheckIn | undefined => {
    return checks.find(c => c.dateKey === dateKey)
  }

  const renderWeekView = () => {
    const today = dayjs()
    const startOfWeek = today.startOf('isoWeek')
    const days = []

    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day')
      const dateKey = date.format('YYYY-MM-DD')
      const check = getCheckForDate(dateKey)
      const isActive = isActiveDay(date)
      const isBeforeStart = date.isBefore(dayjs(habitStartDate), 'day')
      const isFuture = date.isAfter(today, 'day')

      days.push({
        date,
        dateKey,
        check,
        isActive,
        isBeforeStart,
        isFuture
      })
    }

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Week of {startOfWeek.format('MMM D, YYYY')}
        </h3>
        <div className="space-y-2">
          {days.map((day) => {
            const status = day.check?.status || 'skip'
            const progressValue = day.check?.progressValue || 0
            const isComplete = trackingType !== 'simple' && progressValue >= targetValue

            return (
              <div
                key={day.dateKey}
                className={`p-4 rounded-xl border transition-all ${
                  day.isBeforeStart || !day.isActive || day.isFuture
                    ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-50'
                    : status === 'done' || isComplete
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : status === 'not_done'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day.date.format('ddd')}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {day.date.format('D')}
                      </div>
                    </div>
                    <div>
                      {day.isBeforeStart ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Before start</span>
                      ) : !day.isActive ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Not scheduled</span>
                      ) : day.isFuture ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Upcoming</span>
                      ) : trackingType === 'simple' ? (
                        <span className={`text-sm font-medium ${
                          status === 'done' ? 'text-green-700 dark:text-green-300' :
                          status === 'not_done' ? 'text-red-700 dark:text-red-300' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {status === 'done' ? '✓ Completed' : status === 'not_done' ? '✗ Not Done' : 'Skipped'}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {trackingType === 'count' ? (
                              `${progressValue} / ${targetValue}`
                            ) : targetUnit === 'hours' ? (
                              `${Math.floor(progressValue / 60)}h ${progressValue % 60}m / ${Math.floor(targetValue / 60)}h`
                            ) : (
                              `${progressValue} / ${targetValue} min`
                            )}
                          </div>
                          {progressValue > 0 && (
                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isComplete ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min((progressValue / targetValue) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!day.isBeforeStart && day.isActive && !day.isFuture && (
                    <div>
                      {trackingType === 'simple' ? (
                        status === 'done' ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : status === 'not_done' ? (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : null
                      ) : isComplete ? (
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : progressValue > 0 ? (
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {Math.round((progressValue / targetValue) * 100)}%
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const today = dayjs()
    const startOfMonth = today.startOf('month')
    const endOfMonth = today.endOf('month')
    const startDate = startOfMonth.startOf('isoWeek')
    const endDate = endOfMonth.endOf('isoWeek')

    const weeks = []
    let currentWeek = []
    let currentDate = startDate

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateKey = currentDate.format('YYYY-MM-DD')
      const check = getCheckForDate(dateKey)
      const isActive = isActiveDay(currentDate)
      const isBeforeStart = currentDate.isBefore(dayjs(habitStartDate), 'day')
      const isFuture = currentDate.isAfter(today, 'day')
      const isCurrentMonth = currentDate.month() === today.month()

      currentWeek.push({
        date: currentDate,
        dateKey,
        check,
        isActive,
        isBeforeStart,
        isFuture,
        isCurrentMonth
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      currentDate = currentDate.add(1, 'day')
    }

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {today.format('MMMM YYYY')}
        </h3>
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const status = day.check?.status || 'skip'
                const progressValue = day.check?.progressValue || 0
                const isComplete = trackingType !== 'simple' && progressValue >= targetValue

                let bgColor = 'bg-gray-100 dark:bg-gray-800'
                if (!day.isCurrentMonth || day.isBeforeStart || !day.isActive || day.isFuture) {
                  bgColor = 'bg-gray-50 dark:bg-gray-900 opacity-40'
                } else if (trackingType === 'simple') {
                  if (status === 'done') bgColor = 'bg-green-500 dark:bg-green-600'
                  else if (status === 'not_done') bgColor = 'bg-red-500 dark:bg-red-600'
                } else {
                  if (isComplete) bgColor = 'bg-green-500 dark:bg-green-600'
                  else if (progressValue > 0) {
                    const percentage = (progressValue / targetValue) * 100
                    if (percentage >= 75) bgColor = 'bg-blue-500 dark:bg-blue-600'
                    else if (percentage >= 50) bgColor = 'bg-blue-400 dark:bg-blue-500'
                    else if (percentage >= 25) bgColor = 'bg-blue-300 dark:bg-blue-400'
                    else bgColor = 'bg-blue-200 dark:bg-blue-300'
                  }
                }

                return (
                  <div
                    key={day.dateKey}
                    className={`aspect-square rounded-lg ${bgColor} flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer group relative`}
                  >
                    <span className={`text-sm font-medium ${
                      !day.isCurrentMonth || day.isBeforeStart || !day.isActive || day.isFuture
                        ? 'text-gray-400 dark:text-gray-600'
                        : (status === 'done' || isComplete) || (trackingType !== 'simple' && progressValue > 0)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day.date.date()}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                        <div className="font-semibold mb-1">{day.date.format('MMM D, YYYY')}</div>
                        {day.isBeforeStart ? (
                          <div>Before start</div>
                        ) : !day.isActive ? (
                          <div>Not scheduled</div>
                        ) : day.isFuture ? (
                          <div>Upcoming</div>
                        ) : trackingType === 'simple' ? (
                          <div>{status === 'done' ? '✓ Completed' : status === 'not_done' ? '✗ Not Done' : 'Skipped'}</div>
                        ) : (
                          <div>
                            {trackingType === 'count' ? (
                              `${progressValue} / ${targetValue}`
                            ) : targetUnit === 'hours' ? (
                              `${Math.floor(progressValue / 60)}h ${progressValue % 60}m / ${Math.floor(targetValue / 60)}h`
                            ) : (
                              `${progressValue} / ${targetValue} min`
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderQuarterView = () => {
    const today = dayjs()
    const currentQuarter = Math.floor(today.month() / 3)
    const quarterStart = today.month(currentQuarter * 3).startOf('month')
    
    const months = []
    for (let i = 0; i < 3; i++) {
      const month = quarterStart.add(i, 'month')
      const monthStart = month.startOf('month')
      const monthEnd = month.endOf('month')
      
      let totalScheduled = 0
      let totalCompleted = 0
      let totalProgress = 0
      let daysWithProgress = 0

      let currentDate = monthStart
      while (currentDate.isBefore(monthEnd) || currentDate.isSame(monthEnd, 'day')) {
        const dateKey = currentDate.format('YYYY-MM-DD')
        const isActive = isActiveDay(currentDate)
        const isBeforeStart = currentDate.isBefore(dayjs(habitStartDate), 'day')
        const isFuture = currentDate.isAfter(today, 'day')

        if (!isBeforeStart && isActive && !isFuture) {
          totalScheduled++
          const check = getCheckForDate(dateKey)
          if (check) {
            if (trackingType === 'simple') {
              if (check.status === 'done') totalCompleted++
            } else {
              const progressValue = check.progressValue || 0
              totalProgress += progressValue
              if (progressValue > 0) daysWithProgress++
              if (progressValue >= targetValue) totalCompleted++
            }
          }
        }

        currentDate = currentDate.add(1, 'day')
      }

      const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0
      const avgProgress = daysWithProgress > 0 ? totalProgress / daysWithProgress : 0

      months.push({
        month,
        totalScheduled,
        totalCompleted,
        completionRate,
        avgProgress,
        totalProgress
      })
    }

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Q{currentQuarter + 1} {today.year()}
        </h3>
        <div className="space-y-3">
          {months.map((monthData, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {monthData.month.format('MMMM')}
                </h4>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(monthData.completionRate)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {monthData.totalCompleted} / {monthData.totalScheduled}
                  </span>
                </div>
                {trackingType !== 'simple' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {trackingType === 'count' ? 'Avg per day' : 'Avg time'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {trackingType === 'count' ? (
                        Math.round(monthData.avgProgress)
                      ) : targetUnit === 'hours' ? (
                        `${Math.floor(monthData.avgProgress / 60)}h ${Math.round(monthData.avgProgress % 60)}m`
                      ) : (
                        `${Math.round(monthData.avgProgress)} min`
                      )}
                    </span>
                  </div>
                )}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                    style={{ width: `${monthData.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderYearView = () => {
    const today = dayjs()
    const yearStart = today.startOf('year')
    
    const months = []
    for (let i = 0; i < 12; i++) {
      const month = yearStart.add(i, 'month')
      const monthStart = month.startOf('month')
      const monthEnd = month.endOf('month')
      
      let totalScheduled = 0
      let totalCompleted = 0
      let totalProgress = 0
      let daysWithProgress = 0

      let currentDate = monthStart
      while (currentDate.isBefore(monthEnd) || currentDate.isSame(monthEnd, 'day')) {
        const dateKey = currentDate.format('YYYY-MM-DD')
        const isActive = isActiveDay(currentDate)
        const isBeforeStart = currentDate.isBefore(dayjs(habitStartDate), 'day')
        const isFuture = currentDate.isAfter(today, 'day')

        if (!isBeforeStart && isActive && !isFuture) {
          totalScheduled++
          const check = getCheckForDate(dateKey)
          if (check) {
            if (trackingType === 'simple') {
              if (check.status === 'done') totalCompleted++
            } else {
              const progressValue = check.progressValue || 0
              totalProgress += progressValue
              if (progressValue > 0) daysWithProgress++
              if (progressValue >= targetValue) totalCompleted++
            }
          }
        }

        currentDate = currentDate.add(1, 'day')
      }

      const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0
      const avgProgress = daysWithProgress > 0 ? totalProgress / daysWithProgress : 0

      months.push({
        month,
        totalScheduled,
        totalCompleted,
        completionRate,
        avgProgress,
        totalProgress
      })
    }

    // Calculate trend data points for the line chart
    const trendData = months.filter(m => m.totalScheduled > 0)

    return (
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {today.year()}
        </h3>
        
        {/* Trend line visualization */}
        {trendData.length > 1 && (
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Completion Rate Trend
            </h4>
            <div className="relative h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={100 - y}
                    x2="100"
                    y2={100 - y}
                    stroke="currentColor"
                    strokeWidth="0.2"
                    className="text-gray-300 dark:text-gray-600"
                  />
                ))}
                {/* Trend line */}
                <polyline
                  points={trendData.map((m, i) => {
                    const x = (i / (trendData.length - 1)) * 100
                    const y = 100 - m.completionRate
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-500"
                />
                {/* Data points */}
                {trendData.map((m, i) => {
                  const x = (i / (trendData.length - 1)) * 100
                  const y = 100 - m.completionRate
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="currentColor"
                      className="text-blue-600"
                    />
                  )
                })}
              </svg>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-8">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map((monthData, index) => {
            const hasData = monthData.totalScheduled > 0
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border transition-all ${
                  hasData
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {monthData.month.format('MMM')}
                </div>
                {hasData ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {Math.round(monthData.completionRate)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {monthData.totalCompleted}/{monthData.totalScheduled} days
                    </div>
                    {trackingType !== 'simple' && monthData.avgProgress > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Avg: {trackingType === 'count' ? (
                          Math.round(monthData.avgProgress)
                        ) : targetUnit === 'hours' ? (
                          `${Math.floor(monthData.avgProgress / 60)}h`
                        ) : (
                          `${Math.round(monthData.avgProgress)}m`
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-600">
                    No data
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Detailed Breakdown
      </h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['week', 'month', 'quarter', 'year'] as ViewPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              selectedPeriod === period
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div>
        {selectedPeriod === 'week' && renderWeekView()}
        {selectedPeriod === 'month' && renderMonthView()}
        {selectedPeriod === 'quarter' && renderQuarterView()}
        {selectedPeriod === 'year' && renderYearView()}
      </div>
    </div>
  )
}
