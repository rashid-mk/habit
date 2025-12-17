import { TrendData as TrendDataType, TimePeriod } from '../types/analytics'

interface TrendDataProps {
  trend: TrendDataType
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

const periodLabels: Record<TimePeriod, string> = {
  '4W': '4 Weeks',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year'
}

export function TrendData({ trend, selectedPeriod, onPeriodChange }: TrendDataProps) {
  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
          </svg>
        )
      case 'down':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
          </svg>
        )
      case 'stable':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Trend Analysis
      </h3>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {(['4W', '3M', '6M', '1Y'] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* Trend Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion Rate */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Completion Rate
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {trend.completionRate.toFixed(1)}%
          </p>
        </div>

        {/* Percentage Change */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Change from Previous
          </p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className={`text-2xl font-bold ${getTrendColor()}`}>
              {formatPercentage(trend.percentageChange)}
            </p>
          </div>
        </div>

        {/* Average Progress (if available) */}
        {trend.averageProgress !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Average Daily Progress
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {trend.averageProgress.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Trend Direction Indicator */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {trend.direction === 'up' && (
              <>
                Your completion rate is <span className="font-semibold text-green-600">improving</span> compared to the previous period.
              </>
            )}
            {trend.direction === 'down' && (
              <>
                Your completion rate is <span className="font-semibold text-red-600">declining</span> compared to the previous period.
              </>
            )}
            {trend.direction === 'stable' && (
              <>
                Your completion rate is <span className="font-semibold text-gray-600">stable</span> compared to the previous period.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
