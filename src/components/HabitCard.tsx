import { useState, useRef, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Habit, useCheckIn, useUndoCheckIn, useHabitChecks, useDeleteHabit, useUpdateProgress } from '../hooks/useHabits'
import dayjs from 'dayjs'
import { HabitContextMenu } from './HabitContextMenu'
import { CheckInModal } from './CheckInModal'
import { useCelebration } from '../contexts/CelebrationContext'
import { useDateRestriction } from '../contexts/DateRestrictionContext'

interface HabitCardProps {
  habit: Habit
  onClick: () => void
  selectedDate?: string
}

export const HabitCard = memo(function HabitCard({ habit, onClick, selectedDate }: HabitCardProps) {
  const navigate = useNavigate()
  const checkInMutation = useCheckIn()
  const undoCheckInMutation = useUndoCheckIn()
  const updateProgressMutation = useUpdateProgress()
  const deleteHabitMutation = useDeleteHabit()
  const { triggerCelebration } = useCelebration()
  const { dateRestrictionEnabled } = useDateRestriction()
  
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartPosRef = useRef({ x: 0, y: 0 })
  
  const isBreakHabit = habit.habitType === 'break'
  const today = selectedDate || dayjs().format('YYYY-MM-DD')
  const currentDate = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  
  // Check if the selected date is editable based on user settings
  const isEditableDate = dateRestrictionEnabled 
    ? (today === yesterday || today === currentDate || today === tomorrow)
    : true // If restriction is disabled, all dates are editable
  
  const { data: todayChecks } = useHabitChecks({
    habitId: habit.id,
    startDate: today,
    endDate: today,
  })
  
  const todayCheck = todayChecks?.[0]
  const serverStatus: 'done' | 'not_done' | null = todayCheck 
    ? (todayCheck.status || 'done') 
    : null
  
  // Local state for instant UI updates
  const [localProgressValue, setLocalProgressValue] = useState<number | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<'done' | 'not_done' | null | undefined>(undefined)
  const [lastDate, setLastDate] = useState(today)
  
  // Reset local state when date changes
  if (lastDate !== today) {
    setLocalProgressValue(null)
    setOptimisticStatus(undefined)
    setLastDate(today)
  }
  
  // Use local state if available, otherwise use server data
  const currentProgressValue = localProgressValue !== null ? localProgressValue : (todayCheck?.progressValue || 0)
  const todayStatus = optimisticStatus !== undefined ? optimisticStatus : serverStatus
  const isCompleted = todayStatus === 'done'

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Prevent editing dates outside the allowed range
    if (!isEditableDate) {
      alert('You can only check in for yesterday, today, or tomorrow.')
      return
    }
    
    const trackingType = habit.trackingType || 'simple'
    
    // For time habits, always open modal
    if (trackingType === 'time') {
      setShowCheckInModal(true)
      return
    }
    
    // For count habits, increment by 1 on tap
    if (trackingType === 'count') {
      const currentProgress = currentProgressValue
      const newProgress = currentProgress + 1
      const targetValue = habit.targetValue || 1
      
      // INSTANT UPDATE: Update local state immediately
      setLocalProgressValue(newProgress)
      
      // Trigger celebration if reaching target
      if (newProgress >= targetValue && currentProgress < targetValue) {
        triggerCelebration()
      }
      
      // Sync to server in background (don't await)
      updateProgressMutation.mutateAsync({ 
        habitId: habit.id, 
        date: today, 
        progressValue: newProgress 
      }).catch((error) => {
        // On error, revert to server value
        console.error('Failed to update progress:', error)
        setLocalProgressValue(null)
      })
      
      return
    }
    
    // For simple habits, toggle completion
    if (isCompleted) {
      // Unmark as done - instant update
      setOptimisticStatus(null)
      undoCheckInMutation.mutateAsync({ habitId: habit.id, date: today }).catch(() => {
        setOptimisticStatus(undefined)
      })
    } else {
      // Mark as done - instant update
      triggerCelebration()
      setOptimisticStatus('done')
      checkInMutation.mutateAsync({ habitId: habit.id, date: today }).catch(() => {
        setOptimisticStatus(undefined)
      })
    }
  }

  const handleModalSave = async (newProgress: number) => {
    const targetValue = habit.targetValue || 1
    const currentProgress = currentProgressValue
    
    // INSTANT UPDATE: Update local state immediately
    setLocalProgressValue(newProgress)
    
    // Trigger celebration if reaching target
    if (newProgress >= targetValue && currentProgress < targetValue) {
      triggerCelebration()
    }
    
    // Sync to server in background
    updateProgressMutation.mutateAsync({ 
      habitId: habit.id, 
      date: today, 
      progressValue: newProgress 
    }).catch((error) => {
      console.error('Failed to update progress:', error)
      setLocalProgressValue(null)
    })
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }
    
    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      setContextMenuPosition({
        x: touch.clientX,
        y: touch.clientY,
      })
      setShowContextMenu(true)
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const moveThreshold = 10
    
    if (
      Math.abs(touch.clientX - touchStartPosRef.current.x) > moveThreshold ||
      Math.abs(touch.clientY - touchStartPosRef.current.y) > moveThreshold
    ) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleEdit = useCallback(() => {
    navigate(`/habits/${habit.id}/edit`)
  }, [navigate, habit.id])

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Are you sure you want to delete "${habit.habitName}"? This action cannot be undone.`)) {
      try {
        await deleteHabitMutation.mutateAsync(habit.id)
      } catch (error) {
        console.error('Failed to delete habit:', error)
        alert('Failed to delete habit. Please try again.')
      }
    }
  }, [habit.id, habit.habitName, deleteHabitMutation])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
    })
    setShowContextMenu(true)
  }, [])

  // Get first letter or emoji for icon
  const getIcon = () => {
    const firstChar = habit.habitName.charAt(0)
    // Check if it's an emoji
    const emojiRegex = /[\p{Emoji}]/u
    if (emojiRegex.test(firstChar)) {
      return firstChar
    }
    return firstChar.toUpperCase()
  }

  // Get background color based on habit type and color
  const getIconBg = () => {
    if (habit.color) {
      return habit.color
    }
    return isBreakHabit ? '#8B5CF6' : '#10B981' // purple for break, green for build
  }

  // Get tracking type icon or count number
  const getTrackingTypeIcon = () => {
    const trackingType = habit.trackingType || 'simple'
    const iconClass = "w-4 h-4"
    
    switch (trackingType) {
      case 'count':
        // Show the current count number (use local state)
        return (
          <span className="text-xs font-bold">{currentProgressValue}</span>
        )
      case 'time':
        // Show the current time value
        const unit = habit.targetUnit || 'minutes'
        if (unit === 'hours') {
          const hours = Math.floor(currentProgressValue / 60)
          const mins = currentProgressValue % 60
          return (
            <span className="text-[10px] font-bold leading-tight">
              {hours}h{mins > 0 ? `${mins}m` : ''}
            </span>
          )
        }
        return (
          <span className="text-[10px] font-bold">{currentProgressValue}m</span>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )
    }
  }

  // Get progress display for count/time habits
  const getProgressDisplay = () => {
    const trackingType = habit.trackingType || 'simple'
    
    if (trackingType === 'simple') {
      return isCompleted ? (isBreakHabit ? 'Resisted' : 'Completed') : 'Not completed'
    }
    
    const progressValue = currentProgressValue
    const targetValue = habit.targetValue || 0
    
    if (trackingType === 'count') {
      return `${progressValue}/${targetValue} times`
    }
    
    if (trackingType === 'time') {
      const unit = habit.targetUnit || 'minutes'
      if (unit === 'hours') {
        const progressHours = Math.floor(progressValue / 60)
        const targetHours = Math.floor(targetValue / 60)
        return `${progressHours}/${targetHours} hrs`
      }
      return `${progressValue}/${targetValue} min`
    }
    
    return 'Not completed'
  }

  // Calculate progress percentage for progress bar
  const getProgressPercentage = () => {
    const trackingType = habit.trackingType || 'simple'
    if (trackingType === 'simple') {
      return isCompleted ? 100 : 0
    }
    
    const progressValue = currentProgressValue
    const targetValue = habit.targetValue || 1
    return Math.min((progressValue / targetValue) * 100, 100)
  }

  const progressPercentage = getProgressPercentage()

  return (
    <>
      <div
        className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
          isBreakHabit
            ? 'bg-gray-800/40 dark:bg-gray-800/60 hover:bg-gray-800/60 dark:hover:bg-gray-800/80'
            : 'bg-gray-800/40 dark:bg-gray-800/60 hover:bg-gray-800/60 dark:hover:bg-gray-800/80'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={onClick}
      >
        {/* Tracking Type Icon Badge - Only show for count/time habits */}
        {(habit.trackingType === 'count' || habit.trackingType === 'time') && (
          <div 
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-700/80 dark:bg-gray-600/80 flex items-center justify-center text-gray-300"
            aria-label={`${habit.trackingType} tracking type`}
          >
            {getTrackingTypeIcon()}
          </div>
        )}

        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
          style={{ backgroundColor: getIconBg() }}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate mb-1">
            {habit.habitName}
          </h3>
          
          {/* Progress Display - Different for count/time vs simple */}
          {(habit.trackingType === 'count' || habit.trackingType === 'time') ? (
            <>
              <p className="text-base font-medium text-gray-300 mb-2">
                {getProgressDisplay()}
              </p>
              {/* Progress Bar for count/time habits */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercentage >= 100
                      ? 'bg-green-500'
                      : progressPercentage > 0
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              {getProgressDisplay()}
            </p>
          )}
        </div>

        {/* Check/Plus Button */}
        <button
          onClick={handleToggle}
          disabled={!isEditableDate}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            !isEditableDate
              ? 'border-2 border-gray-700 opacity-40 cursor-not-allowed'
              : habit.trackingType === 'count'
              ? progressPercentage >= 100
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
              : isCompleted
              ? 'bg-green-500 hover:bg-green-600'
              : 'border-2 border-gray-600 hover:border-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={
            !isEditableDate
              ? 'Cannot edit this date'
              : habit.trackingType === 'count'
              ? 'Add count'
              : isCompleted
              ? 'Mark as not done'
              : 'Mark as done'
          }
          title={!isEditableDate ? 'Can only check in for yesterday, today, or tomorrow' : undefined}
        >
          {/* For count habits, always show plus icon */}
          {habit.trackingType === 'count' && isEditableDate && (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          )}
          
          {/* For simple/time habits, show checkmark when completed */}
          {habit.trackingType !== 'count' && isCompleted && isEditableDate && (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {habit.trackingType !== 'count' && isCompleted && !isEditableDate && (
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          
          {/* Lock icon for non-editable dates */}
          {!isEditableDate && habit.trackingType !== 'count' && !isCompleted && (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          {!isEditableDate && habit.trackingType === 'count' && (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
      </div>

      <HabitContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        position={contextMenuPosition}
      />

      <CheckInModal
        isOpen={showCheckInModal}
        habit={habit}
        currentProgress={todayCheck?.progressValue || 0}
        onSave={handleModalSave}
        onClose={() => setShowCheckInModal(false)}
      />
    </>
  )
})
