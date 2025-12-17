import { useState, lazy, Suspense, useMemo, useCallback, useEffect, useRef } from 'react'
import { Habit, CheckIn } from '../hooks/useHabits'
import { usePremiumAccess } from '../hooks/usePremiumAccess'
import { usePremiumAnalytics } from '../hooks/usePremiumAnalytics'
import { useOfflineAnalytics } from '../hooks/useOfflineAnalytics'
import { premiumAnalyticsCalculator } from '../services/PremiumAnalyticsCalculator'
import { insightGenerator } from '../services/InsightGenerator'
import { Timestamp } from 'firebase/firestore'
import { AnalyticsData } from '../types/analytics'
import { 
  announceToScreenReader, 
  createKeyboardHandler, 
  screenReaderUtils
} from '../utils/accessibility'
import { Tooltip } from './Tooltip'
import { OnboardingHints, premiumAnalyticsHints } from './OnboardingHints'
import { UserJourneyTest } from './UserJourneyTest'

// Lazy load analytics components for better performance
const TrendAnalysis = lazy(() => import('./TrendAnalysis').then(m => ({ default: m.TrendAnalysis })))
const DayOfWeekStats = lazy(() => import('./DayOfWeekStats').then(m => ({ default: m.DayOfWeekStats })))
const TimeOfDayDistribution = lazy(() => import('./TimeOfDayDistribution').then(m => ({ default: m.TimeOfDayDistribution })))
const MonthComparison = lazy(() => import('./MonthComparison').then(m => ({ default: m.MonthComparison })))
const InsightList = lazy(() => import('./InsightList').then(m => ({ default: m.InsightList })))
const DetailedBreakdownView = lazy(() => import('./DetailedBreakdownView').then(m => ({ default: m.DetailedBreakdownView })))
const ExportModal = lazy(() => import('./ExportModal').then(m => ({ default: m.ExportModal })))

// Access Control Components
import { PremiumBlurOverlay } from './PremiumBlurOverlay'
import { UpgradePrompt } from './UpgradePrompt'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { CacheStatusBadge } from './OfflineIndicator'
import { AnalyticsSkeleton } from './AnalyticsSkeleton'
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary'
import { InsufficientDataMessage } from './InsufficientDataMessage'
import { MobileBottomSheet } from './MobileBottomSheet'
import { useAnalyticsErrorHandler, useInsufficientDataHandler } from '../hooks/useAnalyticsErrorHandler'

interface AnalyticsDashboardProps {
  habit: Habit
  completions: CheckIn[]
  className?: string
}

type AnalyticsSection = 'trends' | 'performance' | 'insights' | 'breakdown' | 'export'

