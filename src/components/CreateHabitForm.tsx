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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Habit Name with Autocomplete */}
      <div className="relative">
        <label htmlFor="habitName" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          What habit do you want to track? *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            id="habitName"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => habitName.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="block w-full rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white/80 dark:focus:bg-gray-800/80 transition-all shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50"
            placeholder="e.g., Morning meditation, Exercise, Read for 30 minutes..."
            disabled={isLoading}
          />
          {validationErrors.habitName && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationErrors.habitName}
            </p>
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
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          What type of habit is this? *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHabitType('build')}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg ${
              habitType === 'build'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 ring-2 ring-green-500 dark:ring-green-400 shadow-green-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:ring-green-300 dark:hover:ring-green-600 shadow-gray-200/50 dark:shadow-gray-900/50'
            }`}
            disabled={isLoading}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all ${
              habitType === 'build' 
                ? 'bg-green-500 dark:bg-green-400 shadow-lg shadow-green-500/50' 
                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900/30'
            }`}>
              <svg className={`w-7 h-7 ${habitType === 'build' ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-base font-semibold mb-1 ${habitType === 'build' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Build a Habit
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Create positive routines
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setHabitType('break')}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg ${
              habitType === 'break'
                ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 dark:from-red-500/30 dark:to-rose-500/30 ring-2 ring-red-500 dark:ring-red-400 shadow-red-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:ring-red-300 dark:hover:ring-red-600 shadow-gray-200/50 dark:shadow-gray-900/50'
            }`}
            disabled={isLoading}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all ${
              habitType === 'break' 
                ? 'bg-red-500 dark:bg-red-400 shadow-lg shadow-red-500/50' 
                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
            }`}>
              <svg className={`w-7 h-7 ${habitType === 'break' ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className={`text-base font-semibold mb-1 ${habitType === 'break' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Break a Habit
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Quit unwanted behaviors
            </span>
          </button>
        </div>
      </div>

      {/* Frequency Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          How often will you do this? *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFrequencyType('daily')}
            className={`flex items-center justify-center px-4 py-3 rounded-xl backdrop-blur-xl transition-all duration-200 ${
              frequencyType === 'daily'
                ? 'bg-blue-500 dark:bg-blue-600 text-white ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50'
            }`}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Every Day</span>
          </button>
          <button
            type="button"
            onClick={() => setFrequencyType('specific')}
            className={`flex items-center justify-center px-4 py-3 rounded-xl backdrop-blur-xl transition-all duration-200 ${
              frequencyType === 'specific'
                ? 'bg-blue-500 dark:bg-blue-600 text-white ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50'
            }`}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Specific Days</span>
          </button>
        </div>
      </div>

      {/* Specific Days Selection */}
      {frequencyType === 'specific' && (
        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-blue-200/50 dark:ring-blue-800/50">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Select Your Days
          </label>
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  selectedDays.includes(value)
                    ? 'bg-blue-500 dark:bg-blue-600 text-white ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 shadow-sm'
                }`}
              >
                <span className="text-[10px] mb-1 opacity-75">{label.slice(0, 3)}</span>
                <span>{label.charAt(0)}</span>
              </button>
            ))}
          </div>
          {validationErrors.frequency && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationErrors.frequency}
            </p>
          )}
        </div>
      )}

      {/* Duration & Reminder Time - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Duration Goal
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              max="365"
              className="block w-full rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl pl-12 pr-16 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white/80 dark:focus:bg-gray-800/80 transition-all shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">days</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Recommended: 21-66 days to form a habit
          </p>
        </div>

        {/* Reminder Time */}
        <div>
          <label htmlFor="reminderTime" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Daily Reminder <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <input
              type="time"
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="block w-full rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl pl-12 pr-4 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white/80 dark:focus:bg-gray-800/80 transition-all shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50"
              disabled={isLoading}
            />
          </div>
          {validationErrors.reminderTime && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationErrors.reminderTime}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Get notified to stay on track
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl p-4 ring-1 ring-red-200/50 dark:ring-red-800/50">
          <ErrorMessage error={error} />
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex items-center justify-center px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Habit...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Habit
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
