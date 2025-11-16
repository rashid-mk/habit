// @ts-nocheck
import { useState, FormEvent, useRef, useEffect } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { getHabitSuggestions, isBreakHabit } from '../data/habitSuggestions'

interface CreateHabitFormProps {
  onSubmit: (habitData: HabitFormData) => Promise<void>
  isLoading?: boolean
  error?: unknown | null
}

export interface HabitFormData {
  habitName: string
  habitType: 'build' | 'break'
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

export function CreateHabitForm({ onSubmit, isLoading = false, error = null }: CreateHabitFormProps) {
  const [habitName, setHabitName] = useState('')
  const [habitType, setHabitType] = useState<'build' | 'break'>('build')
  const [frequencyType, setFrequencyType] = useState<'daily' | 'specific'>('daily')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [duration, setDuration] = useState(30)
  const [reminderTime, setReminderTime] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (habitName.length >= 2) {
      const newSuggestions = getHabitSuggestions(habitName)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedSuggestionIndex(-1)
  }, [habitName])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate habit name (1-100 characters)
    if (!habitName.trim()) {
      errors.habitName = 'Habit name is required'
    } else if (habitName.length < 1 || habitName.length > 100) {
      errors.habitName = 'Habit name must be between 1 and 100 characters'
    }

    // Validate frequency
    if (frequencyType === 'specific' && selectedDays.length === 0) {
      errors.frequency = 'Please select at least one day'
    }

    // Validate reminder time format (HH:MM)
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

  const handleSuggestionClick = (suggestion: string) => {
    setHabitName(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Auto-detect habit type based on suggestion
    if (isBreakHabit(suggestion)) {
      setHabitType('break')
    } else {
      setHabitType('build')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[selectedSuggestionIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Habit Name with Autocomplete */}
      <div className="relative">
        <label htmlFor="habitName" className="block text-sm font-medium text-gray-700 mb-2">
          Habit Name *
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id="habitName"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => habitName.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="block w-full rounded-xl border-0 bg-gray-50/50 backdrop-blur-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white/60 transition-all placeholder-gray-400"
            placeholder="e.g., Morning meditation, Exercise..."
            disabled={isLoading}
          />
          {validationErrors.habitName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.habitName}</p>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Suggested Habits
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSuggestionClick(suggestion)
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors flex items-center space-x-3 ${
                    index === selectedSuggestionIndex ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 ${isBreakHabit(suggestion) ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isBreakHabit(suggestion) ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Habit Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Habit Type *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHabitType('build')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              habitType === 'build'
                ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
            }`}
            disabled={isLoading}
          >
            <svg className={`w-8 h-8 mb-2 ${habitType === 'build' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className={`text-sm font-medium ${habitType === 'build' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Build a Habit
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Track positive habits
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setHabitType('break')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              habitType === 'break'
                ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
            }`}
            disabled={isLoading}
          >
            <svg className={`w-8 h-8 mb-2 ${habitType === 'break' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className={`text-sm font-medium ${habitType === 'break' ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
              Break a Habit
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Track habits to quit
            </span>
          </button>
        </div>
      </div>

      {/* Frequency Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Frequency *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="daily"
              checked={frequencyType === 'daily'}
              onChange={() => setFrequencyType('daily')}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Daily</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="specific"
              checked={frequencyType === 'specific'}
              onChange={() => setFrequencyType('specific')}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Specific days</span>
          </label>
        </div>
      </div>

      {/* Specific Days Selection */}
      <>
        {frequencyType === 'specific' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedDays.includes(value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {validationErrors.frequency && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.frequency}</p>
            )}
          </div>
        )}
      </>

      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
          Duration (days)
        </label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          min="1"
          max="365"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">Default: 30 days</p>
      </div>

      {/* Reminder Time */}
      <div>
        <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700">
          Reminder Time (optional)
        </label>
        <input
          type="time"
          id="reminderTime"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          disabled={isLoading}
        />
        {validationErrors.reminderTime && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.reminderTime}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">Set a daily reminder for this habit</p>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage error={error} />}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Habit'}
        </button>
      </div>
    </form>
  )
}
