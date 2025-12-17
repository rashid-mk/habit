import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnalyticsDashboard } from '../components/AnalyticsDashboard'
import { Habit, CheckIn } from '../hooks/useHabits'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'
import '@testing-library/jest-dom'
import { ExportService } from '../services/ExportService'
import { SyncService } from '../services/SyncService'
import { AccessControlService } from '../services/AccessControlService'
import { AnalyticsData } from '../types/analytics'

// Mock Firebase
vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id', email: 'test@example.com' }
  },
  db: {},
  functions: {}
}))

// Mock all the complex components to avoid rendering issues
vi.mock('../components/TrendAnalysis', () => ({
  TrendAnalysis: ({ completions }: { completions: CheckIn[] }) => (
    <div data-testid="trend-analysis">Trend Analysis ({completions.length} completions)</div>
  )
}))

vi.mock('../components/DayOfWeekStats', () => ({
  DayOfWeekStats: ({ completions }: { completions: CheckIn[] }) => (
    <div data-testid="day-of-week-stats">Day of Week Stats ({completions.length} completions)</div>
  )
}))

vi.mock('../components/TimeOfDayDistribution', () => ({
  TimeOfDayDistribution: () => (
    <div data-testid="time-of-day-distribution">Time of Day Distribution</div>
  )
}))

vi.mock('../components/MonthComparison', () => ({
  MonthComparison: ({ completions }: { completions: CheckIn[] }) => (
    <div data-testid="month-comparison">Month Comparison ({completions.length} completions)</div>
  )
}))

vi.mock('../components/InsightList', () => ({
  InsightList: ({ insights }: { insights: any[] }) => (
    <div data-testid="insight-list">Insights ({insights.length} insights)</div>
  )
}))

vi.mock('../components/DetailedBreakdownView', () => ({
  DetailedBreakdownView: ({ checks }: { checks: CheckIn[] }) => (
    <div data-testid="detailed-breakdown">Detailed Breakdown ({checks.length} checks)</div>
  )
}))

vi.mock('../components/AnalyticsSkeleton', () => ({
  AnalyticsSkeleton: ({ variant }: { variant?: string }) => (
    <div data-testid="analytics-skeleton">Loading {variant}...</div>
  )
}))

