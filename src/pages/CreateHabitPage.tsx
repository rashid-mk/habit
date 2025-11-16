import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateHabitForm, HabitFormData } from '../components/CreateHabitForm'
import { SuccessMessage } from '../components/SuccessMessage'
import { Navigation } from '../components/Navigation'
import { useCreateHabit } from '../hooks/useHabits'

export function CreateHabitPage() {
  const navigate = useNavigate()
  const createHabit = useCreateHabit()
  const [showSuccess, setShowSuccess] = useState(false)

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Habit</h2>
          <p className="text-gray-600">Start building a better you, one habit at a time</p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-xl bg-white/40 rounded-3xl border border-white/20 p-8 shadow-2xl">
          <CreateHabitForm
            onSubmit={handleSubmit}
            isLoading={createHabit.isPending}
            error={createHabit.error}
          />
        </div>

        {/* Tips Section */}
        <div className="mt-8 backdrop-blur-xl bg-blue-500/10 rounded-2xl border border-blue-200/20 p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Tips for Success</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start small - choose habits you can realistically maintain</li>
                <li>• Be specific - "Exercise 30 minutes" is better than "Exercise more"</li>
                <li>• Track consistently - daily check-ins build momentum</li>
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
