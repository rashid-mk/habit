import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import dayjs from 'dayjs'

interface InfiniteCalendarProps {
  selectedDate: string // YYYY-MM-DD
  onDateSelect: (date: string) => void
}

export interface InfiniteCalendarRef {
  scrollToToday: () => void
}

export const InfiniteCalendar = forwardRef<InfiniteCalendarRef, InfiniteCalendarProps>(
  ({ selectedDate, onDateSelect }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleDays, setVisibleDays] = useState<string[]>([])
  const lastScrolledDateRef = useRef<string>('')
  
  // Function to scroll to a specific date
  const scrollToDate = (date: string) => {
    const dateElement = document.getElementById(`day-${date}`)
    if (dateElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const elementLeft = dateElement.offsetLeft
      const elementWidth = dateElement.offsetWidth
      const containerWidth = container.offsetWidth
      
      // Calculate scroll position to center the element
      const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2)
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      lastScrolledDateRef.current = date
    }
  }
  
  // Function to scroll to today
  const scrollToToday = () => {
    const today = dayjs().format('YYYY-MM-DD')
    scrollToDate(today)
  }
  
  // Expose scrollToToday method to parent
  useImperativeHandle(ref, () => ({
    scrollToToday
  }))
  
  // Generate initial days (60 days before and after today)
  useEffect(() => {
    const today = dayjs()
    const days: string[] = []
    
    for (let i = -60; i <= 60; i++) {
      days.push(today.add(i, 'day').format('YYYY-MM-DD'))
    }
    
    setVisibleDays(days)
    
    // Reset the ref and scroll to today on mount
    lastScrolledDateRef.current = ''
    setTimeout(() => {
      scrollToToday()
    }, 100)
  }, [])
  
  // Scroll to selected date when it changes
  useEffect(() => {
    if (selectedDate && visibleDays.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        scrollToDate(selectedDate)
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [selectedDate, visibleDays.length])
  
  // Load more days when scrolling near edges
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    
    // Load more days at the start
    if (scrollLeft < 200) {
      const firstDay = dayjs(visibleDays[0])
      const newDays: string[] = []
      for (let i = 30; i > 0; i--) {
        newDays.push(firstDay.subtract(i, 'day').format('YYYY-MM-DD'))
      }
      setVisibleDays([...newDays, ...visibleDays])
    }
    
    // Load more days at the end
    if (scrollLeft + clientWidth > scrollWidth - 200) {
      const lastDay = dayjs(visibleDays[visibleDays.length - 1])
      const newDays: string[] = []
      for (let i = 1; i <= 30; i++) {
        newDays.push(lastDay.add(i, 'day').format('YYYY-MM-DD'))
      }
      setVisibleDays([...visibleDays, ...newDays])
    }
  }
  
  const today = dayjs().format('YYYY-MM-DD')
  
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide px-4 py-4 gap-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleDays.map((date) => {
          const day = dayjs(date)
          const isSelected = date === selectedDate
          const isToday = date === today
          const dayName = day.format('ddd')
          const dayNumber = day.format('D')
          const monthName = day.format('MMM')
          
          return (
            <button
              key={date}
              id={`day-${date}`}
              onClick={() => onDateSelect(date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-110'
                  : isToday
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-xs font-medium opacity-75">{dayName}</span>
              <span className="text-2xl font-bold">{dayNumber}</span>
              <span className="text-xs opacity-75">{monthName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
})
