import { DayOfWeekStats as DayOfWeekStatsType } from '../types/analytics'
import { CheckIn } from '../hooks/useHabits'
import { premiumAnalyticsCalculator } from '../services/PremiumAnalyticsCalculator'
import { DayOfWeekBarChart } from './DayOfWeekBarChart'
import { useAnalyticsErrorHandler } from '../hooks/useAnalyticsErrorHandler'
import { ErrorMessage } from './ErrorMessage'
import { InsufficientDataMessage } from './InsufficientDataMessage'

interface DayOfWeekStatsProps {
  completions: CheckIn[]
}

export function DayOfWeekStats({ completions }: DayOfWeekStatsProps) {
  const errorHandler = useAnalyticsErrorHandler({
    onError: (error) => {
      console.error('Day-of-week stats error:', error)
    }
  })

  // Calculate day-of-week statistics with error handling
  const stats: DayOfWeekStatsType | null = errorHandler.wrapCalculation(() => {
    return premiumAnalyticsCalculator.calculateDayOfWeekStats(completions)
  }, 'day-of-week statistics')

  // Handle error state
  if (errorHandler.hasError) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Day of Week Performance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See which days you perform best on
          </p>
        </div>
        <ErrorMessage 
          error={errorHandler.error!} 
          onRetry={errorHandler.canRetry ? () => {
            errorHandler.clearError()
          } : undefined}
        />
      </div>
    )
  }

  // Handle insufficient data
  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Day of Week Performance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See which days you perform best on
          </p>
        </div>
        <InsufficientDataMessage
          minimumRequired={28}
          currentCount={completions.length}
          dataType="days of data"
          analysisType="day-of-week analysis"
        />
      </div>
    )
  }

  // Calculate total weeks of data
  const uniqueWeeks = new Set(
    completions.map(c => {
      const date = new Date(c.dateKey)
      const year = date.getFullYear()
      const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      return `${year}-${week}`
    })
  ).size

  const hasEnoughData = uniqueWeeks >= 4

  // Calculate percentage difference between best and worst days
  const bestRate = stats[stats.bestDay].completionRate
  const worstRate = stats[stats.worstDay].completionRate
  const percentageDifference = bestRate - worstRate

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Day of Week Performance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          See which days you perform best on
        </p>
      </div>

      <DayOfWeekBarChart stats={stats} />

      {/* Best and Worst Day Highlights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            Best Day
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300 capitalize">
            {stats.bestDay}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            {bestRate.toFixed(1)}% completion
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
            Worst Day
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 capitalize">
            {stats.worstDay}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            {worstRate.toFixed(1)}% completion
          </div>
        </div>
      </div>

      {/* Comparative Insights (only shown with 4+ weeks of data) */}
      {hasEnoughData && percentageDifference > 10 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Insight
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You're <strong>{percentageDifference.toFixed(1)}%</strong> more likely to complete your habit on{' '}
                <strong className="capitalize">{stats.bestDay}s</strong> compared to{' '}
                <strong className="capitalize">{stats.worstDay}s</strong>. Consider scheduling important habits on your best days.
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasEnoughData && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track for at least 4 weeks to see detailed insights about your day-of-week patterns.
          </p>
        </div>
      )}
    </div>
  )
}
