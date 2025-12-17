import { useReminders } from '../hooks/useReminders'
import { useHabits } from '../hooks/useHabits'
import { useAuthState } from '../hooks/useAuth'

export function ReminderManager() {
  const { user } = useAuthState()
  const { data: habits = [] } = useHabits()

  const { permission, requestPermission, isSupported } = useReminders(habits)

  // Auto-request permission if user has habits with reminders and hasn't been asked yet
  const hasReminders = habits.some(h => h.reminderTime)
  
  if (!user || !isSupported || !hasReminders) {
    return null
  }

  if (permission === 'default') {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enable Habit Reminders</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Get notified when it's time to complete your habits
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-lg p-4 border border-yellow-200 dark:border-yellow-800 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications Blocked</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              To receive habit reminders, enable notifications in your browser settings
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
