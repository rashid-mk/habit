import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from './useAuth'

interface UpdateHabitParams {
  habitId: string
  updates: {
    habitName?: string
    habitType?: 'build' | 'break'
    color?: string
    frequency?: 'daily' | string[]
    duration?: number
    reminderTime?: string
  }
}

export function useUpdateHabit() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, updates }: UpdateHabitParams) => {
      if (!user) {
        throw new Error('User must be authenticated to update a habit')
      }

      try {
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        )

        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        await updateDoc(habitRef, cleanUpdates)
        
        return { habitId }
      } catch (error: any) {
        console.error('Update error:', error)
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to update this habit')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else if (error.code === 'not-found') {
          throw new Error('Habit not found')
        } else {
          throw new Error(`Failed to update habit: ${error.message || 'Please try again'}`)
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['habit', user?.uid, variables.habitId] })
      queryClient.invalidateQueries({ queryKey: ['habits', user?.uid] })
    },
  })
}
