import React from 'react'
import { Insight } from '../types/analytics'
import { createKeyboardHandler } from '../utils/accessibility'

interface InsightCardProps {
  insight: Insight
  onCardClick?: () => void
}

/**
 * InsightCard Component
 * Displays a single insight with confidence indicator, message, and recommendation
 */
export const InsightCard: React.FC<InsightCardProps> = ({ insight, onCardClick }) => {
  // Get icon based on insight type
  const getInsightIcon = (type: Insight['type']): string => {
    switch (type) {
      case 'day-of-week-pattern':
        return '📅'
      case 'time-of-day-pattern':
        return '⏰'
      case 'weekend-behavior':
        return '🌴'
      case 'timing-impact':
        return '🌅'
      case 'streak-correlation':
        return '🔥'
      default:
        return '💡'
    }
  }

  // Get color classes based on confidence level (WCAG AA compliant)
  const getConfidenceColor = (confidence: Insight['confidence']): string => {
    switch (confidence) {
      case 'high':
        return 'bg-green-50 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-100'
      case 'medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-100'
      case 'low':
        return 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100'
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700/20 dark:border-gray-600 dark:text-gray-100'
    }
  }

  // Get confidence badge color (WCAG AA compliant)
  const getConfidenceBadgeColor = (confidence: Insight['confidence']): string => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/30 dark:text-green-200 dark:border-green-600'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-600'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-400 dark:bg-gray-700/30 dark:text-gray-200 dark:border-gray-500'
    }
  }

  const confidenceColor = getConfidenceColor(insight.confidence)
  const badgeColor = getConfidenceBadgeColor(insight.confidence)
  const icon = getInsightIcon(insight.type)

  // Keyboard handler for card interaction
  const handleKeyboard = createKeyboardHandler(() => {
    if (onCardClick) {
      onCardClick()
    }
  })

  // Generate accessible description
  const cardDescription = `${insight.type.replace('-', ' ')} insight with ${insight.confidence} confidence. ${insight.message}${insight.actionable && insight.recommendation ? ` Recommendation: ${insight.recommendation}` : ''}`

  return (
    <div 
      className={`rounded-lg border-2 p-4 ${confidenceColor} transition-smooth hover:shadow-lg focus-within:shadow-lg hover:scale-102 animate-slideInUp ${onCardClick ? 'cursor-pointer focus-ring' : ''}`}
      onClick={onCardClick}
      onKeyDown={onCardClick ? handleKeyboard : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      role={onCardClick ? 'button' : 'article'}
      aria-label={onCardClick ? `Insight card: ${cardDescription}` : undefined}
    >
      {/* Header with icon and confidence badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-gentleBounce" role="img" aria-label={`${insight.type.replace('-', ' ')} insight`}>
            {icon}
          </span>
          <span 
            className={`text-xs font-semibold px-2 py-1 rounded-full border transition-smooth hover:scale-105 ${badgeColor}`}
            aria-label={`${insight.confidence} confidence level`}
          >
            {insight.confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>
        <span className="text-xs opacity-80" aria-label={`Based on ${insight.dataSupport} data points`}>
          {insight.dataSupport} data points
        </span>
      </div>

      {/* Main message */}
      <p className="text-sm font-medium mb-3 leading-relaxed" role="main">
        {insight.message}
      </p>

      {/* Recommendation (if actionable) */}
      {insight.actionable && insight.recommendation && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20 animate-slideInUp" role="complementary" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-2">
            <span className="text-sm font-semibold flex-shrink-0 animate-gentleBounce" role="img" aria-label="Tip" style={{ animationDelay: '0.5s' }}>💡 Tip:</span>
            <p className="text-sm opacity-90 leading-relaxed">
              {insight.recommendation}
            </p>
          </div>
        </div>
      )}
      
      {/* Screen reader summary */}
      <div className="sr-only">
        {cardDescription}
      </div>
    </div>
  )
}
