import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import dayjs from 'dayjs'
import { throttle } from '../utils/scrollOptimization'

interface InfiniteCalendarProps {
  selectedDate: string // YYYY-MM-DD
  onDateSelect: (date: string) => void
}

export interface InfiniteCalendarRef {
  scrollToToday: () => void
}

const ITEM_WIDTH = 72 // 64px + 8px gap
const VISIBLE_ITEMS = 7 // Show 7 items at once
const BUFFER_SIZE = 3 // Render 3 extra items on each side

export const InfiniteCalendar = forwardRef<InfiniteCalendarRef, InfiniteCalendarProps>(
  ({ selectedDate, onDateSelect }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  
  // Generate a large range of dates (optimized)
  const allDates = useMemo(() => {
    const today = dayjs()
    const dates: string[] = []
    
    // Generate 365 days (1 year) centered around today
    for (let i = -180; i <= 184; i++) {
      dates.push(today.add(i, 'day').format('YYYY-MM-DD'))
    }
    
    return dates
  }, [])
  
  // Calculate which items should be visible (virtual scrolling)
  const visibleItems = useMemo(() => {
    if (containerWidth === 0) return { startIndex: 0, endIndex: VISIBLE_ITEMS }
    
    const startIndex = Math.max(0, Math.floor(scrollLeft / ITEM_WIDTH) - BUFFER_SIZE)
    const endIndex = Math.min(
      allDates.length - 1,
      startIndex + VISIBLE_ITEMS + (BUFFER_SIZE * 2)
    )
    
    return { startIndex, endIndex }
  }, [scrollLeft, containerWidth, allDates.length])
  
  // Get visible dates for rendering
  const visibleDates = useMemo(() => {
    return allDates.slice(visibleItems.startIndex, visibleItems.endIndex + 1)
  }, [allDates, visibleItems])
  
  // Throttled scroll handler for better performance
  const handleScroll = useCallback(
    throttle(() => {
      if (scrollContainerRef.current) {
        setScrollLeft(scrollContainerRef.current.scrollLeft)
      }
    }, 16), // ~60fps
    []
  )
  
  // Function to scroll to a specific date (optimized)
  const scrollToDate = useCallback((date: string) => {
    const dateIndex = allDates.indexOf(date)
    if (dateIndex !== -1 && scrollContainerRef.current) {
      const scrollPosition = dateIndex * ITEM_WIDTH - (containerWidth / 2) + (ITEM_WIDTH / 2)
      
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'auto' // Use auto instead of smooth for better performance
      })
    }
  }, [allDates, containerWidth])
  
  // Function to scroll to today
  const scrollToToday = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD')
    scrollToDate(today)
  }, [scrollToDate])
  
  // Expose scrollToToday method to parent
  useImperativeHandle(ref, () => ({
    scrollToToday
  }))
  
  // Initialize container width and scroll to today
  useEffect(() => {
    const updateContainerWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth)
      }
    }
    
    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)
    
    // Scroll to today after a short delay
    const timer = setTimeout(scrollToToday, 100)
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth)
      clearTimeout(timer)
    }
  }, [scrollToToday])
  
  // Scroll to selected date when it changes
  useEffect(() => {
    if (selectedDate && containerWidth > 0) {
      const timer = setTimeout(() => scrollToDate(selectedDate), 50)
      return () => clearTimeout(timer)
    }
  }, [selectedDate, containerWidth, scrollToDate])
  
  const today = dayjs().format('YYYY-MM-DD')
  const totalWidth = allDates.length * ITEM_WIDTH
  
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-hide px-4 py-4"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          transform: 'translateZ(0)' // GPU acceleration
        }}
      >
        <div 
          className="relative flex gap-2"
          style={{ width: totalWidth }}
        >
          {visibleDates.map((date, index) => {
            const actualIndex = visibleItems.startIndex + index
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
                className={`absolute flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-colors ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-110'
                    : isToday
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={{
                  left: actualIndex * ITEM_WIDTH,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <span className="text-xs font-medium opacity-75">{dayName}</span>
                <span className="text-2xl font-bold">{dayNumber}</span>
                <span className="text-xs opacity-75">{monthName}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
