import { MonthComparison as MonthComparisonType } from '../types/analytics'
import { CheckIn } from '../hooks/useHabits'
import { premiumAnalyticsCalculator } from '../services/PremiumAnalyticsCalculator'
import { useAnalyticsErrorHandler } from '../hooks/useAnalyticsErrorHandler'
import { ErrorMessage } from './ErrorMessage'
import { InsufficientDataMessage } from './InsufficientDataMessage'
import dayjs from 'dayjs'

interface MonthComparisonProps {
  completions: CheckIn[]
}

export function MonthComparison({ completions }: MonthComparisonProps) {
  const errorHandler = useAnalyticsErrorHandler({
    onError: (error) => {
      console.error('Month comparison error:', error)
    }
  })
  // Get current and previous month date ranges
  const now = dayjs()
  const currentMonthStart = now.startOf('month')
  const currentMonthEnd = now.endOf('month')
  const previousMonthStart = now.subtract(1, 'month').startOf('month')
  const previousMonthEnd = now.subtract(1, 'month').endOf('month')

  // Filter completions for each month
  const currentMonthCompletions = completions.filter(c => {
    const checkDate = dayjs(c.dateKey)
    return (checkDate.isAfter(currentMonthStart) || checkDate.isSame(currentMonthStart, 'day')) &&
           (checkDate.isBefore(currentMonthEnd) || checkDate.isSame(currentMonthEnd, 'day'))
  })

  const previousMonthCompletions = completions.filter(c => {
    const checkDate = dayjs(c.dateKey)
    return (checkDate.isAfter(previousMonthStart) || checkDate.isSame(previousMonthStart, 'day')) &&
           (checkDate.isBefore(previousMonthEnd) || checkDate.isSame(previousMonthEnd, 'day'))
  })

  // Check if we have enough data (at least 2 complete months)
  const hasEnoughData = previousMonthCompletions.length > 0 && currentMonthCompletions.length > 0

  // Calculate month comparison with error handling
  const comparison: MonthComparisonType | null = errorHandler.wrapCalculation(() => {
    if (!hasEnoughData) {
      return null
    }
    
    return premiumAnalyticsCalculator.calculateMonthComparison(
      currentMonthCompletions,
      previousMonthCompletions
    )
  }, 'month-over-month comparison')

  // Handle error state
  if (errorHandler.hasError) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Month-over-Month Comparison
        </h3>
        <ErrorMessage 
          error={errorHandler.error!} 
          onRetry={errorHandler.canRetry ? () => {
            errorHandler.clearError()
          } : undefined}
        />
      </div>
    )
  }

  // Render insufficient data message
  if (!hasEnoughData || !comparison) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Month-over-Month Comparison
        </h3>
        <InsufficientDataMessage
          minimumRequired={60}
          currentCount={completions.length}
          dataType="days of data"
          analysisType="month-over-month comparison"
        />
      </div>
    )
  }

  // Get trend icon and color based on percentage change
  const getTrendIcon = () => {
    if (comparison!.percentageChange > 0) {
      return (
        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
        </svg>
      )
    } else if (comparison!.percentageChange < 0) {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const getTrendColor = () => {
    if (comparison!.percentageChange > 0) return 'text-green-600'
    if (comparison!.percentageChange < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Month-over-Month Comparison
      </h3>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Previous Month Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {previousMonthStart.format('MMMM YYYY')}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {comparison!.previousMonth.completionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {comparison!.previousMonth.totalCompletions} of {comparison!.previousMonth.totalScheduled} days
          </div>
        </div>

        {/* Current Month Card */}
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-700">
          <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-2 font-medium">
            {currentMonthStart.format('MMMM YYYY')} (Current)
          </div>
          <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
            {comparison!.currentMonth.completionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-indigo-600 dark:text-indigo-400">
            {comparison!.currentMonth.totalCompletions} of {comparison!.currentMonth.totalScheduled} days
          </div>
        </div>
      </div>

      {/* Percentage Change Display */}
      <div className={`rounded-lg p-4 ${
        comparison!.isSignificant 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700' 
          : 'bg-gray-50 dark:bg-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTrendIcon()}
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Change from Previous Month
              </div>
              <div className={`text-2xl font-bold ${getTrendColor()}`}>
                {formatPercentage(comparison!.percentageChange)}
              </div>
            </div>
          </div>
          
          {/* Significant Change Badge */}
          {comparison!.isSignificant && (
            <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-2 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Significant Change
              </span>
            </div>
          )}
        </div>

        {/* Contextual Message */}
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {comparison!.percentageChange > 0 && (
            <>
              Great progress! Your completion rate has <strong>improved</strong> this month.
              {comparison!.isSignificant && ' This is a significant improvement - keep up the momentum!'}
            </>
          )}
          {comparison!.percentageChange < 0 && (
            <>
              Your completion rate has <strong>decreased</strong> this month.
              {comparison!.isSignificant && ' This is a significant change - consider what might be affecting your consistency.'}
            </>
          )}
          {comparison!.percentageChange === 0 && (
            <>
              Your completion rate is <strong>consistent</strong> with last month.
            </>
          )}
        </div>
      </div>
    </div>
  )
}
