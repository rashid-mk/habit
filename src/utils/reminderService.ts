import dayjs from 'dayjs'
import { Habit } from '../hooks/useHabits'

interface ReminderState {
  date: string // YYYY-MM-DD
  habitIds: string[] // Array of habit IDs that have been reminded today
}

const STORAGE_KEY = 'habit-reminders-shown'
const CLEANUP_DAYS = 7

class ReminderService {
  private intervalId: number | null = null
  private habits: Habit[] = []

  start(habits: Habit[]): void {
    this.habits = habits
    
    if (this.intervalId !== null) {
      return // Already running
    }

    // Check immediately on start
    this.checkReminders()

    // Then check every minute
    this.intervalId = window.setInterval(() => {
      this.checkReminders()
    }, 60000) // 60 seconds
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.habits = []
  }

  private checkReminders(): void {
    const now = dayjs()
    const currentTime = now.format('HH:mm')
    const dayOfWeek = now.format('dddd').toLowerCase()

    // Clean up old reminder states
    this.cleanupOldReminders()

    this.habits.forEach((habit) => {
      if (!habit.reminderTime) return

      // Check if reminder time has passed or matches current time
      const reminderTime = habit.reminderTime
      if (currentTime < reminderTime) return

      // Check if already shown today
      if (this.wasReminderShown(habit.id)) return

      // Check if today is an active day for this habit
      const isActiveToday =
        habit.frequency === 'daily' ||
        (Array.isArray(habit.frequency) && habit.frequency.includes(dayOfWeek))

      if (!isActiveToday) return

      // Show notification (we'll show it regardless of completion status for simplicity)
      // The user can dismiss it if they've already completed the habit
      this.showNotification(habit)
      this.markReminderShown(habit.id)
    })
  }

  private showNotification(habit: Habit): void {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const notification = new Notification(`Time for: ${habit.habitName}`, {
      body: "Don't break the chain! Complete your habit now.",
      icon: '/favicon.ico',
      tag: habit.id, // Prevent duplicate notifications
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = `/habits/${habit.id}`
      notification.close()
    }
  }

  private wasReminderShown(habitId: string): boolean {
    const state = this.getTodayReminders()
    return state.habitIds.includes(habitId)
  }

  private markReminderShown(habitId: string): void {
    const state = this.getTodayReminders()
    if (!state.habitIds.includes(habitId)) {
      state.habitIds.push(habitId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }

  private getTodayReminders(): ReminderState {
    const today = dayjs().format('YYYY-MM-DD')
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return { date: today, habitIds: [] }
    }

    try {
      const state = JSON.parse(stored) as ReminderState
      // Reset if it's a new day
      if (state.date !== today) {
        return { date: today, habitIds: [] }
      }
      return state
    } catch {
      return { date: today, habitIds: [] }
    }
  }

  private cleanupOldReminders(): void {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const state = JSON.parse(stored) as ReminderState
      const stateDate = dayjs(state.date)
      const today = dayjs()
      const daysDiff = today.diff(stateDate, 'day')

      if (daysDiff > CLEANUP_DAYS) {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

export const reminderService = new ReminderService()
