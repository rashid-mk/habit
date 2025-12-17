import { useEffect, useState } from 'react'
import { Habit } from './useHabits'
import { reminderService } from '../utils/reminderService'

interface UseRemindersReturn {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  isSupported: boolean
}

export function useReminders(habits: Habit[]): UseRemindersReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )

  const isSupported = 'Notification' in window

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }

  useEffect(() => {
    // Only start reminder service if permission is granted
    if (permission === 'granted' && habits.length > 0) {
      reminderService.start(habits)
    }

    // Cleanup on unmount
    return () => {
      reminderService.stop()
    }
  }, [habits, permission])

  return {
    permission,
    requestPermission,
    isSupported,
  }
}
