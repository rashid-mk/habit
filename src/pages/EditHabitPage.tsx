import { useNavigate, useParams } from 'react-router-dom'
import { useHabit } from '../hooks/useHabits'
import { Navigation } from '../components/Navigation'
import { EditHabitForm } from '../components/EditHabitForm'
import { useUpdateHabit } from '../hooks/useUpdateHabit.ts'

export function EditHabitPage() {
  const navigate = useNavigate()
  const { habitId } = useParams<{ habitId: string }>()
  const { data: habit, isLoading: habitLoading } = useHabit(habitId!)
  const updateHabitMutation = useUpdateHabit()

  const handleSubmit = async (habitData: any) => {
    if (!habitId) return
    
    try {
      await updateHabitMutation.mutateAsync({
        habitId,
        updates: habitData,
      })
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to update habit:', error)
      // Error will be displayed by the form
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        updateHabitMutation.reset()
      }, 5000)
    }
  }

  if (habitLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Habit not found</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Habit</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Update your habit details</p>
          </div>

          <EditHabitForm
            habit={habit}
            onSubmit={handleSubmit}
            isLoading={updateHabitMutation.isPending}
            error={updateHabitMutation.error}
          />
        </div>
      </div>
    </div>
  )
}
