import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreateHabitForm, HabitFormData } from '../components/CreateHabitForm'
import { SuccessMessage } from '../components/SuccessMessage'
import { Navigation } from '../components/Navigation'
import { useCreateHabit } from '../hooks/useHabits'

export function CreateHabitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const createHabit = useCreateHabit()
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Get habit type from navigation state
  const initialHabitType = (location.state as { habitType?: 'build' | 'break' })?.habitType

  const handleSubmit = async (habitData: HabitFormData) => {
    await createHabit.mutateAsync(habitData)
    setShowSuccess(true)
    setTimeout(() => {
      navigate('/dashboard')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation showBackButton backTo="/dashboard" title="Create Habit" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 mb-6 shadow-2xl shadow-blue-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Create New Habit
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start building a better you, one habit at a time. Small consistent actions lead to remarkable transformations.
          </p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-2xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-8 md:p-12 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 mb-8">
          <CreateHabitForm
            onSubmit={handleSubmit}
            isLoading={createHabit.isPending}
            error={createHabit.error}
            initialHabitType={initialHabitType}
          />
        </div>

        {/* Tips Section */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/30 dark:border-blue-800/30 p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                Pro Tips for Success
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">New</span>
              </h3>
              <ul className="space-y-2.5">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="font-semibold">Start small:</strong> Choose habits you can realistically maintain every day</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="font-semibold">Be specific:</strong> "Exercise 30 minutes" works better than "Exercise more"</span>
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="font-semibold">Stay consistent:</strong> Daily check-ins build momentum and create lasting change</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {showSuccess && (
        <SuccessMessage
          message="Habit created successfully! Redirecting to dashboard..."
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  )
}
