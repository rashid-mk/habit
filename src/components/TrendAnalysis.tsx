import { useState, useMemo } from 'react'
import { TimePeriod, TrendData as TrendDataType } from '../types/analytics'
import { TrendData } from './TrendData'
import { TrendLineChart } from './TrendLineChart'
import { CheckIn } from '../hooks/useHabits'
import { premiumAnalyticsCalculator } from '../services/PremiumAnalyticsCalculator'
import { LoadingSpinner } from './LoadingSpinner'
import { useAnalyticsErrorHandler } from '../hooks/useAnalyticsErrorHandler'
import { ErrorMessage } from './ErrorMessage'
import { InsufficientDataMessage } from './InsufficientDataMessage'

interface TrendAnalysisProps {
  completions: CheckIn[]
}

export function TrendAnalysis({ completions }: TrendAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('4W')
  const [isCalculating, setIsCalculating] = useState(false)
  
  const errorHandler = useAnalyticsErrorHandler({
    onError: (error) => {
      console.error('Trend analysis error:', error)
    }
  })

  // Calculate trend data for selected period with error handling
  const trendData: TrendDataType | null = useMemo(() => {
    setIsCalculating(true)
    
    return errorHandler.wrapCalculation(() => {
      try {
        const result = premiumAnalyticsCalculator.calculateTrend(
          completions,
          selectedPeriod
        )
        return result
      } finally {
        // Use setTimeout to ensure loading state is visible
        setTimeout(() => setIsCalculating(false), 100)
      }
    }, `trend analysis for ${selectedPeriod}`)
  }, [completions, selectedPeriod, errorHandler.wrapCalculation])

  const handlePeriodChange = (period: TimePeriod) => {
    errorHandler.clearError() // Clear any previous errors
    setIsCalculating(true)
    setSelectedPeriod(period)
  }

  // Handle loading state
  if (isCalculating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Calculating trends...
          </span>
        </div>
      </div>
    )
  }

  // Handle error state
  if (errorHandler.hasError) {
    return (
      <div className="space-y-6">
        <ErrorMessage 
          error={errorHandler.error!} 
          onRetry={errorHandler.canRetry ? () => {
            errorHandler.clearError()
            setSelectedPeriod(selectedPeriod) // Trigger recalculation
          } : undefined}
        />
      </div>
    )
  }

  // Handle insufficient data
  if (!trendData) {
    return (
      <div className="space-y-6">
        <InsufficientDataMessage
          minimumRequired={selectedPeriod === '4W' ? 7 : selectedPeriod === '3M' ? 14 : selectedPeriod === '6M' ? 30 : 60}
          currentCount={completions.length}
          dataType="days of data"
          analysisType={`${selectedPeriod} trend analysis`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TrendData
        trend={trendData}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />
      
      <TrendLineChart dataPoints={trendData.dataPoints} />
    </div>
  )
}
