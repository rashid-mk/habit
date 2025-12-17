import React, { useState } from 'react'
import { PremiumFeature } from '../types/analytics'
import { UpgradePrompt } from './UpgradePrompt'

interface PremiumBlurOverlayProps {
  children: React.ReactNode
  isPremium: boolean
  feature: PremiumFeature
  featureName: string
  className?: string
}

export function PremiumBlurOverlay({ 
  children, 
  isPremium, 
  feature, 
  featureName, 
  className = '' 
}: PremiumBlurOverlayProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred Content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/60 to-white/30 dark:from-gray-900/90 dark:via-gray-900/60 dark:to-gray-900/30 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Upgrade to unlock {featureName.toLowerCase()} and advanced analytics
          </p>
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={feature}
        featureName={featureName}
      />
    </div>
  )
}