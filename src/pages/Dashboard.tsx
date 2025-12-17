import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHabits } from '../hooks/useHabits'
import { HabitCard } from '../components/HabitCard'
import { ErrorMessage } from '../components/ErrorMessage'
import { SkeletonCard } from '../components/SkeletonCard'
import { InfiniteCalendar, InfiniteCalendarRef } from '../components/InfiniteCalendar'
import { Navigation } from '../components/Navigation'
import { useViewSettings } from '../contexts/ViewSettingsContext'
import { useDashboard } from '../contexts/DashboardContext'
import dayjs from 'dayjs'

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: habits, isLoading, error, refetch } = useHabits()
  const { viewType } = useViewSettings()
  const { setHasHabitsForSelectedDate } = useDashboard()
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const calendarRef = useRef<InfiniteCalendarRef>(null)
  
  // Reset to today whenever we navigate to dashboard
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    setSelectedDate(today)
    // Calendar will auto-scroll via selectedDate prop change
  }, [location.pathname]) // Runs when pathname changes (navigating to dashboard)
  
  // Filter habits for the selected date
  const habitsForSelectedDate = useMemo(() => {
    if (!habits) return []
    
    const selectedDay = dayjs(selectedDate)
    const selectedDayName = selectedDay.format('dddd').toLowerCase()
    
    return habits.filter(habit => {
      // Check if habit has started
      const habitStartDate = dayjs(habit.startDate.toDate())
      if (selectedDay.isBefore(habitStartDate, 'day')) {
        return false
      }
      
      // Check if habit has ended
      if (habit.endConditionType === 'on_date' && habit.endConditionValue) {
        const endDate = dayjs(habit.endConditionValue as string)
        if (selectedDay.isAfter(endDate, 'day')) {
          return false
        }
      }
      
      // Check frequency
      if (habit.frequency === 'daily') return true
      
      if (Array.isArray(habit.frequency)) {
        return habit.frequency.some(day => day.toLowerCase() === selectedDayName)
      }
      
      return false
    })
  }, [habits, selectedDate])
  
  // Update context when habits for selected date changes
  useEffect(() => {
    setHasHabitsForSelectedDate(habitsForSelectedDate.length > 0)
  }, [habitsForSelectedDate.length, setHasHabitsForSelectedDate])
  
  const selectedDayFormatted = dayjs(selectedDate).format('MMMM D, YYYY')
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      {/* Infinite Calendar */}
      <InfiniteCalendar 
        ref={calendarRef}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Selected Date Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isToday ? 'Today' : selectedDayFormatted}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {habitsForSelectedDate.length} {habitsForSelectedDate.length === 1 ? 'habit' : 'habits'} active
            </p>
          </div>
          
          {/* Back to Today Button */}
          {!isToday && (
            <button
              onClick={() => {
                setSelectedDate(dayjs().format('YYYY-MM-DD'))
                calendarRef.current?.scrollToToday()
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-md hover:shadow-lg"
              aria-label="Go to today"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Today</span>
            </button>
          )}
        </div>
        
        {/* Error State */}
        {error && (
          <ErrorMessage error={error} onRetry={refetch} />
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className={viewType === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-col gap-3"
          }>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        
        {/* Habits List */}
        {!isLoading && !error && (
          <>
            {habitsForSelectedDate.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No habits for this day
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isToday 
                    ? "You don't have any habits scheduled for today."
                    : `No habits are scheduled for ${selectedDayFormatted}.`
                  }
                </p>
                <button
                  onClick={() => navigate('/habits/create')}
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Habit
                </button>
              </div>
            ) : (
              <div className={viewType === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3 max-w-4xl mx-auto w-full"
              }>
                {habitsForSelectedDate.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    selectedDate={selectedDate}
                    onClick={() => navigate(`/habits/${habit.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
