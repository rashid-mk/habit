import React, { useState, useMemo } from 'react'
import { Insight, InsightType } from '../types/analytics'
import { InsightCard } from './InsightCard'
import { LoadingSpinner } from './LoadingSpinner'

interface InsightListProps {
  insights: Insight[]
  showFilters?: boolean
  isLoading?: boolean
}

/**
 * InsightList Component
 * Container for displaying multiple insights with filtering and categorization
 */
export const InsightList: React.FC<InsightListProps> = ({ 
  insights, 
  showFilters = true,
  isLoading = false
}) => {
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all')
  const [selectedConfidence, setSelectedConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Get unique insight types from the data
  const availableTypes = useMemo(() => {
    const types = new Set(insights.map(i => i.type))
    return Array.from(types)
  }, [insights])

  // Filter insights based on selected filters
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const typeMatch = selectedType === 'all' || insight.type === selectedType
      const confidenceMatch = selectedConfidence === 'all' || insight.confidence === selectedConfidence
      return typeMatch && confidenceMatch
    })
  }, [insights, selectedType, selectedConfidence])

  // Categorize insights by type
  const categorizedInsights = useMemo(() => {
    const categories: Record<InsightType, Insight[]> = {
      'day-of-week-pattern': [],
      'time-of-day-pattern': [],
      'weekend-behavior': [],
      'timing-impact': [],
      'streak-correlation': []
    }

    filteredInsights.forEach(insight => {
      if (categories[insight.type]) {
        categories[insight.type].push(insight)
      }
    })

    return categories
  }, [filteredInsights])

  // Get category display name
  const getCategoryName = (type: InsightType): string => {
    switch (type) {
      case 'day-of-week-pattern':
        return 'Day of Week Patterns'
      case 'time-of-day-pattern':
        return 'Time of Day Patterns'
      case 'weekend-behavior':
        return 'Weekend Behavior'
      case 'timing-impact':
        return 'Timing Impact'
      case 'streak-correlation':
        return 'Streak Correlations'
      default:
        return 'Other Insights'
    }
  }

  // Get filter button label
  const getTypeLabel = (type: InsightType): string => {
    switch (type) {
      case 'day-of-week-pattern':
        return 'Day Patterns'
      case 'time-of-day-pattern':
        return 'Time Patterns'
      case 'weekend-behavior':
        return 'Weekend'
      case 'timing-impact':
        return 'Timing'
      case 'streak-correlation':
        return 'Streaks'
      default:
        return type
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Generating insights...
          </span>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Insights Yet
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Keep tracking your habit! We need at least 4 weeks of data to generate personalized insights and recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          {/* Type filter */}
          {availableTypes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedType === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  All ({insights.length})
                </button>
                {availableTypes.map(type => {
                  const count = insights.filter(i => i.type === type).length
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedType === type
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {getTypeLabel(type)} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Confidence filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Confidence
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedConfidence('all')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedConfidence === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                All
              </button>
              {(['high', 'medium', 'low'] as const).map(level => {
                const count = insights.filter(i => i.confidence === level).length
                if (count === 0) return null
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedConfidence(level)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedConfidence === level
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {showFilters && filteredInsights.length !== insights.length && (
        <div className="text-sm text-gray-600">
          Showing {filteredInsights.length} of {insights.length} insights
        </div>
      )}

      {/* No results after filtering */}
      {filteredInsights.length === 0 && (
        <div className="text-center py-8 px-4">
          <p className="text-gray-500">No insights match your filters</p>
        </div>
      )}

      {/* Categorized insights */}
      {filteredInsights.length > 0 && (
        <div className="space-y-6">
          {(Object.keys(categorizedInsights) as InsightType[]).map(type => {
            const categoryInsights = categorizedInsights[type]
            if (categoryInsights.length === 0) return null

            return (
              <div key={type}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {getCategoryName(type)}
                </h3>
                <div className="space-y-3">
                  {categoryInsights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