export function AnalyticsDashboard({ habit, completions, className = '' }: AnalyticsDashboardProps) {
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess()
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = usePremiumAnalytics(habit.id)
  const { isOnline, isAnalyticsCached } = useOfflineAnalytics()
  
  const [activeSection, setActiveSection] = useState<AnalyticsSection>('trends')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [focusedSectionIndex, setFocusedSectionIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [isSwipeNavigation, setIsSwipeNavigation] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [showUserJourneyTest, setShowUserJourneyTest] = useState(false)
  
  // Refs for accessibility and mobile interactions
  const sectionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const liveRegionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Error handling hooks
  const errorHandler = useAnalyticsErrorHandler({
    onError: (error) => {
      console.error('Analytics dashboard error:', error)
    }
  })

  const insufficientDataHandler = useInsufficientDataHandler()

  // Progressive loading: Calculate analytics data incrementally with error handling
  const calculatedAnalytics = useMemo(() => {
    if (analyticsData) return analyticsData
    
    return errorHandler.wrapCalculation(() => {
      // For large datasets, only calculate basic metrics initially
      if (completions.length > 500) {
        // Use only recent data for initial display (progressive loading)
        const recentCompletions = completions.slice(0, 100)
        return calculateBasicAnalytics(recentCompletions, habit)
      }
      
      return calculateFullAnalytics(completions, habit)
    }, 'analytics calculation')
  }, [analyticsData, completions, habit])

  // Memoized calculation functions for performance
  const calculateBasicAnalytics = useCallback((completions: CheckIn[], habit: Habit): AnalyticsData | null => {
    try {
      // Only calculate essential metrics for progressive loading
      const trends = {
        fourWeeks: premiumAnalyticsCalculator.calculateTrend(completions, '4W'),
        threeMonths: { period: '3M' as const, completionRate: 0, percentageChange: 0, direction: 'stable' as const, dataPoints: [] },
        sixMonths: { period: '6M' as const, completionRate: 0, percentageChange: 0, direction: 'stable' as const, dataPoints: [] },
        oneYear: { period: '1Y' as const, completionRate: 0, percentageChange: 0, direction: 'stable' as const, dataPoints: [] }
      }
      
      return {
        habitId: habit.id,
        userId: '',
        calculatedAt: Timestamp.now(),
        trends,
        dayOfWeekStats: { monday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, tuesday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, wednesday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, thursday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, friday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, saturday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, sunday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, bestDay: 'monday', worstDay: 'monday' },
        timeOfDayDistribution: { hourlyDistribution: {}, peakHours: [], optimalReminderTimes: [] },
        monthComparison: { currentMonth: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, previousMonth: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }, percentageChange: 0, isSignificant: false },
        insights: [],
        dataPointCount: completions.length,
        oldestDataPoint: completions.length > 0 ? Timestamp.fromDate(new Date(completions[0].dateKey)) : Timestamp.now(),
        newestDataPoint: completions.length > 0 ? Timestamp.fromDate(new Date(completions[completions.length - 1].dateKey)) : Timestamp.now()
      } as AnalyticsData
    } catch (error) {
      console.error('Error calculating basic analytics:', error)
      return null
    }
  }, [])

  const calculateFullAnalytics = useCallback((completions: CheckIn[], habit: Habit): AnalyticsData | null => {
    try {
      const trends = {
        fourWeeks: premiumAnalyticsCalculator.calculateTrend(completions, '4W'),
        threeMonths: premiumAnalyticsCalculator.calculateTrend(completions, '3M'),
        sixMonths: premiumAnalyticsCalculator.calculateTrend(completions, '6M'),
        oneYear: premiumAnalyticsCalculator.calculateTrend(completions, '1Y')
      }
      
      const dayOfWeekStats = premiumAnalyticsCalculator.calculateDayOfWeekStats(completions)
      const timeOfDayDistribution = premiumAnalyticsCalculator.calculateTimeOfDayDistribution(completions)
      
      const currentMonthCompletions = completions.filter(c => {
        const date = new Date(c.dateKey)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      
      const previousMonthCompletions = completions.filter(c => {
        const date = new Date(c.dateKey)
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
      })
      
      const monthComparison = premiumAnalyticsCalculator.calculateMonthComparison(
        currentMonthCompletions,
        previousMonthCompletions
      )
      
      const insights = insightGenerator.generateInsights(completions, dayOfWeekStats, timeOfDayDistribution)
      
      return {
        habitId: habit.id,
        userId: '',
        calculatedAt: Timestamp.now(),
        trends,
        dayOfWeekStats,
        timeOfDayDistribution,
        monthComparison,
        insights,
        dataPointCount: completions.length,
        oldestDataPoint: completions.length > 0 ? Timestamp.fromDate(new Date(completions[0].dateKey)) : Timestamp.now(),
        newestDataPoint: completions.length > 0 ? Timestamp.fromDate(new Date(completions[completions.length - 1].dateKey)) : Timestamp.now()
      } as AnalyticsData
    } catch (error) {
      console.error('Error calculating full analytics:', error)
      return null
    }
  }, [])

  // Mobile detection and responsive behavior with enhanced touch support
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768
      setIsMobile(newIsMobile)
      
      // Announce screen size changes to screen readers
      if (newIsMobile !== isMobile) {
        announceToScreenReader(`Switched to ${newIsMobile ? 'mobile' : 'desktop'} view`)
      }
    }
    
    // Add passive event listener for better performance
    window.addEventListener('resize', handleResize, { passive: true })
    
    // Initial check
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  // Check if user should see onboarding
  useEffect(() => {
    if (isPremium && !hasSeenOnboarding) {
      const hasSeenKey = `analytics-onboarding-${habit.id}`
      const hasSeen = localStorage.getItem(hasSeenKey) === 'true'
      setHasSeenOnboarding(hasSeen)
      
      // Show onboarding after a short delay for first-time premium users
      if (!hasSeen && calculatedAnalytics) {
        setTimeout(() => setShowOnboarding(true), 1000)
      }
    }
  }, [isPremium, hasSeenOnboarding, habit.id, calculatedAnalytics])

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
    localStorage.setItem(`analytics-onboarding-${habit.id}`, 'true')
  }, [habit.id])

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
    localStorage.setItem(`analytics-onboarding-${habit.id}`, 'true')
  }, [habit.id])

  // Accessibility: Create live region for announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      liveRegionRef.current = screenReaderUtils.createLiveRegion('analytics-announcements', 'polite')
    }
    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  // Memoized handlers for performance
  const handleSectionClick = useCallback((section: AnalyticsSection, sectionIndex?: number) => {
    if (!isPremium) {
      setShowUpgradePrompt(true)
      announceToScreenReader('Premium subscription required to access this feature')
      return
    }
    
    const previousSection = activeSection
    setActiveSection(section)
    
    if (sectionIndex !== undefined) {
      setFocusedSectionIndex(sectionIndex)
    }
    
    // Announce section change to screen readers
    const sectionNames = {
      trends: 'Trends and Patterns',
      performance: 'Performance Analysis', 
      insights: 'Predictive Insights',
      breakdown: 'Detailed Breakdowns',
      export: 'Export Options'
    }
    
    if (previousSection !== section) {
      announceToScreenReader(`Switched to ${sectionNames[section]} section`)
    }
  }, [isPremium, activeSection])

  const handleExportClick = useCallback(() => {
    if (!isPremium) {
      setShowUpgradePrompt(true)
      announceToScreenReader('Premium subscription required to export data')
      return
    }
    setShowExportModal(true)
    announceToScreenReader('Export modal opened')
  }, [isPremium])

  // Swipe navigation for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isPremium) return
    
    const touch = e.touches[0]
    setTouchStartX(touch.clientX)
    setTouchStartY(touch.clientY)
    setIsSwipeNavigation(false)
  }, [isMobile, isPremium])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY || !isMobile) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    
    // Determine if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      setIsSwipeNavigation(true)
      e.preventDefault() // Prevent scrolling during swipe
    }
  }, [touchStartX, touchStartY, isMobile])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY || !isMobile || !isSwipeNavigation) {
      setTouchStartX(null)
      setTouchStartY(null)
      setIsSwipeNavigation(false)
      return
    }
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartX
    const sections = ['trends', 'performance', 'insights', 'breakdown', 'export'] as AnalyticsSection[]
    const currentIndex = sections.indexOf(activeSection)
    
    // Swipe threshold
    const swipeThreshold = 50
    
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous section
        const newSection = sections[currentIndex - 1]
        handleSectionClick(newSection, currentIndex - 1)
        announceToScreenReader(`Swiped to ${newSection} section`)
      } else if (deltaX < 0 && currentIndex < sections.length - 1) {
        // Swipe left - go to next section
        const newSection = sections[currentIndex + 1]
        handleSectionClick(newSection, currentIndex + 1)
        announceToScreenReader(`Swiped to ${newSection} section`)
      }
    }
    
    setTouchStartX(null)
    setTouchStartY(null)
    setIsSwipeNavigation(false)
  }, [touchStartX, touchStartY, isMobile, isSwipeNavigation, activeSection, handleSectionClick])

  // Keyboard navigation for sections
  const handleSectionKeyboard = createKeyboardHandler(
    () => {
      const sections = ['trends', 'performance', 'insights', 'breakdown', 'export'] as AnalyticsSection[]
      handleSectionClick(sections[focusedSectionIndex], focusedSectionIndex)
    },
    undefined,
    {
      onArrowLeft: () => {
        setFocusedSectionIndex(prev => prev === 0 ? 4 : prev - 1)
      },
      onArrowRight: () => {
        setFocusedSectionIndex(prev => prev === 4 ? 0 : prev + 1)
      },
      onArrowUp: () => {
        setFocusedSectionIndex(prev => Math.max(0, prev - 1))
      },
      onArrowDown: () => {
        setFocusedSectionIndex(prev => Math.min(4, prev + 1))
      }
    }
  )

  // Component for loading fallback with skeleton
  const SectionLoader = ({ variant = 'chart' }: { variant?: 'chart' | 'insight' | 'breakdown' }) => (
    <AnalyticsSkeleton variant={variant} />
  )

  // Loading state with skeleton
  if (premiumLoading || analyticsLoading) {
    return <AnalyticsSkeleton variant="dashboard" className={className} />
  }

  // Error state with enhanced error handling
  if (analyticsError || errorHandler.hasError) {
    const displayError = analyticsError || errorHandler.error
    return (
      <div className={`space-y-6 ${className}`}>
        <AnalyticsErrorBoundary 
          sectionName="Analytics Dashboard"
          fallback={(error, resetError) => (
            <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
              <ErrorMessage 
                error={error} 
                onRetry={errorHandler.canRetry ? () => {
                  resetError()
                  errorHandler.clearError()
                  window.location.reload()
                } : undefined}
              />
            </div>
          )}
        >
          <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
            <ErrorMessage 
              error={displayError} 
              onRetry={errorHandler.canRetry ? () => {
                errorHandler.clearError()
                window.location.reload()
              } : undefined}
            />
          </div>
        </AnalyticsErrorBoundary>
      </div>
    )
  }

  // Navigation sections
  const sections = [
    {
      id: 'trends' as AnalyticsSection,
      label: 'Trends & Patterns',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'View completion trends over time'
    },
    {
      id: 'performance' as AnalyticsSection,
      label: 'Performance Analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Analyze day-of-week and time patterns'
    },
    {
      id: 'insights' as AnalyticsSection,
      label: 'Predictive Insights',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      description: 'AI-powered recommendations and patterns'
    },
    {
      id: 'breakdown' as AnalyticsSection,
      label: 'Detailed Breakdowns',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Week, month, quarter, and year views'
    },
    {
      id: 'export' as AnalyticsSection,
      label: 'Export Options',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Download data in multiple formats'
    }
  ]

  return (
    <div 
      ref={containerRef}
      className={`space-y-6 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-analytics-dashboard
    >
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 shadow-xl animate-slideInUp">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Premium Analytics
              </h1>
              <CacheStatusBadge habitId={habit.id} />
              <div className="flex items-center gap-2">
                {isPremium && !hasSeenOnboarding && (
                  <Tooltip 
                    content="🎯 Start a quick tour to discover all premium analytics features" 
                    variant="info"
                    placement="bottom"
                  >
                    <button
                      onClick={() => setShowOnboarding(true)}
                      className="animate-gentleBounce text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors focus-visible-ring rounded-full p-1 touch-target"
                      aria-label="Start analytics tour"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </Tooltip>
                )}
                
                {/* Developer mode: User Journey Test (only show in development) */}
                {import.meta.env.DEV && isPremium && (
                  <Tooltip 
                    content="🧪 Run automated user journey test" 
                    variant="info"
                    placement="bottom"
                  >
                    <button
                      onClick={() => setShowUserJourneyTest(true)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus-visible-ring rounded-full p-1 touch-target"
                      aria-label="Run user journey test"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced insights and patterns for "{habit.habitName}"
              {!isOnline && isAnalyticsCached(habit.id) && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">
                  (Offline - showing cached data)
                </span>
              )}
            </p>
          </div>
          {isPremium && (
            <Tooltip 
              content="🌟 Premium subscription active - enjoy unlimited analytics!" 
              variant="success"
              placement="bottom"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border border-purple-200 dark:border-purple-800 animate-pulseGlow cursor-help">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Premium Active
                </span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Navigation - Mobile optimized with swipe support */}
        <div className="relative">
          {/* Skip link for keyboard users */}
          <a 
            href="#analytics-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 rounded z-50"
          >
            Skip to analytics content
          </a>
          
          {/* Mobile: Horizontal scrollable tabs with improved touch targets */}
          <div className="md:hidden">
            {/* Swipe indicator */}
            {isPremium && (
              <div className="flex items-center justify-center mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full animate-gentleBounce">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span className="font-medium">Swipe to navigate</span>
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            )}
            
            <div 
              className="flex gap-3 overflow-x-auto scrollbar-thin pb-3 -mx-2 px-2" 
              style={{ scrollSnapType: 'x mandatory' }}
              role="tablist"
              aria-label="Analytics sections"
            >
              {sections.map((section, index) => (
                <Tooltip
                  key={section.id}
                  content={isPremium ? section.description : `${section.description} (Premium required)`}
                  placement="bottom"
                  disabled={isMobile}
                >
                  <button
                    ref={el => { sectionRefs.current[index] = el }}
                    onClick={() => handleSectionClick(section.id, index)}
                    onKeyDown={handleSectionKeyboard}
                    onFocus={() => setFocusedSectionIndex(index)}
                    className={`relative flex-shrink-0 p-4 rounded-xl text-left transition-smooth group min-w-[160px] touch-manipulation focus-ring ${
                      activeSection === section.id && isPremium
                        ? 'bg-blue-500 text-white shadow-lg scale-105 animate-scaleIn'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:scale-102 active:scale-95'
                    } ${focusedSectionIndex === index ? 'ring-2 ring-blue-300' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls={`analytics-panel-${section.id}`}
                    aria-label={`${section.label}: ${section.description}${!isPremium ? ' (Premium required)' : ''}`}
                    disabled={!isPremium}
                    data-section={section.id}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-xl transition-transform-smooth group-hover:scale-110" aria-hidden="true">{section.icon}</div>
                      <span className="font-semibold text-sm leading-tight">{section.label}</span>
                    </div>
                    <p className="text-xs opacity-80 line-clamp-2">
                      {section.description}
                    </p>
                    
                    {/* Premium lock overlay for free users */}
                    {!isPremium && (
                      <div className="absolute inset-0 bg-gray-900/20 dark:bg-gray-900/40 rounded-xl flex items-center justify-center backdrop-blur-sm animate-scaleIn">
                        <svg 
                          className="w-6 h-6 text-gray-600 dark:text-gray-400 animate-pulse" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                          aria-label="Premium feature locked"
                        >
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-3" role="tablist" aria-label="Analytics sections">
            {sections.map((section, index) => (
              <button
                key={section.id}
                ref={el => { sectionRefs.current[index] = el }}
                onClick={() => handleSectionClick(section.id, index)}
                onKeyDown={handleSectionKeyboard}
                onFocus={() => setFocusedSectionIndex(index)}
                className={`relative p-4 rounded-xl text-left transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeSection === section.id && isPremium
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                } ${focusedSectionIndex === index ? 'ring-2 ring-blue-300' : ''}`}
                role="tab"
                aria-selected={activeSection === section.id}
                aria-controls={`analytics-panel-${section.id}`}
                aria-label={`${section.label}: ${section.description}${!isPremium ? ' (Premium required)' : ''}`}
                disabled={!isPremium}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div aria-hidden="true">{section.icon}</div>
                  <span className="font-semibold text-sm">{section.label}</span>
                </div>
                <p className="text-xs opacity-80">
                  {section.description}
                </p>
                
                {/* Premium lock overlay for free users */}
                {!isPremium && (
                  <div className="absolute inset-0 bg-gray-900/20 dark:bg-gray-900/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg 
                      className="w-6 h-6 text-gray-600 dark:text-gray-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-label="Premium feature locked"
                    >
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {isPremium ? (
        <div className="space-y-6" id="analytics-content">
          {/* Trends and Patterns Section */}
          {activeSection === 'trends' && calculatedAnalytics && (
            <div 
              className="space-y-6"
              role="tabpanel"
              id="analytics-panel-trends"
              aria-labelledby="tab-trends"
            >
              <AnalyticsErrorBoundary sectionName="Trend Analysis">
                <section 
                  className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp"
                  aria-labelledby="trends-heading"
                >
                  <h2 
                    id="trends-heading"
                    className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"
                  >
                    <svg 
                      className="w-5 h-5 mr-2 text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Completion Trends
                  </h2>
                  {insufficientDataHandler.checkDataRequirements('trends', completions, 7, 'days of data') ? (
                    <Suspense fallback={<SectionLoader variant="chart" />}>
                      <TrendAnalysis completions={completions} />
                    </Suspense>
                  ) : (
                    <InsufficientDataMessage
                      minimumRequired={7}
                      currentCount={completions.length}
                      dataType="days of data"
                      analysisType="trend analysis"
                    />
                  )}
                </section>
              </AnalyticsErrorBoundary>

              <AnalyticsErrorBoundary sectionName="Month Comparison">
                <section 
                  className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp animate-stagger-1"
                  aria-labelledby="month-comparison-heading"
                >
                  <h2 
                    id="month-comparison-heading"
                    className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"
                  >
                    <svg 
                      className="w-5 h-5 mr-2 text-green-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Month Comparison
                  </h2>
                  {insufficientDataHandler.checkDataRequirements('monthComparison', completions, 60, 'days of data') ? (
                    <Suspense fallback={<SectionLoader variant="chart" />}>
                      <MonthComparison completions={completions} />
                    </Suspense>
                  ) : (
                    <InsufficientDataMessage
                      minimumRequired={60}
                      currentCount={completions.length}
                      dataType="days of data"
                      analysisType="month-over-month comparison"
                    />
                  )}
                </section>
              </AnalyticsErrorBoundary>
            </div>
          )}

          {/* Performance Analysis Section */}
          {activeSection === 'performance' && calculatedAnalytics && (
            <div 
              className="space-y-6"
              role="tabpanel"
              id="analytics-panel-performance"
              aria-labelledby="tab-performance"
            >
              <AnalyticsErrorBoundary sectionName="Day of Week Analysis">
                <section 
                  className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp"
                  aria-labelledby="day-of-week-heading"
                >
                  <h2 
                    id="day-of-week-heading"
                    className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"
                  >
                    <svg 
                      className="w-5 h-5 mr-2 text-purple-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Day of Week Performance
                  </h2>
                  {insufficientDataHandler.checkDataRequirements('dayOfWeek', completions, 28, 'days of data') ? (
                    <Suspense fallback={<SectionLoader variant="chart" />}>
                      <DayOfWeekStats completions={completions} />
                    </Suspense>
                  ) : (
                    <InsufficientDataMessage
                      minimumRequired={28}
                      currentCount={completions.length}
                      dataType="days of data"
                      analysisType="day-of-week analysis"
                    />
                  )}
                </section>
              </AnalyticsErrorBoundary>

              <AnalyticsErrorBoundary sectionName="Time of Day Analysis">
                <section 
                  className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp animate-stagger-1"
                  aria-labelledby="time-of-day-heading"
                >
                  <h2 
                    id="time-of-day-heading"
                    className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"
                  >
                    <svg 
                      className="w-5 h-5 mr-2 text-orange-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time of Day Analysis
                  </h2>
                  {insufficientDataHandler.checkDataRequirements('timeOfDay', completions, 14, 'days of data') ? (
                    <Suspense fallback={<SectionLoader variant="chart" />}>
                      <TimeOfDayDistribution 
                        distribution={calculatedAnalytics.timeOfDayDistribution}
                        habitName={habit.habitName}
                      />
                    </Suspense>
                  ) : (
                    <InsufficientDataMessage
                      minimumRequired={14}
                      currentCount={completions.length}
                      dataType="days of data"
                      analysisType="time-of-day analysis"
                    />
                  )}
                </section>
              </AnalyticsErrorBoundary>
            </div>
          )}

          {/* Predictive Insights Section */}
          {activeSection === 'insights' && calculatedAnalytics && (
            <div
              role="tabpanel"
              id="analytics-panel-insights"
              aria-labelledby="tab-insights"
            >
              <AnalyticsErrorBoundary sectionName="Predictive Insights">
                <section 
                  className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp"
                  aria-labelledby="insights-heading"
                >
                  <h2 
                    id="insights-heading"
                    className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"
                  >
                    <svg 
                      className="w-5 h-5 mr-2 text-indigo-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Powered Insights
                  </h2>
                  {insufficientDataHandler.checkDataRequirements('insights', completions, 28, 'days of data') ? (
                    <Suspense fallback={<SectionLoader variant="insight" />}>
                      <InsightList insights={calculatedAnalytics.insights} />
                    </Suspense>
                  ) : (
                    <InsufficientDataMessage
                      minimumRequired={28}
                      currentCount={completions.length}
                      dataType="days of data"
                      analysisType="predictive insights"
                    />
                  )}
                </section>
              </AnalyticsErrorBoundary>
            </div>
          )}

          {/* Detailed Breakdowns Section */}
          {activeSection === 'breakdown' && (
            <AnalyticsErrorBoundary sectionName="Detailed Breakdowns">
              {insufficientDataHandler.checkDataRequirements('breakdown', completions, 7, 'days of data') ? (
                <Suspense fallback={<SectionLoader variant="breakdown" />}>
                  <DetailedBreakdownView
                    checks={completions}
                    habitStartDate={habit.startDate.toDate()}
                    habitFrequency={habit.frequency}
                    trackingType={habit.trackingType}
                    targetValue={habit.targetValue}
                    targetUnit={habit.targetUnit}
                  />
                </Suspense>
              ) : (
                <div className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp">
                  <InsufficientDataMessage
                    minimumRequired={7}
                    currentCount={completions.length}
                    dataType="days of data"
                    analysisType="detailed breakdowns"
                  />
                </div>
              )}
            </AnalyticsErrorBoundary>
          )}

          {/* Export Options Section */}
          {activeSection === 'export' && (
            <div className="glass-card rounded-3xl p-6 shadow-xl card-hover animate-slideInUp">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Your Data
              </h2>
              
              {/* Mobile: Stacked layout with larger touch targets, Desktop: Grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">CSV Export</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Spreadsheet-friendly format with all completion data
                  </p>
                  <Tooltip 
                    content="📊 Download your data as a spreadsheet-friendly CSV file" 
                    variant="info"
                    placement="top"
                  >
                    <button
                      onClick={handleExportClick}
                      className="w-full px-6 py-3 rounded-lg bg-blue-500 active:bg-blue-600 hover:bg-blue-600 text-white font-medium transition-smooth touch-manipulation min-h-[44px] hover:scale-105 active:scale-95 focus-visible-ring"
                      data-export-trigger
                    >
                      Export CSV
                    </button>
                  </Tooltip>
                </div>

                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-4xl mb-3">📄</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">JSON Export</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Complete data with metadata for developers
                  </p>
                  <Tooltip 
                    content="📄 Download complete data with metadata in JSON format" 
                    variant="info"
                    placement="top"
                  >
                    <button
                      onClick={handleExportClick}
                      className="w-full px-6 py-3 rounded-lg bg-green-500 active:bg-green-600 hover:bg-green-600 text-white font-medium transition-smooth touch-manipulation min-h-[44px] hover:scale-105 active:scale-95 focus-visible-ring"
                      data-export-trigger
                    >
                      Export JSON
                    </button>
                  </Tooltip>
                </div>

                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 sm:col-span-2 lg:col-span-1">
                  <div className="text-4xl mb-3">📋</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">PDF Report</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Formatted report with charts and insights
                  </p>
                  <Tooltip 
                    content="📋 Generate a beautiful PDF report with charts and insights" 
                    variant="info"
                    placement="top"
                  >
                    <button
                      onClick={handleExportClick}
                      className="w-full px-6 py-3 rounded-lg bg-purple-500 active:bg-purple-600 hover:bg-purple-600 text-white font-medium transition-smooth touch-manipulation min-h-[44px] hover:scale-105 active:scale-95 focus-visible-ring"
                      data-export-trigger
                    >
                      Export PDF
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Export Features</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Custom date range selection</li>
                  <li>• Email delivery option</li>
                  <li>• Include analytics and insights</li>
                  <li>• Multiple format support</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Free User Preview with Blur Overlay */
        <div className="relative">
          <div className="space-y-6 filter blur-sm pointer-events-none">
            {/* Preview content for free users */}
            <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Completion Trends</h2>
              <div className="h-64 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Day Performance</h3>
                <div className="h-48 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl"></div>
              </div>
              
              <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Time Analysis</h3>
                <div className="h-48 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Blur overlay with upgrade prompt */}
          <PremiumBlurOverlay
            isPremium={false}
            feature="advanced-analytics"
            featureName="Premium Analytics"
          >
            <div></div>
          </PremiumBlurOverlay>
        </div>
      )}

      {/* Export Modal - Use bottom sheet on mobile */}
      {showExportModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner size="lg" /></div>}>
          {isMobile ? (
            <MobileBottomSheet
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              title="Export Data"
              maxHeight="85vh"
            >
              <ExportModal
                isOpen={showExportModal}
                habits={[habit]}
                completions={completions}
                analytics={calculatedAnalytics ? [calculatedAnalytics as AnalyticsData] : undefined}
                insights={calculatedAnalytics?.insights}
                onClose={() => setShowExportModal(false)}
                isMobileBottomSheet={true}
              />
            </MobileBottomSheet>
          ) : (
            <ExportModal
              isOpen={showExportModal}
              habits={[habit]}
              completions={completions}
              analytics={calculatedAnalytics ? [calculatedAnalytics as AnalyticsData] : undefined}
              insights={calculatedAnalytics?.insights}
              onClose={() => setShowExportModal(false)}
            />
          )}
        </Suspense>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          feature="advanced-analytics"
          featureName="Premium Analytics"
        />
      )}

      {/* Onboarding Hints */}
      {isPremium && (
        <OnboardingHints
          hints={premiumAnalyticsHints}
          isActive={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* User Journey Test (Development only) */}
      {import.meta.env.DEV && (
        <UserJourneyTest
          isVisible={showUserJourneyTest}
          onClose={() => setShowUserJourneyTest(false)}
        />
      )}
    </div>
  )
}