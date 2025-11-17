import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, doc, setDoc, serverTimestamp, query, getDocs, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from './useAuth'
import { HabitFormData } from '../components/CreateHabitForm'
import dayjs from 'dayjs'

export interface Habit {
  id: string
  habitName: string
  habitType?: 'build' | 'break'
  color?: string
  frequency: 'daily' | string[]
  duration: number
  reminderTime?: string
  startDate: Timestamp
  createdAt: Timestamp
  isActive: boolean
}

export interface Analytics {
  currentStreak: number
  longestStreak: number
  completionRate: number
  totalDays: number
  completedDays: number
  lastUpdated: Timestamp
}

export function useCreateHabit() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitData: HabitFormData) => {
      if (!user) {
        throw new Error('User must be authenticated to create a habit')
      }

      try {
        // Create habit document
        const habitsRef = collection(db, 'users', user.uid, 'habits')
        const habitDoc = await addDoc(habitsRef, {
          habitName: habitData.habitName,
          habitType: habitData.habitType, // Add habitType field
          color: habitData.color || null, // Add color field
          frequency: habitData.frequency,
          duration: habitData.duration,
          reminderTime: habitData.reminderTime || null,
          startDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          isActive: true,
        })

        // Initialize analytics document with zero values
        const analyticsRef = doc(db, 'users', user.uid, 'habits', habitDoc.id, 'analytics', 'summary')
        await setDoc(analyticsRef, {
          currentStreak: 0,
          longestStreak: 0,
          completionRate: 0,
          totalDays: 0,
          completedDays: 0,
          lastUpdated: serverTimestamp(),
        })

        return { habitId: habitDoc.id }
      } catch (error: any) {
        // Handle Firestore errors
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to create habits')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          throw new Error('Failed to create habit. Please try again')
        }
      }
    },
    onSuccess: () => {
      // Invalidate habits query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['habits', user?.uid] })
    },
  })
}

export function useHabits() {
  const { user } = useAuthState()

  return useQuery({
    queryKey: ['habits', user?.uid],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch habits')
      }

      try {
        const habitsRef = collection(db, 'users', user.uid, 'habits')
        const habitsQuery = query(habitsRef)
        const snapshot = await getDocs(habitsQuery)

        const habits: Habit[] = []
        snapshot.forEach((doc) => {
          const habitData = doc.data()
          // Only include active habits
          if (habitData.isActive !== false) {
            habits.push({
              ...habitData,
              id: doc.id,
            } as Habit)
          }
        })

        return habits
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view habits')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          throw new Error('Failed to load habits. Please try again')
        }
      }
    },
    enabled: !!user,
  })
}

export function useHabitAnalytics(habitId: string) {
  const { user } = useAuthState()

  return useQuery({
    queryKey: ['analytics', user?.uid, habitId],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch analytics')
      }

      try {
        const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
        const analyticsDoc = await getDoc(analyticsRef)

        if (!analyticsDoc.exists()) {
          // Return default analytics if document doesn't exist yet
          return {
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
            totalDays: 0,
            completedDays: 0,
            lastUpdated: Timestamp.now(),
          } as Analytics
        }

        return analyticsDoc.data() as Analytics
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view analytics')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          throw new Error('Failed to load analytics. Please try again')
        }
      }
    },
    enabled: !!user && !!habitId,
  })
}

export function useHabit(habitId: string) {
  const { user } = useAuthState()

  return useQuery({
    queryKey: ['habit', user?.uid, habitId],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch habit')
      }

      try {
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        const habitDoc = await getDoc(habitRef)

        if (!habitDoc.exists()) {
          throw new Error('Habit not found')
        }

        return {
          id: habitDoc.id,
          ...habitDoc.data(),
        } as Habit
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view this habit')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else if (error.message === 'Habit not found') {
          throw error
        } else {
          throw new Error('Failed to load habit. Please try again')
        }
      }
    },
    enabled: !!user && !!habitId,
  })
}

export interface CheckIn {
  dateKey: string
  completedAt: Timestamp
  habitId: string
  status?: 'done' | 'not_done' // Optional for backward compatibility
}

export interface UseHabitChecksOptions {
  habitId: string
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
}

export function useHabitChecks(options: UseHabitChecksOptions | string) {
  const { user } = useAuthState()
  
  // Support both old string format and new options format for backward compatibility
  const habitId = typeof options === 'string' ? options : options.habitId
  const startDate = typeof options === 'string' ? undefined : options.startDate
  const endDate = typeof options === 'string' ? undefined : options.endDate

  return useQuery({
    queryKey: ['checks', user?.uid, habitId, startDate, endDate],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch check-ins')
      }

      try {
        const checksRef = collection(db, 'users', user.uid, 'habits', habitId, 'checks')
        let checksQuery = query(checksRef)
        
        // Add date range filtering if provided
        if (startDate && endDate) {
          const { where } = await import('firebase/firestore')
          checksQuery = query(
            checksRef,
            where('dateKey', '>=', startDate),
            where('dateKey', '<=', endDate)
          )
        }
        
        const snapshot = await getDocs(checksQuery)

        const checks: CheckIn[] = []
        snapshot.forEach((doc) => {
          checks.push(doc.data() as CheckIn)
        })

        return checks
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to view check-ins')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          throw new Error('Failed to load check-ins. Please try again')
        }
      }
    },
    enabled: !!user && !!habitId,
  })
}

