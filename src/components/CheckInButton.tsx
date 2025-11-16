import { useState } from 'react'
import { createPerformanceTrace } from '../hooks/usePerformanceTrace'
import { ErrorMessage } from './ErrorMessage'
import { SuccessMessage } from './SuccessMessage'

interface CheckInButtonProps {
  habitId: string
  date: string
  isCompleted: boolean
  onCheckIn: (habitId: string, date: string) => Promise<void>
}

export function CheckInButton({ habitId, date, isCompleted, onCheckIn }: CheckInButtonProps) {
  const [optimisticComplete, setOptimisticComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const isCheckedIn = isCompleted || optimisticComplete

  const handleCheckIn = async () => {
    if (isCheckedIn || loading) {
      return
    }

    // Track check-in performance
    const perfTrace = createPerformanceTrace('check_in_action')
    perfTrace.start()
    
    const startTime = performance.now()

    // Optimistic UI update - show completed immediately
    setOptimisticComplete(true)
    setLoading(true)
    setError(null)
    
    // Track optimistic UI latency
    const optimisticLatency = performance.now() - startTime
    perfTrace.putMetric('optimistic_ui_latency', Math.round(optimisticLatency))

    try {
      await onCheckIn(habitId, date)
      // Success - optimistic state matches reality
      const totalLatency = performance.now() - startTime
      perfTrace.putMetric('total_latency', Math.round(totalLatency))
      perfTrace.putAttribute('status', 'success')
      setShowSuccess(true)
    } catch (err: unknown) {
      // Rollback on error
      setOptimisticComplete(false)
      setError(err)
      perfTrace.putAttribute('status', 'error')
    } finally {
      setLoading(false)
      perfTrace.stop()
    }
  }

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={handleCheckIn}
          disabled={isCheckedIn || loading}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-all duration-100
            ${
              isCheckedIn
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }
            ${loading ? 'opacity-75 cursor-wait' : ''}
            disabled:cursor-not-allowed
          `}
          aria-label={isCheckedIn ? 'Completed' : 'Check in'}
        >
          {isCheckedIn ? '✓ Completed' : 'Check In'}
        </button>
        
        {error ? <ErrorMessage error={error as Error} onRetry={handleCheckIn} /> : null}
      </div>
      
      {showSuccess && (
        <SuccessMessage
          message="Check-in completed! Keep up the great work!"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </>
  )
}
