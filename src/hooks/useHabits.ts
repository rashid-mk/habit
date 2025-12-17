import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, doc, setDoc, serverTimestamp, query, getDocs, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from './useAuth'
import { HabitFormData } from '../components/CreateHabitForm'
import dayjs from 'dayjs'
import { calculateAnalyticsLocal } from '../utils/analyticsCalculator'

export interface Habit {
  id: string
  habitName: string
  habitType?: 'build' | 'break'
  trackingType?: 'simple' | 'count' | 'time' // NEW - defaults to 'simple' for backward compatibility
  targetValue?: number // NEW - for count (number) or time (minutes)
  targetUnit?: 'times' | 'minutes' | 'hours' // NEW - display unit
  color?: string
  frequency: 'daily' | string[]
  reminderTime?: string
  goal?: number // times per day (default 1)
  startDate: Timestamp
  createdAt: Timestamp
  isActive: boolean
  endConditionType?: 'never' | 'on_date' | 'after_completions'
  endConditionValue?: string | number
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
        
        // Handle custom start date
        let startDateValue
        if (habitData.customStartDate) {
          // Convert YYYY-MM-DD string to Timestamp
          const customDate = new Date(habitData.customStartDate + 'T00:00:00')
          startDateValue = Timestamp.fromDate(customDate)
        } else {
          startDateValue = serverTimestamp()
        }
        
        // Validate tracking type fields
        const trackingType = habitData.trackingType || 'simple'
        if ((trackingType === 'count' || trackingType === 'time') && habitData.targetValue) {
          if (habitData.targetValue < 1 || habitData.targetValue > 999) {
            throw new Error('Target value must be between 1 and 999')
          }
        }

        // Convert hours to minutes for storage if needed
        let targetValueInMinutes = habitData.targetValue
        if (trackingType === 'time' && habitData.targetUnit === 'hours' && habitData.targetValue) {
          targetValueInMinutes = habitData.targetValue * 60
        }

