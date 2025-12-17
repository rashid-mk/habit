import { useEffect, useState } from 'react'
import { Habit } from '../hooks/useHabits'

interface CheckInModalProps {
  isOpen: boolean
  habit: Habit
  currentProgress: number
  onSave: (newProgress: number) => void
  onClose: () => void
}

export function CheckInModal({ isOpen, habit, currentProgress, onSave, onClose }: CheckInModalProps) {
  const [progress, setProgress] = useState(currentProgress)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    setProgress(currentProgress)
  }, [currentProgress, isOpen])

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

  const trackingType = habit.trackingType || 'simple'
  const targetValue = habit.targetValue || 1
  const targetUnit = habit.targetUnit || 'times'
  const isCompleted = progress >= targetValue

  const handleSave = () => {
    onSave(progress)
    if (progress >= targetValue && currentProgress < targetValue) {
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        onClose()
      }, 1500)
    } else {
      onClose()
    }
  }

  const handleQuickAdd = (amount: number) => {
    setProgress(Math.max(0, progress + amount))
  }

  const handleReset = () => {
    setProgress(0)
  }

  const getDisplayValue = () => {
    if (trackingType === 'time' && targetUnit === 'hours') {
      return (progress / 60).toFixed(1)
    }
    return progress
  }

  const getDisplayTarget = () => {
    if (trackingType === 'time' && targetUnit === 'hours') {
      return (targetValue / 60).toFixed(1)
    }
    return targetValue
  }

  const getDisplayUnit = () => {
    if (trackingType === 'count') return 'times'
    return targetUnit
  }

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
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: habit.color || '#3b82f6' }}
            >
              {trackingType === 'count' ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {habit.habitName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {trackingType === 'count' ? 'Track your count' : 'Log your time'}
            </p>
          </div>

          {/* Progress Display */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {getDisplayValue()}
                <span className="text-3xl text-gray-500 dark:text-gray-400">
                  /{getDisplayTarget()}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getDisplayUnit()}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((progress / targetValue) * 100, 100)}%` }}
              />
            </div>

            {isCompleted && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Target Reached!
                </span>
              </div>
            )}
          </div>

          {/* Quick Add Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Quick Add
            </label>
            <div className="grid grid-cols-3 gap-3">
              {trackingType === 'count' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(1)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(5)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(10)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +10
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(5)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(15)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(30)}
                    className="py-3 px-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold transition-colors"
                  >
                    +30 min
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Manual Entry
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setProgress(Math.max(0, progress - 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors"
                aria-label="Decrease"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                min="0"
              />
              <button
                type="button"
                onClick={() => setProgress(progress + 1)}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors"
                aria-label="Increase"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-colors shadow-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-3xl font-bold text-white">Target Reached!</div>
          </div>
        </div>
      )}
    </>
  )
}