export function useCheckIn() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) {
        throw new Error('User must be authenticated to check in')
      }

      // Format date as YYYY-MM-DD for document ID
      const dateKey = dayjs(date).format('YYYY-MM-DD')

      try {
        // Write or update check document with dateKey as document ID
        const checkRef = doc(db, 'users', user.uid, 'habits', habitId, 'checks', dateKey)
        await setDoc(checkRef, {
          dateKey,
          completedAt: serverTimestamp(),
          habitId,
          status: 'done',
        })

        // Get habit start date for analytics calculation
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        const habitDoc = await getDoc(habitRef)
        
        if (habitDoc.exists()) {
          const habitData = habitDoc.data()
          const { updateHabitAnalytics } = await import('../utils/analyticsCalculator')
          
          // Calculate and update analytics (async, don't block UI)
          updateHabitAnalytics(user.uid, habitId, habitData.startDate).catch((error) => {
            console.error('Failed to update analytics:', error)
          })
        }

        return { dateKey }
      } catch (error: any) {
        // Handle Firestore errors
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to check in')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Changes will sync when online')
        } else {
          throw new Error('Failed to check in. Please try again')
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate analytics query to refetch updated stats
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      // Invalidate checks query if we add one later
      queryClient.invalidateQueries({ queryKey: ['checks', user?.uid, variables.habitId] })
    },
    retry: 2, // Retry failed writes up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  })
}


export function useUndoCheckIn() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) {
        throw new Error('User must be authenticated to undo check-in')
      }

      // Format date as YYYY-MM-DD for document ID
      const dateKey = dayjs(date).format('YYYY-MM-DD')

      try {
        // Delete check document
        const checkRef = doc(db, 'users', user.uid, 'habits', habitId, 'checks', dateKey)
        const existingCheck = await getDoc(checkRef)

        if (!existingCheck.exists()) {
          // No check-in to delete, just return success
          return { dateKey }
        }

        // Delete the check-in using deleteDoc
        const { deleteDoc } = await import('firebase/firestore')
        await deleteDoc(checkRef)

        // Get habit start date for analytics calculation
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        const habitDoc = await getDoc(habitRef)
        
        if (habitDoc.exists()) {
          const habitData = habitDoc.data()
          const { updateHabitAnalytics } = await import('../utils/analyticsCalculator')
          
          // Calculate and update analytics (async, don't block UI)
          updateHabitAnalytics(user.uid, habitId, habitData.startDate).catch((error) => {
            console.error('Failed to update analytics:', error)
          })
        }

        return { dateKey }
      } catch (error: any) {
        // Handle Firestore errors
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to undo check-in')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Changes will sync when online')
        } else {
          throw new Error('Failed to undo check-in. Please try again')
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate analytics query to refetch updated stats
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      // Invalidate checks query
      queryClient.invalidateQueries({ queryKey: ['checks', user?.uid, variables.habitId] })
    },
    retry: 2,
    retryDelay: 1000,
  })
}


export function useDeleteHabit() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete a habit')
      }

      try {
        // Mark habit as inactive
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        await setDoc(habitRef, { isActive: false }, { merge: true })
        
        return { success: true }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to delete this habit')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Please check your internet connection')
        } else {
          throw new Error('Failed to delete habit. Please try again')
        }
      }
    },
    onSuccess: () => {
      // Invalidate habits query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['habits', user?.uid] })
    },
  })
}

export type CheckInStatus = 'skip' | 'done' | 'not_done'

// Helper function to get next status in cycle
const getNextStatus = (current: CheckInStatus): CheckInStatus => {
  if (current === 'skip') return 'done'
  if (current === 'done') return 'not_done'
  return 'skip'
}

export function useToggleCheckIn() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date, currentStatus }: { habitId: string; date: string; currentStatus: CheckInStatus }) => {
      if (!user) {
        throw new Error('User must be authenticated to toggle check-in')
      }

      const dateKey = dayjs(date).format('YYYY-MM-DD')
      const nextStatus = getNextStatus(currentStatus)

      try {
        const checkRef = doc(db, 'users', user.uid, 'habits', habitId, 'checks', dateKey)

        if (nextStatus === 'skip') {
          // Delete check document
          const { deleteDoc } = await import('firebase/firestore')
          const existingCheck = await getDoc(checkRef)
          if (existingCheck.exists()) {
            await deleteDoc(checkRef)
          }
        } else if (nextStatus === 'done') {
          // Create or update check document with done status
          await setDoc(checkRef, {
            dateKey,
            completedAt: serverTimestamp(),
            habitId,
            status: 'done',
          })
        } else {
          // Create or update check document with not_done status
          await setDoc(checkRef, {
            dateKey,
            completedAt: serverTimestamp(),
            habitId,
            status: 'not_done',
          })
        }

        // Trigger analytics update
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId)
        const habitDoc = await getDoc(habitRef)
        
        if (habitDoc.exists()) {
          const habitData = habitDoc.data()
          const { updateHabitAnalytics } = await import('../utils/analyticsCalculator')
          
          // Calculate and update analytics (async, don't block UI)
          updateHabitAnalytics(user.uid, habitId, habitData.startDate).catch((error) => {
            console.error('Failed to update analytics:', error)
          })
        }

        return { dateKey, nextStatus }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to toggle check-in')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Changes will sync when online')
        } else {
          throw new Error('Failed to toggle check-in. Please try again')
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate analytics and checks queries
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      queryClient.invalidateQueries({ queryKey: ['checks', user?.uid, variables.habitId] })
    },
    retry: 2,
    retryDelay: 1000,
  })
}