        const habitDoc = await addDoc(habitsRef, {
          habitName: habitData.habitName,
          habitType: habitData.habitType,
          trackingType: trackingType,
          targetValue: (trackingType === 'count' || trackingType === 'time') ? targetValueInMinutes : null,
          targetUnit: habitData.targetUnit || null,
          color: habitData.color || null,
          frequency: habitData.frequency,
          reminderTime: habitData.reminderTime || null,
          startDate: startDateValue,
          createdAt: serverTimestamp(),
          isActive: true,
          endConditionType: habitData.endConditionType || null,
          endConditionValue: habitData.endConditionValue || null,
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
  completionCount?: number // Number of times completed (for multi-goal habits)
  goal?: number // Target completions for the day
  timestamps?: Timestamp[] // Array of completion timestamps
  progressValue?: number // NEW - current count or minutes logged
  isCompleted?: boolean // NEW - whether target was reached
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

        // Calculate and save analytics locally (instant calculation, then save to DB)
        const habitDoc = await getDoc(doc(db, 'users', user.uid, 'habits', habitId))
        if (habitDoc.exists()) {
          const habit = habitDoc.data() as Habit
          
          // Fetch all checks
          const checksRef = collection(db, 'users', user.uid, 'habits', habitId, 'checks')
          const checksSnapshot = await getDocs(checksRef)
          const checks = checksSnapshot.docs.map(d => d.data() as any)
          
          // Calculate analytics locally
          const newAnalytics = calculateAnalyticsLocal(checks, habit.startDate, habit.frequency)
          
          // Save calculated analytics to database
          const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
          await setDoc(analyticsRef, newAnalytics, { merge: true })
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
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      await queryClient.cancelQueries({ queryKey: ['checks', user?.uid, variables.habitId] })

      // Snapshot previous values
      const previousAnalytics = queryClient.getQueryData(['analytics', user?.uid, variables.habitId])
      const previousChecks = queryClient.getQueryData(['checks', user?.uid, variables.habitId])

      // Get habit from cache (instant - no Firestore fetch!)
      const cachedHabit = queryClient.getQueryData(['habit', user?.uid, variables.habitId]) as Habit | undefined
      
      if (cachedHabit) {
        // Get checks from cache
        const cachedChecks = (queryClient.getQueryData(['checks', user?.uid, variables.habitId]) as CheckIn[] | undefined) || []
        
        // Add the new check optimistically
        const dateKey = dayjs(variables.date).format('YYYY-MM-DD')
        const optimisticChecks = [
          ...cachedChecks.filter(c => c.dateKey !== dateKey),
          { dateKey, completedAt: Timestamp.now(), habitId: variables.habitId, status: 'done' as const }
        ]
        
        // Calculate new analytics instantly from cached data (no async!)
        const newAnalytics = calculateAnalyticsLocal(optimisticChecks, cachedHabit.startDate, cachedHabit.frequency)
        
        // Update cache immediately for instant UI update
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], newAnalytics)
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], optimisticChecks)
      }

      return { previousAnalytics, previousChecks }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousAnalytics) {
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], context.previousAnalytics)
      }
      if (context?.previousChecks) {
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], context.previousChecks)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
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

        // Calculate and save analytics locally after deletion
        const habitDoc = await getDoc(doc(db, 'users', user.uid, 'habits', habitId))
        if (habitDoc.exists()) {
          const habit = habitDoc.data() as Habit
          
          // Fetch all remaining checks
          const checksRef = collection(db, 'users', user.uid, 'habits', habitId, 'checks')
          const checksSnapshot = await getDocs(checksRef)
          const checks = checksSnapshot.docs.map(d => d.data() as any)
          
          // Calculate analytics locally
          const newAnalytics = calculateAnalyticsLocal(checks, habit.startDate, habit.frequency)
          
          // Save calculated analytics to database
          const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
          await setDoc(analyticsRef, newAnalytics, { merge: true })
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
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      await queryClient.cancelQueries({ queryKey: ['checks', user?.uid, variables.habitId] })

      // Snapshot previous values
      const previousAnalytics = queryClient.getQueryData(['analytics', user?.uid, variables.habitId])
      const previousChecks = queryClient.getQueryData(['checks', user?.uid, variables.habitId])

      // Get habit from cache (instant - no Firestore fetch!)
      const cachedHabit = queryClient.getQueryData(['habit', user?.uid, variables.habitId]) as Habit | undefined
      
      if (cachedHabit) {
        // Get checks from cache
        const cachedChecks = (queryClient.getQueryData(['checks', user?.uid, variables.habitId]) as CheckIn[] | undefined) || []
        
        // Remove the check optimistically
        const dateKey = dayjs(variables.date).format('YYYY-MM-DD')
        const optimisticChecks = cachedChecks.filter(c => c.dateKey !== dateKey)
        
        // Calculate new analytics instantly from cached data (no async!)
        const newAnalytics = calculateAnalyticsLocal(optimisticChecks, cachedHabit.startDate)
        
        // Update cache immediately for instant UI update
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], newAnalytics)
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], optimisticChecks)
      }

      return { previousAnalytics, previousChecks }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousAnalytics) {
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], context.previousAnalytics)
      }
      if (context?.previousChecks) {
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], context.previousChecks)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
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

        // Calculate and save analytics locally after toggle
        const habitDoc = await getDoc(doc(db, 'users', user.uid, 'habits', habitId))
        if (habitDoc.exists()) {
          const habit = habitDoc.data() as Habit
          
          // Fetch all checks
          const checksRef = collection(db, 'users', user.uid, 'habits', habitId, 'checks')
          const checksSnapshot = await getDocs(checksRef)
          const checks = checksSnapshot.docs.map(d => d.data() as any)
          
          // Calculate analytics locally
          const newAnalytics = calculateAnalyticsLocal(checks, habit.startDate)
          
          // Save calculated analytics to database
          const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
          await setDoc(analyticsRef, newAnalytics, { merge: true })
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
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      await queryClient.cancelQueries({ queryKey: ['checks', user?.uid, variables.habitId] })

      // Snapshot previous values
      const previousAnalytics = queryClient.getQueryData(['analytics', user?.uid, variables.habitId])
      const previousChecks = queryClient.getQueryData(['checks', user?.uid, variables.habitId])

      // Get habit from cache (instant - no Firestore fetch!)
      const cachedHabit = queryClient.getQueryData(['habit', user?.uid, variables.habitId]) as Habit | undefined
      
      if (cachedHabit) {
        // Get checks from cache
        const cachedChecks = (queryClient.getQueryData(['checks', user?.uid, variables.habitId]) as CheckIn[] | undefined) || []
        
        // Calculate next status and update checks optimistically
        const dateKey = dayjs(variables.date).format('YYYY-MM-DD')
        const nextStatus = getNextStatus(variables.currentStatus)
        
        let optimisticChecks: CheckIn[]
        if (nextStatus === 'skip') {
          // Remove the check
          optimisticChecks = cachedChecks.filter(c => c.dateKey !== dateKey)
        } else {
          // Add or update the check
          optimisticChecks = [
            ...cachedChecks.filter(c => c.dateKey !== dateKey),
            { dateKey, completedAt: Timestamp.now(), habitId: variables.habitId, status: nextStatus }
          ]
        }
        
        // Calculate new analytics instantly from cached data (no async!)
        const newAnalytics = calculateAnalyticsLocal(optimisticChecks, cachedHabit.startDate)
        
        // Update cache immediately for instant UI update
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], newAnalytics)
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], optimisticChecks)
      }

      return { previousAnalytics, previousChecks }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousAnalytics) {
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], context.previousAnalytics)
      }
      if (context?.previousChecks) {
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], context.previousChecks)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      queryClient.invalidateQueries({ queryKey: ['checks', user?.uid, variables.habitId] })
    },
    retry: 2,
    retryDelay: 1000,
  })
}