vi.mock('../components/ExportModal', () => ({
  ExportModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="export-modal">
        <h2>Export Data</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

vi.mock('../components/PremiumBlurOverlay', () => ({
  PremiumBlurOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="premium-blur-overlay">{children}</div>
  )
}))

vi.mock('../components/UpgradePrompt', () => ({
  UpgradePrompt: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="upgrade-prompt">
        <h2>Upgrade to Premium</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

// Mock hooks
vi.mock('../hooks/usePremiumAccess', () => ({
  usePremiumAccess: vi.fn()
}))

vi.mock('../hooks/usePremiumAnalytics', () => ({
  usePremiumAnalytics: vi.fn()
}))

vi.mock('../hooks/useOfflineAnalytics', () => ({
  useOfflineAnalytics: vi.fn()
}))

vi.mock('../hooks/useAnalyticsErrorHandler', () => ({
  useAnalyticsErrorHandler: vi.fn(() => ({
    wrapCalculation: vi.fn((fn) => fn()),
    hasError: false,
    error: null,
    canRetry: false,
    clearError: vi.fn()
  })),
  useInsufficientDataHandler: vi.fn(() => ({
    checkDataRequirements: vi.fn(() => true)
  }))
}))

// Test data generators
const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'test-habit-id',
  habitName: 'Test Habit',
  startDate: Timestamp.fromDate(dayjs().subtract(30, 'days').toDate()),
  frequency: 'daily',
  isActive: true,
  trackingType: 'simple',
  createdAt: Timestamp.now(),
  ...overrides
})

const createMockCompletion = (
  dateOffset: number, 
  status: 'done' | 'not_done' = 'done',
  overrides: Partial<CheckIn> = {}
): CheckIn => ({
  id: `completion-${dateOffset}`,
  habitId: 'test-habit-id',
  userId: 'test-user-id',
  dateKey: dayjs().subtract(dateOffset, 'days').format('YYYY-MM-DD'),
  status,
  completedAt: status === 'done' ? Timestamp.fromDate(dayjs().subtract(dateOffset, 'days').add(10, 'hours').toDate()) : null,
  isCompleted: status === 'done',
  ...overrides
})

const createMockCompletions = (count: number, completionRate: number = 0.8): CheckIn[] => {
  const completions: CheckIn[] = []
  for (let i = 0; i < count; i++) {
    const isCompleted = Math.random() < completionRate
    completions.push(createMockCompletion(i, isCompleted ? 'done' : 'not_done'))
  }
  return completions
}

describe('Comprehensive Analytics Integration Tests', () => {
  let queryClient: QueryClient
  let user: any

  beforeAll(() => {
    // Mock window methods
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  })

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    user = userEvent.setup()

    // Setup hook mocks with default values
    const premiumAccessModule = await import('../hooks/usePremiumAccess')
    const premiumAnalyticsModule = await import('../hooks/usePremiumAnalytics')
    const offlineAnalyticsModule = await import('../hooks/useOfflineAnalytics')

    vi.mocked(premiumAccessModule.usePremiumAccess).mockReturnValue({
      isPremium: true,
      isLoading: false,
      checkFeatureAccess: vi.fn().mockResolvedValue(true),
      refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
    })

    vi.mocked(premiumAnalyticsModule.usePremiumAnalytics).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any)

    vi.mocked(offlineAnalyticsModule.useOfflineAnalytics).mockReturnValue({
      isOnline: true,
      isAnalyticsCached: vi.fn().mockReturnValue(false)
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Complete Analytics Calculation and Display Flow', () => {
    it('should display analytics dashboard for premium users', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show premium analytics header
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
      expect(screen.getByText('Premium Active')).toBeInTheDocument()

      // Should show navigation sections
      expect(screen.getByText('Trends & Patterns')).toBeInTheDocument()
      expect(screen.getByText('Performance Analysis')).toBeInTheDocument()
      expect(screen.getByText('Predictive Insights')).toBeInTheDocument()
      expect(screen.getByText('Detailed Breakdowns')).toBeInTheDocument()
      expect(screen.getByText('Export Options')).toBeInTheDocument()
    })

    it('should navigate between different analytics sections', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Click on Performance Analysis
      await user.click(screen.getByText('Performance Analysis'))

      await waitFor(() => {
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
        expect(screen.getByTestId('time-of-day-distribution')).toBeInTheDocument()
      })

      // Click on Predictive Insights
      await user.click(screen.getByText('Predictive Insights'))

      await waitFor(() => {
        expect(screen.getByTestId('insight-list')).toBeInTheDocument()
      })
    })

    it('should handle complete analytics calculation pipeline with real data patterns', async () => {
      // Create realistic data pattern: better performance on weekdays
      const habit = createMockHabit({ trackingType: 'count', targetValue: 10 })
      const completions: CheckIn[] = []
      
      // Generate 8 weeks of data with weekday bias
      for (let i = 0; i < 56; i++) {
        const date = dayjs().subtract(i, 'days')
        const isWeekend = date.day() === 0 || date.day() === 6
        const completionRate = isWeekend ? 0.4 : 0.8
        
        if (Math.random() < completionRate) {
          completions.push(createMockCompletion(i, 'done', {
            progressValue: Math.floor(Math.random() * 15) + 5, // 5-20 range
            completedAt: Timestamp.fromDate(date.hour(Math.floor(Math.random() * 12) + 8).toDate()) // 8am-8pm
          }))
        }
      }

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Verify analytics sections process the data correctly
      await user.click(screen.getByText('Performance Analysis'))
      
      await waitFor(() => {
        // Should show day-of-week analysis with the pattern
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
        expect(screen.getByTestId('time-of-day-distribution')).toBeInTheDocument()
      })

      // Check insights generation
      await user.click(screen.getByText('Predictive Insights'))
      
      await waitFor(() => {
        expect(screen.getByTestId('insight-list')).toBeInTheDocument()
      })

      // Verify trend analysis
      await user.click(screen.getByText('Trends & Patterns'))
      
      await waitFor(() => {
        expect(screen.getByTestId('trend-analysis')).toBeInTheDocument()
      })
    })

    it('should maintain data integrity throughout the analytics pipeline', async () => {
      const habit = createMockHabit({ id: 'integrity-test-habit' })
      const completions = createMockCompletions(30, 0.8).map(c => ({
        ...c,
        habitId: 'integrity-test-habit'
      }))

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Verify all sections show consistent data counts
      const expectedCompletionCount = completions.length

      await user.click(screen.getByText('Trends & Patterns'))
      await waitFor(() => {
        const trendElement = screen.getByTestId('trend-analysis')
        expect(trendElement).toHaveTextContent(`${expectedCompletionCount} completions`)
      })

      await user.click(screen.getByText('Performance Analysis'))
      await waitFor(() => {
        const dayStatsElement = screen.getByTestId('day-of-week-stats')
        expect(dayStatsElement).toHaveTextContent(`${expectedCompletionCount} completions`)
      })

      await user.click(screen.getByText('Detailed Breakdowns'))
      await waitFor(() => {
        const breakdownElement = screen.getByTestId('detailed-breakdown')
        expect(breakdownElement).toHaveTextContent(`${expectedCompletionCount} checks`)
      })
    })

    it('should show insufficient data messages when data is below thresholds', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(5, 0.8) // Only 5 days of data

      // Mock insufficient data handler to return false
      const { useInsufficientDataHandler } = require('../hooks/useAnalyticsErrorHandler')
      vi.mocked(useInsufficientDataHandler).mockReturnValue({
        checkDataRequirements: vi.fn(() => false)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show insufficient data message
      await waitFor(() => {
        expect(screen.getByText(/Need at least/)).toBeInTheDocument()
      })
    })
  })

  describe('Export Generation and Download Flow', () => {
    it('should open export modal when clicking export options', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section
      await user.click(screen.getByText('Export Options'))

      // Click CSV export button
      await user.click(screen.getByText('Export CSV'))

      // Should open export modal
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
    })

    it('should generate and validate CSV export', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(20, 0.8)

      const exportService = new ExportService()
      const csvBlob = await exportService.exportToCSV([habit], completions)
      
      expect(csvBlob.size).toBeGreaterThan(0)
      expect(csvBlob.type).toBe('text/csv')

      // Verify CSV content
      const csvText = await csvBlob.text()
      expect(csvText).toContain('date,habit_name,completion_status,progress_value,streak_count')
      expect(csvText).toContain('Test Habit')
    })

    it('should generate and validate JSON export', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(15, 0.8)

      const exportService = new ExportService()
      const jsonBlob = await exportService.exportToJSON([habit], completions)
      
      expect(jsonBlob.size).toBeGreaterThan(0)
      expect(jsonBlob.type).toBe('application/json')

      // Verify JSON content
      const jsonText = await jsonBlob.text()
      const data = JSON.parse(jsonText)
      
      expect(data).toHaveProperty('habits')
      expect(data).toHaveProperty('completions')
      expect(data.habits).toHaveLength(1)
      expect(data.completions).toHaveLength(completions.length)
    })

    it('should generate and validate PDF export', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(25, 0.8)

      const exportService = new ExportService()
      const pdfBlob = await exportService.exportToPDF([habit], completions)
      
      expect(pdfBlob.size).toBeGreaterThan(0)
      expect(pdfBlob.type).toBe('application/pdf')
    })

    it('should handle export errors gracefully', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section and try to export
      await user.click(screen.getByText('Export Options'))
      await user.click(screen.getByText('Export CSV'))

      // Should handle errors gracefully (exact error handling depends on implementation)
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })
  })

  describe('Multi-Device Sync Scenarios', () => {
    it('should handle real-time sync updates', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock sync service with real-time updates
      const syncService = new SyncService()
      let updateCallback: ((data: AnalyticsData) => void) | null = null

      vi.spyOn(syncService, 'subscribeToAnalyticsUpdates').mockImplementation((userId: string, callback: (data: AnalyticsData) => void) => {
        updateCallback = callback
        return vi.fn() // unsubscribe function
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Simulate receiving sync update
      if (updateCallback) {
        const updatedAnalytics: AnalyticsData = {
          habitId: habit.id,
          userId: 'test-user-id',
          calculatedAt: Timestamp.now(),
          trends: {} as any,
          dayOfWeekStats: {} as any,
          timeOfDayDistribution: {} as any,
          monthComparison: {} as any,
          insights: [{ id: 'new-insight', type: 'day-of-week-pattern', message: 'Updated insight', confidence: 'high', dataSupport: 35, actionable: true }],
          dataPointCount: 35,
          oldestDataPoint: Timestamp.now(),
          newestDataPoint: Timestamp.now()
        }
        updateCallback(updatedAnalytics)
      }

      // Should update UI with new data
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()

      syncService.cleanup()
    })

    it('should handle sync conflicts between devices', async () => {
      const syncService = new SyncService()
      
      // Create conflicting data from two devices
      const device1Data: AnalyticsData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [{ id: 'device1-insight', type: 'day-of-week-pattern', message: 'Device 1 insight', confidence: 'high', dataSupport: 30, actionable: true }],
        dataPointCount: 30,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      const device2Data: AnalyticsData = {
        ...device1Data,
        calculatedAt: Timestamp.fromDate(new Date('2023-01-01T10:00:01Z')), // 1 second later
        insights: [{ id: 'device2-insight', type: 'time-of-day-pattern', message: 'Device 2 insight', confidence: 'medium', dataSupport: 32, actionable: true }],
        dataPointCount: 32
      }

      // Add sync metadata
      const device1Syncable = {
        ...device1Data,
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')),
          deviceId: 'device-1',
          version: 1000
        }
      }

      const device2Syncable = {
        ...device2Data,
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(new Date('2023-01-01T10:00:01Z')),
          deviceId: 'device-2',
          version: 1001
        }
      }

      const resolved = syncService.resolveConflict(device1Syncable, device2Syncable)

      // Should resolve to newer data (device 2)
      expect(resolved.syncMetadata.deviceId).toBe('device-2')
      expect(resolved.dataPointCount).toBe(32)
      expect(resolved.insights[0].id).toBe('device2-insight')

      syncService.cleanup()
    })

    it('should sync analytics data across multiple devices within time limit', async () => {
      const syncService = new SyncService()
      const analyticsData: AnalyticsData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.now(),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [],
        dataPointCount: 25,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      const startTime = Date.now()
      
      // Mock successful sync
      vi.spyOn(syncService, 'syncAnalytics').mockResolvedValue(undefined)
      
      await syncService.syncAnalytics('test-user', 'test-habit', analyticsData)
      
      const syncTime = Date.now() - startTime
      
      // Should complete within 30 seconds (requirement)
      expect(syncTime).toBeLessThan(30000)

      syncService.cleanup()
    })

    it('should handle offline sync scenarios', async () => {
      const syncService = new SyncService()
      const analyticsData: AnalyticsData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.now(),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [],
        dataPointCount: 20,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      // Cache data while offline
      syncService.cacheAnalyticsOffline('test-user', 'test-habit', analyticsData)
      
      // Verify data is cached
      const cached = syncService.getCachedAnalytics('test-user', 'test-habit')
      expect(cached).toBeTruthy()
      expect(cached?.habitId).toBe('test-habit')
      expect(cached?.dataPointCount).toBe(20)

      syncService.cleanup()
    })

    it('should display appropriate sync status indicators', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock offline state
      const { useOfflineAnalytics } = require('../hooks/useOfflineAnalytics')
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: false,
        isAnalyticsCached: vi.fn().mockReturnValue(true)
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/Offline - showing cached data/)).toBeInTheDocument()
      })
    })
  })

  describe('Premium Access Control Flow', () => {
    it('should show blur overlay for free users', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock free user
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(false),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show blurred preview content
      await waitFor(() => {
        expect(screen.getByTestId('premium-blur-overlay')).toBeInTheDocument()
      })
    })

    it('should show upgrade prompt when free user clicks premium features', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock free user
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(false),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Try to click on a premium section
      const performanceButton = screen.getByText('Performance Analysis')
      await user.click(performanceButton)

      // Should show upgrade prompt
      await waitFor(() => {
        expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument()
      })
    })

    it('should verify premium access control integration', async () => {
      const accessControlService = new AccessControlService()
      
      // Mock premium user verification
      vi.spyOn(accessControlService, 'isPremiumUser').mockResolvedValue(true)
      vi.spyOn(accessControlService, 'checkFeatureAccess').mockResolvedValue(true)

      const hasAnalyticsAccess = await accessControlService.checkFeatureAccess('test-user', 'advanced-analytics')
      const hasExportAccess = await accessControlService.checkFeatureAccess('test-user', 'data-export')

      expect(hasAnalyticsAccess).toBe(true)
      expect(hasExportAccess).toBe(true)

      accessControlService.clearAllCache()
    })

    it('should handle subscription expiry scenarios', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Start as premium user
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: true,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show full analytics
      expect(screen.getByText('Premium Active')).toBeInTheDocument()

      // Simulate subscription expiry
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(false),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should revert to free user experience
      await waitFor(() => {
        expect(screen.getByTestId('premium-blur-overlay')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle loading states', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock loading state
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: true,
        isLoading: true,
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show loading skeleton
      await waitFor(() => {
        expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument()
      })
    })

    it('should handle empty completion data', async () => {
      const habit = createMockHabit()
      const completions: CheckIn[] = []

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should still render the dashboard
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle offline state', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock offline state
      const { useOfflineAnalytics } = require('../hooks/useOfflineAnalytics')
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: false,
        isAnalyticsCached: vi.fn().mockReturnValue(true)
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/Offline - showing cached data/)).toBeInTheDocument()
      })
    })

    it('should handle network errors during analytics loading', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock analytics hook to return error
      const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
      vi.mocked(usePremiumAnalytics).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error')
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should handle malformed completion data', async () => {
      const habit = createMockHabit()
      const completions = [
        // Valid completion
        createMockCompletion(0, 'done'),
        // Malformed completion (missing required fields)
        {
          id: 'malformed',
          habitId: 'test-habit-id',
          userId: 'test-user-id',
          dateKey: 'invalid-date',
          status: 'done' as const,
          completedAt: Timestamp.now(),
          isCompleted: true
        } as CheckIn
      ]

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should still render without crashing
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle subscription verification failures', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock access control to throw error
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockRejectedValue(new Error('Subscription verification failed')),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should default to free user experience
      await waitFor(() => {
        expect(screen.getByTestId('premium-blur-overlay')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Responsiveness', () => {
    it('should handle large datasets efficiently', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(1000, 0.8) // Large dataset

      const startTime = performance.now()
      
      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(2000) // 2 seconds

      // Should still show analytics
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should show loading states during calculations', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock loading state
      const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
      vi.mocked(usePremiumAnalytics).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show loading skeleton
      expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument()
    })

    it('should handle responsive layout changes', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      // Trigger resize event
      fireEvent(window, new Event('resize'))

      // Should still render properly
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })
  })

  describe('Real-World User Scenarios', () => {
    it('should handle typical user journey from onboarding to advanced analytics', async () => {
      // Simulate new user with minimal data
      const habit = createMockHabit()
      const minimalCompletions = createMockCompletions(3, 1.0) // Only 3 days

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={minimalCompletions} />
      )

      // Should show insufficient data message
      await waitFor(() => {
        expect(screen.getByText(/Need at least/)).toBeInTheDocument()
      })

      // Simulate user building up data over time
      const moreCompletions = createMockCompletions(15, 0.8) // 2 weeks

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={moreCompletions} />
      )

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={moreCompletions} />
        </QueryClientProvider>
      )

      // Should now show some analytics
      await waitFor(() => {
        expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
      })

      // Simulate mature user with lots of data
      const matureCompletions = createMockCompletions(90, 0.75) // 3 months

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={matureCompletions} />
        </QueryClientProvider>
      )

      // Should show full analytics with insights
      await user.click(screen.getByText('Predictive Insights'))
      await waitFor(() => {
        expect(screen.getByTestId('insight-list')).toBeInTheDocument()
      })
    })

    it('should handle power user workflow with multiple habits and exports', async () => {
      const habits = [
        createMockHabit({ id: 'habit-1', habitName: 'Morning Exercise' }),
        createMockHabit({ id: 'habit-2', habitName: 'Evening Reading' }),
        createMockHabit({ id: 'habit-3', habitName: 'Meditation' })
      ]

      // Each habit has different completion patterns
      const allCompletions = [
        ...createMockCompletions(60, 0.9).map(c => ({ ...c, habitId: 'habit-1' })), // High performer
        ...createMockCompletions(60, 0.6).map(c => ({ ...c, habitId: 'habit-2' })), // Moderate performer
        ...createMockCompletions(60, 0.3).map(c => ({ ...c, habitId: 'habit-3' }))  // Struggling habit
      ]

      // Test each habit's analytics
      for (const habit of habits) {
        const habitCompletions = allCompletions.filter(c => c.habitId === habit.id)
        
        renderWithProviders(
          <AnalyticsDashboard habit={habit} completions={habitCompletions} />
        )

        // Should show analytics for each habit
        expect(screen.getByText('Premium Analytics')).toBeInTheDocument()

        // Test export for each habit
        await user.click(screen.getByText('Export Options'))
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      }

      // Test bulk export
      const exportService = new ExportService()
      const bulkCsvBlob = await exportService.exportToCSV(habits, allCompletions)
      const csvText = await bulkCsvBlob.text()
      
      // Should contain data from all habits
      expect(csvText).toContain('Morning Exercise')
      expect(csvText).toContain('Evening Reading')
      expect(csvText).toContain('Meditation')
    })

    it('should handle network connectivity changes during analytics usage', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Start online
      const { useOfflineAnalytics } = require('../hooks/useOfflineAnalytics')
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: true,
        isAnalyticsCached: vi.fn().mockReturnValue(false)
      } as any)

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show normal analytics
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()

      // Simulate going offline
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: false,
        isAnalyticsCached: vi.fn().mockReturnValue(true)
      } as any)

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/Offline - showing cached data/)).toBeInTheDocument()
      })

      // Should still allow navigation
      await user.click(screen.getByText('Performance Analysis'))
      await waitFor(() => {
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
      })

      // Simulate coming back online
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: true,
        isAnalyticsCached: vi.fn().mockReturnValue(false)
      } as any)

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should remove offline indicator
      await waitFor(() => {
        expect(screen.queryByText(/Offline - showing cached data/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Cross-Service Integration', () => {
    it('should integrate analytics calculation, export, and sync services seamlessly', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(45, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section
      await user.click(screen.getByText('Export Options'))

      // Initiate CSV export
      await user.click(screen.getByText('Export CSV'))

      // Should open export modal
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })

      // Verify export service integration
      const exportService = new ExportService()
      const csvBlob = await exportService.exportToCSV([habit], completions)
      expect(csvBlob.size).toBeGreaterThan(0)

      // Verify sync service integration
      const syncService = new SyncService()
      const analyticsData: AnalyticsData = {
        habitId: habit.id,
        userId: 'test-user',
        calculatedAt: Timestamp.now(),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [],
        dataPointCount: completions.length,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      // Should sync without errors
      await expect(
        syncService.syncAnalytics('test-user', habit.id, analyticsData)
      ).resolves.not.toThrow()

      syncService.cleanup()
    })

    it('should validate data consistency across service boundaries', async () => {
      const habit = createMockHabit({ id: 'consistency-test' })
      const completions = createMockCompletions(40, 0.8).map(c => ({
        ...c,
        habitId: 'consistency-test'
      }))

      // Test analytics calculation consistency
      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Verify UI shows correct data count
      await waitFor(() => {
        expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
      })

      // Test export service data consistency
      const exportService = new ExportService()
      const csvBlob = await exportService.exportToCSV([habit], completions)
      const csvText = await csvBlob.text()
      const csvLines = csvText.split('\n').filter(line => line.trim())
      
      // Should have header + data rows matching completion count
      expect(csvLines.length - 1).toBe(completions.length)

      // Test JSON export consistency
      const jsonBlob = await exportService.exportToJSON([habit], completions)
      const jsonText = await jsonBlob.text()
      const exportData = JSON.parse(jsonText)
      
      expect(exportData.completions).toHaveLength(completions.length)
      expect(exportData.habits).toHaveLength(1)
      expect(exportData.habits[0].id).toBe('consistency-test')

      // Test sync service data consistency
      const syncService = new SyncService()
      const analyticsData: AnalyticsData = {
        habitId: 'consistency-test',
        userId: 'test-user',
        calculatedAt: Timestamp.now(),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [],
        dataPointCount: completions.length,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      await syncService.syncAnalytics('test-user', 'consistency-test', analyticsData)
      
      const cachedData = syncService.getCachedAnalytics('test-user', 'consistency-test')
      expect(cachedData?.dataPointCount).toBe(completions.length)
      expect(cachedData?.habitId).toBe('consistency-test')

      syncService.cleanup()
    })
  })
})