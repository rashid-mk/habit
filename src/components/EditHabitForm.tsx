// @ts-nocheck
import { useState, FormEvent, useEffect } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { Habit } from '../hooks/useHabits'
import dayjs from 'dayjs'

interface EditHabitFormProps {
  habit: Habit
  onSubmit: (habitData: HabitFormData) => Promise<void>
  isLoading?: boolean
  error?: unknown | null
}

export interface HabitFormData {
  habitName: string
  habitType: 'build' | 'break'
  color?: string
  frequency: 'daily' | string[]
  duration: number
  reminderTime?: string
}

const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

const HABIT_COLORS = [
  { name: 'Blue', value: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Pink', value: '#ec4899', gradient: 'from-pink-500 to-pink-600' },
  { name: 'Red', value: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { name: 'Orange', value: '#f97316', gradient: 'from-orange-500 to-orange-600' },
  { name: 'Yellow', value: '#eab308', gradient: 'from-yellow-500 to-yellow-600' },
  { name: 'Green', value: '#10b981', gradient: 'from-green-500 to-green-600' },
  { name: 'Teal', value: '#14b8a6', gradient: 'from-teal-500 to-teal-600' },
  { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-500 to-cyan-600' },
  { name: 'Indigo', value: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
]

export function EditHabitForm({ habit, onSubmit, isLoading = false, error = null }: EditHabitFormProps) {
  const [habitName, setHabitName] = useState(habit.habitName)
  const [habitType, setHabitType] = useState<'build' | 'break'>(habit.habitType || 'build')
  const [color, setColor] = useState(habit.color || HABIT_COLORS[0].value)
  const [frequencyType, setFrequencyType] = useState<'daily' | 'specific'>(
    habit.frequency === 'daily' ? 'daily' : 'specific'
  )
  const [selectedDays, setSelectedDays] = useState<string[]>(
    Array.isArray(habit.frequency) ? habit.frequency : []
  )
  const [duration, setDuration] = useState(habit.duration)
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!habitName.trim()) {
      errors.habitName = 'Habit name is required'
    } else if (habitName.length < 1 || habitName.length > 100) {
      errors.habitName = 'Habit name must be between 1 and 100 characters'
    }

    if (frequencyType === 'specific' && selectedDays.length === 0) {
      errors.frequency = 'Please select at least one day'
    }

    if (reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      errors.reminderTime = 'Invalid time format (use HH:MM)'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const frequency = frequencyType === 'daily' ? 'daily' : selectedDays
    const habitData: HabitFormData = {
      habitName: habitName.trim(),
      habitType,
      color,
      frequency,
      duration,
      reminderTime: reminderTime || undefined,
    }

    await onSubmit(habitData)
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-8 shadow-xl">
      {/* Habit Name */}
      <div>
        <label htmlFor="habitName" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Habit Name *
        </label>
        <input
          type="text"
          id="habitName"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          className="block w-full rounded-xl border-0 bg-white/80 dark:bg-gray-700/80 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
          disabled={isLoading}
        />
        {validationErrors.habitName && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.habitName}</p>
        )}
      </div>

      {/* Habit Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Habit Type *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHabitType('build')}
            className={`p-4 rounded-xl transition-all ${
              habitType === 'build'
                ? 'bg-green-500 text-white ring-2 ring-green-500'
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300'
            }`}
            disabled={isLoading}
          >
            Build a Habit
          </button>
          <button
            type="button"
            onClick={() => setHabitType('break')}
            className={`p-4 rounded-xl transition-all ${
              habitType === 'break'
                ? 'bg-red-500 text-white ring-2 ring-red-500'
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300'
            }`}
            disabled={isLoading}
          >
            Break a Habit
          </button>
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Color
        </label>
        <div className="grid grid-cols-10 gap-2">
          {HABIT_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => setColor(colorOption.value)}
              className={`aspect-square rounded-lg transition-all ${
                color === colorOption.value ? 'ring-2 ring-offset-2 scale-110' : ''
              }`}
              style={{ 
                backgroundColor: colorOption.value,
                ringColor: color === colorOption.value ? colorOption.value : 'transparent'
              }}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Frequency *
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setFrequencyType('daily')}
            className={`px-4 py-3 rounded-xl transition-all ${
              frequencyType === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300'
            }`}
            disabled={isLoading}
          >
            Every Day
          </button>
          <button
            type="button"
            onClick={() => setFrequencyType('specific')}
            className={`px-4 py-3 rounded-xl transition-all ${
              frequencyType === 'specific'
                ? 'bg-blue-500 text-white'
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300'
            }`}
            disabled={isLoading}
          >
            Specific Days
          </button>
        </div>

        {frequencyType === 'specific' && (
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                disabled={isLoading}
                className={`p-3 rounded-xl text-xs font-semibold transition-all ${
                  selectedDays.includes(value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400'
                }`}
              >
                {label.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
        {validationErrors.frequency && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.frequency}</p>
        )}
      </div>

      {/* Duration & Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Duration (days)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1"
            max="365"
            className="block w-full rounded-xl border-0 bg-white/80 dark:bg-gray-700/80 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="reminderTime" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Reminder Time
          </label>
          <input
            type="time"
            id="reminderTime"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="block w-full rounded-xl border-0 bg-white/80 dark:bg-gray-700/80 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
          <ErrorMessage error={error} />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