// Hook for updating progress on count/time habits
export function useUpdateProgress() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date, progressValue }: { habitId: string; date: string; progressValue: number }) => {
      if (!user) {
        throw new Error('User must be authenticated to update progress')
      }

      const dateKey = dayjs(date).format('YYYY-MM-DD')

      try {
        // Get habit to check target value
        const habitDoc = await getDoc(doc(db, 'users', user.uid, 'habits', habitId))
        if (!habitDoc.exists()) {
          throw new Error('Habit not found')
        }

        const habit = habitDoc.data() as Habit
        const targetValue = habit.targetValue || 1
        const isCompleted = progressValue >= targetValue

        // Write or update check document with progress
        const checkRef = doc(db, 'users', user.uid, 'habits', habitId, 'checks', dateKey)
        await setDoc(checkRef, {
          dateKey,
          completedAt: serverTimestamp(),
          habitId,
          status: isCompleted ? 'done' : 'not_done',
          progressValue,
          isCompleted,
        })

        // Calculate and save analytics
        const checksRef = collection(db, 'users', user.uid, 'habits', habitId, 'checks')
        const checksSnapshot = await getDocs(checksRef)
        const checks = checksSnapshot.docs.map(d => d.data() as any)
        
        const newAnalytics = calculateAnalyticsLocal(checks, habit.startDate, habit.frequency)
        
        const analyticsRef = doc(db, 'users', user.uid, 'habits', habitId, 'analytics', 'summary')
        await setDoc(analyticsRef, newAnalytics, { merge: true })

        return { dateKey, progressValue, isCompleted }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          throw new Error('You do not have permission to update progress')
        } else if (error.code === 'unavailable') {
          throw new Error('Connection lost. Changes will sync when online')
        } else {
          throw new Error('Failed to update progress. Please try again')
        }
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      await queryClient.cancelQueries({ queryKey: ['checks', user?.uid, variables.habitId] })

      const previousAnalytics = queryClient.getQueryData(['analytics', user?.uid, variables.habitId])
      const previousChecks = queryClient.getQueryData(['checks', user?.uid, variables.habitId])

      const cachedHabit = queryClient.getQueryData(['habit', user?.uid, variables.habitId]) as Habit | undefined
      
      if (cachedHabit) {
        const cachedChecks = (queryClient.getQueryData(['checks', user?.uid, variables.habitId]) as CheckIn[] | undefined) || []
        const dateKey = dayjs(variables.date).format('YYYY-MM-DD')
        const targetValue = cachedHabit.targetValue || 1
        const isCompleted = variables.progressValue >= targetValue
        
        const optimisticChecks = [
          ...cachedChecks.filter(c => c.dateKey !== dateKey),
          { 
            dateKey, 
            completedAt: Timestamp.now(), 
            habitId: variables.habitId, 
            status: isCompleted ? 'done' as const : 'not_done' as const,
            progressValue: variables.progressValue,
            isCompleted
          }
        ]
        
        const newAnalytics = calculateAnalyticsLocal(optimisticChecks, cachedHabit.startDate, cachedHabit.frequency)
        
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], newAnalytics)
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], optimisticChecks)
      }

      return { previousAnalytics, previousChecks }
    },
    onError: (_err, variables, context) => {
      if (context?.previousAnalytics) {
        queryClient.setQueryData(['analytics', user?.uid, variables.habitId], context.previousAnalytics)
      }
      if (context?.previousChecks) {
        queryClient.setQueryData(['checks', user?.uid, variables.habitId], context.previousChecks)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analytics', user?.uid, variables.habitId] })
      queryClient.invalidateQueries({ queryKey: ['checks', user?.uid, variables.habitId] })
    },
    retry: 2,
    retryDelay: 1000,
  })
}
