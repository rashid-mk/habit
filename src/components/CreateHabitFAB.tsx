import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HabitTypeModal } from './HabitTypeModal'
import { useDashboard } from '../contexts/DashboardContext'

export function CreateHabitFAB() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasHabitsForSelectedDate } = useDashboard()
  const [showModal, setShowModal] = useState(false)
  
  // Hide FAB on mobile devices (MobileBottomNav handles it)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Only show on dashboard page
  const isOnDashboard = location.pathname === '/dashboard'
  
  // Hide FAB when on dashboard with no habits for selected date (Dashboard shows centered button)
  const shouldHideFAB = !hasHabitsForSelectedDate
  
  // Don't render on mobile, not on dashboard, or when should be hidden
  if (isMobile || !isOnDashboard || shouldHideFAB) {
    return null
  }
  
  const handleClick = () => {
    setShowModal(true)
  }
  
  const handleSelectType = (type: 'build' | 'break') => {
    navigate('/habits/create', { state: { habitType: type } })
  }
  
  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 flex items-center gap-3 group font-bold text-lg hover:scale-105 active:scale-95"
        title="Create New Habit"
        aria-label="Create New Habit"
      >
        <svg 
          className="w-7 h-7 transition-transform group-hover:rotate-90 duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
        <span>New Habit</span>
      </button>
      
      <HabitTypeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectType={handleSelectType}
      />
    </>
  )
}
