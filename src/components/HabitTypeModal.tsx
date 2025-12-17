import { useEffect } from 'react'

interface HabitTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: 'build' | 'break') => void
}

export function HabitTypeModal({ isOpen, onClose, onSelectType }: HabitTypeModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 dark:bg-black/85 z-[80] backdrop-blur-md animate-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-modal-content">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Habit
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              What type of habit would you like to create?
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Build Habit */}
            <button
              onClick={() => {
                onSelectType('build')
                onClose()
              }}
              className="w-full p-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg hover:shadow-green-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Build a Habit
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create positive habits you want to develop
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    e.g., Exercise, Read, Meditate
                  </p>
                </div>
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Break Habit */}
            <button
              onClick={() => {
                onSelectType('break')
                onClose()
              }}
              className="w-full p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:border-red-400 dark:hover:border-red-600 hover:shadow-lg hover:shadow-red-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Break a Habit
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quit bad habits you want to eliminate
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    e.g., Smoking, Junk Food, Social Media
                  </p>
                </div>
                <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
