import { useState, useEffect } from 'react'

interface OnboardingHint {
  id: string
  title: string
  description: string
  targetSelector: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingHintsProps {
  hints: OnboardingHint[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingHints({ hints, isActive, onComplete, onSkip }: OnboardingHintsProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  const currentHint = hints[currentHintIndex]
  const isLastHint = currentHintIndex === hints.length - 1

  useEffect(() => {
    if (!isActive || !currentHint) return

    const element = document.querySelector(currentHint.targetSelector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Add highlight class
      element.classList.add('onboarding-highlight')
      
      return () => {
        element.classList.remove('onboarding-highlight')
      }
    }
  }, [currentHint, isActive])

  const handleNext = () => {
    if (isLastHint) {
      onComplete()
    } else {
      setCurrentHintIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isActive || !currentHint || !highlightedElement) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[90] animate-modal-backdrop backdrop-blur-sm" />
      
      {/* Hint Card */}
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
        <div className="glass-card rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-slideUpFade pointer-events-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4 animate-pulseGlow">
                <span className="text-white font-bold text-sm">
                  {currentHintIndex + 1}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {currentHint.title}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentHintIndex + 1} of {hints.length}
                </div>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Skip onboarding"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-base">
            {currentHint.description}
          </p>

          {/* Action Button */}
          {currentHint.action && (
            <div className="mb-8">
              <button
                onClick={currentHint.action.onClick}
                className="w-full btn-primary animate-pulseGlow"
              >
                {currentHint.action.label}
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span className="font-medium">Progress</span>
              <span className="font-semibold">{Math.round(((currentHintIndex + 1) / hints.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out animate-shimmer"
                style={{ width: `${((currentHintIndex + 1) / hints.length) * 100}%` }}
              />
            </div>
            {/* Progress dots */}
            <div className="flex justify-center mt-4 space-x-2">
              {hints.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index <= currentHintIndex 
                      ? 'bg-indigo-600 scale-110' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentHintIndex === 0}
              className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="btn-secondary"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="btn-primary flex items-center"
              >
                {isLastHint ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finish Tour
                  </>
                ) : (
                  <>
                    Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight styles */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 91 !important;
          box-shadow: 
            0 0 0 4px rgba(99, 102, 241, 0.6), 
            0 0 0 8px rgba(99, 102, 241, 0.3),
            0 0 0 12px rgba(99, 102, 241, 0.1) !important;
          border-radius: 16px !important;
          animation: pulseGlow 2s ease-in-out infinite;
          transform: scale(1.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .onboarding-highlight::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 20px;
          background: linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
          z-index: -1;
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

// Predefined hint sets for different features
export const premiumAnalyticsHints: OnboardingHint[] = [
  {
    id: 'analytics-overview',
    title: '🎉 Welcome to Premium Analytics',
    description: 'Get powerful insights into your habit patterns with advanced analytics, trends, and AI-powered recommendations. This comprehensive tour will show you all the premium features available to help you optimize your habits.',
    targetSelector: '[data-analytics-dashboard]',
    placement: 'bottom'
  },
  {
    id: 'trend-analysis',
    title: '📈 Trend Analysis',
    description: 'View your completion trends over different time periods (4 weeks, 3 months, 6 months, 1 year). Interactive charts show percentage changes and help you identify improvement or decline patterns. Click on different time ranges to see how your habits evolve over time.',
    targetSelector: '[data-section="trends"]',
    placement: 'right'
  },
  {
    id: 'performance-analysis',
    title: '📊 Performance Patterns',
    description: 'Discover which days of the week and times of day you perform best. Interactive heatmaps and bar charts reveal your peak performance hours and optimal days. Use these insights to optimize your schedule and set reminders at peak times.',
    targetSelector: '[data-section="performance"]',
    placement: 'right'
  },
  {
    id: 'ai-insights',
    title: '🤖 AI-Powered Insights',
    description: 'Get personalized recommendations based on your habit patterns. Our AI analyzes your data to detect patterns, predict success likelihood, and suggest optimal timing. These insights help you improve consistency and identify optimization opportunities.',
    targetSelector: '[data-section="insights"]',
    placement: 'right'
  },
  {
    id: 'detailed-breakdown',
    title: '📅 Detailed Breakdowns',
    description: 'Explore your data in different time views - weekly, monthly, quarterly, and yearly. Calendar heatmaps, progress timelines, and detailed statistics provide comprehensive analysis. Perfect for deep analysis and long-term progress tracking.',
    targetSelector: '[data-section="breakdown"]',
    placement: 'right'
  },
  {
    id: 'data-export',
    title: '📤 Export Your Data',
    description: 'Download your habit data in multiple formats (CSV, JSON, PDF) for external analysis, backup, or sharing with coaches and accountability partners. PDF reports include beautiful charts and insights, while CSV/JSON provide raw data for advanced analysis.',
    targetSelector: '[data-section="export"]',
    placement: 'left',
    action: {
      label: '✨ Try Export Feature',
      onClick: () => {
        const exportButton = document.querySelector('[data-export-trigger]') as HTMLButtonElement
        exportButton?.click()
      }
    }
  }
]

export const chartInteractionHints: OnboardingHint[] = [
  {
    id: 'chart-hover',
    title: '🖱️ Interactive Charts',
    description: 'Hover over data points to see detailed information. On mobile, tap to interact with charts and view specific values.',
    targetSelector: '[data-chart]',
    placement: 'top'
  },
  {
    id: 'chart-zoom',
    title: '🔍 Zoom and Pan',
    description: 'Drag to zoom into specific time periods. Use the brush below to pan through your data and focus on particular date ranges.',
    targetSelector: '[data-chart="trend-line"]',
    placement: 'bottom'
  },
  {
    id: 'chart-accessibility',
    title: '⌨️ Keyboard Navigation',
    description: 'Use arrow keys to navigate through data points and press Enter to select. Toggle to table view for screen readers and detailed data access.',
    targetSelector: '[data-chart-controls]',
    placement: 'top'
  }
]

export const dashboardHints: OnboardingHint[] = [
  {
    id: 'dashboard-overview',
    title: '🏠 Your Dashboard',
    description: 'This is your habit tracking dashboard. Here you can see all your habits, track progress, and access premium analytics.',
    targetSelector: '[data-dashboard]',
    placement: 'bottom'
  },
  {
    id: 'habit-cards',
    title: '📋 Habit Cards',
    description: 'Each card represents one of your habits. Click to check in, view details, or access analytics. Long press for more options.',
    targetSelector: '[data-habit-card]',
    placement: 'top'
  },
  {
    id: 'streak-tracking',
    title: '🔥 Streak Tracking',
    description: 'Your current streak is shown prominently. Maintain consistency to build longer streaks and develop lasting habits.',
    targetSelector: '[data-streak-display]',
    placement: 'right'
  },
  {
    id: 'quick-checkin',
    title: '✅ Quick Check-in',
    description: 'Tap the check-in button to mark your habit as complete for today. You can also add notes or track specific values.',
    targetSelector: '[data-checkin-button]',
    placement: 'left'
  }
]

export const mobileNavigationHints: OnboardingHint[] = [
  {
    id: 'mobile-swipe',
    title: '👆 Swipe Navigation',
    description: 'On mobile, you can swipe left and right to navigate between different analytics sections quickly.',
    targetSelector: '[data-mobile-nav]',
    placement: 'top'
  },
  {
    id: 'bottom-sheet',
    title: '📱 Bottom Sheets',
    description: 'Many actions on mobile use bottom sheets for better thumb accessibility. Swipe down to close or tap outside.',
    targetSelector: '[data-bottom-sheet]',
    placement: 'top'
  },
  {
    id: 'touch-targets',
    title: '🎯 Touch-Friendly',
    description: 'All buttons and interactive elements are optimized for touch with larger tap targets and haptic feedback.',
    targetSelector: '[data-touch-target]',
    placement: 'bottom'
  }
]