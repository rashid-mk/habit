import { useEffect } from 'react'
import { PremiumFeature } from '../types/analytics'
import { focusUtils } from '../utils/accessibility'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  feature: PremiumFeature
  featureName: string
}

export function UpgradePrompt({ isOpen, onClose, feature, featureName }: UpgradePromptProps) {
  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement
    const modal = document.querySelector('[role="dialog"]') as HTMLElement
    
    if (modal) {
      const cleanup = focusUtils.trapFocus(modal)
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)

      return () => {
        cleanup()
        document.removeEventListener('keydown', handleEscape)
        focusUtils.returnFocus(previousActiveElement)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getFeatureDescription = (feature: PremiumFeature): string => {
    switch (feature) {
      case 'advanced-analytics':
        return 'Get detailed insights into your habit patterns with trend analysis, day-of-week performance, and predictive recommendations.'
      case 'data-export':
        return 'Export your habit data in CSV, JSON, or PDF formats for external analysis or record keeping.'
      case 'insights':
        return 'Receive AI-powered insights about your habits with actionable recommendations for improvement.'
      case 'charts':
        return 'Visualize your progress with interactive charts, heatmaps, and trend graphs.'
      case 'multi-device-sync':
        return 'Sync your analytics across all devices in real-time for seamless access anywhere.'
      default:
        return 'Unlock premium features to enhance your habit tracking experience.'
    }
  }

  const getFeatureIcon = (feature: PremiumFeature): string => {
    switch (feature) {
      case 'advanced-analytics':
        return '📊'
      case 'data-export':
        return '📤'
      case 'insights':
        return '💡'
      case 'charts':
        return '📈'
      case 'multi-device-sync':
        return '🔄'
      default:
        return '⭐'
    }
  }

  const premiumFeatures = [
    { icon: '📊', title: 'Advanced Analytics', description: 'Detailed trend analysis and performance metrics' },
    { icon: '💡', title: 'Smart Insights', description: 'AI-powered recommendations and pattern detection' },
    { icon: '📈', title: 'Interactive Charts', description: 'Beautiful visualizations and progress tracking' },
    { icon: '📤', title: 'Data Export', description: 'Export your data in multiple formats' },
    { icon: '🔄', title: 'Multi-Device Sync', description: 'Real-time sync across all your devices' }
  ]

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          aria-describedby="upgrade-modal-description"
        >
          {/* Header */}
          <div className="relative p-8 text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full animate-pulse" />
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-smooth focus-ring z-10"
              aria-label="Close upgrade dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-gentleBounce" role="img" aria-label={`${featureName} feature icon`}>
                {getFeatureIcon(feature)}
              </div>
              <h2 id="upgrade-modal-title" className="text-3xl font-bold mb-2 animate-slideInUp">
                Unlock Premium Analytics
              </h2>
              <p id="upgrade-modal-description" className="text-indigo-100 text-lg animate-slideInUp" style={{ animationDelay: '0.1s' }}>
                Get deeper insights into your habit patterns
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Current Feature Description */}
            <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 animate-slideInUp glass-effect">
              <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                {featureName}
              </h3>
              <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                {getFeatureDescription(feature)}
              </p>
            </div>

            {/* Premium Features List */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                What's included in Premium:
              </h3>
              <ul className="grid gap-4" role="list">
                {premiumFeatures.map((premiumFeature, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 transition-smooth hover:bg-gray-100 dark:hover:bg-gray-700 animate-slideInRight"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-2xl animate-gentleBounce" role="img" aria-label={`${premiumFeature.title} icon`} style={{ animationDelay: `${index * 0.2}s` }}>
                      {premiumFeature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {premiumFeature.title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {premiumFeature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="inline-block p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white border border-indigo-400 animate-pulseGlow transition-transform-smooth hover:scale-105">
                <div className="text-3xl font-bold mb-2" aria-label="Price: $9.99 per month">$9.99/month</div>
                <div className="text-indigo-100">Cancel anytime</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  // TODO: Implement upgrade flow
                  console.log('Upgrade to premium clicked')
                }}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-smooth transform hover:scale-105 active:scale-95 shadow-lg focus-ring animate-pulseGlow"
                aria-describedby="upgrade-modal-description"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-4 px-6 rounded-xl transition-smooth hover:scale-105 active:scale-95 focus-ring"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}