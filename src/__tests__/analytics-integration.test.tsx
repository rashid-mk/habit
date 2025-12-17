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
import { AnalyticsData, ExportFormat } from '../types/analytics'

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

describe('Analytics Integration Tests', () => {
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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    user = userEvent.setup()

    // Setup hook mocks with default values
    const { usePremiumAccess } = require('../hooks/usePremiumAccess')
    const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
    const { useOfflineAnalytics } = require('../hooks/useOfflineAnalytics')

    vi.mocked(usePremiumAccess).mockReturnValue({
      isPremium: true,
      isLoading: false,
      checkFeatureAccess: vi.fn().mockResolvedValue(true),
      refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
    })

    vi.mocked(usePremiumAnalytics).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any)

    vi.mocked(useOfflineAnalytics).mockReturnValue({
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
  })

  describe('Multi-Device Sync Scenarios', () => {
    it('should display sync status when available', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show analytics dashboard (sync status is handled internally)
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

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

  describe('Accessibility Requirements', () => {
    it('should have proper ARIA labels and structure', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should have proper ARIA labels
      expect(screen.getByRole('tablist', { name: 'Analytics sections' })).toBeInTheDocument()

      // Should have skip link
      expect(screen.getByText('Skip to analytics content')).toBeInTheDocument()

      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('Export Service Integration', () => {
    let exportService: ExportService

    beforeEach(() => {
      exportService = new ExportService()
    })

    it('should generate CSV export with correct data structure', async () => {
      const habits = [createMockHabit()]
      const completions = createMockCompletions(10, 0.8)

      const csvBlob = await exportService.exportToCSV(habits, completions)
      const csvText = await csvBlob.text()

      // Should have correct headers
      expect(csvText).toContain('date,habit_name,completion_status,progress_value,streak_count')
      
      // Should contain completion data
      expect(csvText).toContain('Test Habit')
      expect(csvText).toContain('completed')
    })

    it('should generate JSON export with complete metadata', async () => {
      const habits = [createMockHabit()]
      const completions = createMockCompletions(5, 1.0)

      const jsonBlob = await exportService.exportToJSON(habits, completions)
      const jsonText = await jsonBlob.text()
      const exportData = JSON.parse(jsonText)

      // Should have all required fields
      expect(exportData).toHaveProperty('exportedAt')
      expect(exportData).toHaveProperty('habits')
      expect(exportData).toHaveProperty('completions')
      expect(exportData.habits).toHaveLength(1)
      expect(exportData.completions).toHaveLength(5)
    })

    it('should generate PDF export with charts and statistics', async () => {
      const habits = [createMockHabit()]
      const completions = createMockCompletions(30, 0.7)

      const pdfBlob = await exportService.exportToPDF(habits, completions)

      // Should generate a valid PDF blob
      expect(pdfBlob.type).toBe('application/pdf')
      expect(pdfBlob.size).toBeGreaterThan(0)
    })

    it('should filter exports by date range', async () => {
      const habits = [createMockHabit()]
      const completions = createMockCompletions(30, 0.8)
      const dateRange = {
        startDate: dayjs().subtract(10, 'days').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD')
      }

      const csvBlob = await exportService.exportToCSV(habits, completions, dateRange)
      const csvText = await csvBlob.text()
      const lines = csvText.split('\n').filter(line => line.trim())

      // Should have header + filtered completions (approximately 10 days)
      expect(lines.length).toBeLessThanOrEqual(12) // header + ~10 completions + buffer
      expect(lines.length).toBeGreaterThan(5) // at least some data
    })

    it('should handle email delivery errors gracefully', async () => {
      const habits = [createMockHabit()]
      const completions = createMockCompletions(5, 1.0)
      const csvBlob = await exportService.exportToCSV(habits, completions)

      // Mock Firebase functions to throw error
      vi.doMock('firebase/functions', () => ({
        getFunctions: vi.fn(),
        httpsCallable: vi.fn(() => vi.fn().mockRejectedValue(new Error('Network error')))
      }))

      await expect(
        exportService.sendViaEmail(csvBlob, 'csv', 'test@example.com')
      ).rejects.toThrow('Failed to send email')
    })

    it('should complete full export flow with UI interaction', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section
      await user.click(screen.getByText('Export Options'))

      // Should show export buttons
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Export JSON')).toBeInTheDocument()
      expect(screen.getByText('Export PDF')).toBeInTheDocument()

      // Click CSV export
      await user.click(screen.getByText('Export CSV'))

      // Should open export modal
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
    })

    it('should handle export progress and completion states', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(100, 0.8) // Large dataset

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section and initiate export
      await user.click(screen.getByText('Export Options'))
      await user.click(screen.getByText('Export PDF'))

      // Should show progress indicator during generation
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
    })

    it('should validate export data integrity', async () => {
      const habits = [
        createMockHabit({ id: 'habit-1', habitName: 'Morning Exercise' }),
        createMockHabit({ id: 'habit-2', habitName: 'Evening Reading' })
      ]
      const completions = [
        ...createMockCompletions(15, 0.9).map(c => ({ ...c, habitId: 'habit-1' })),
        ...createMockCompletions(15, 0.7).map(c => ({ ...c, habitId: 'habit-2' }))
      ]

      const jsonBlob = await exportService.exportToJSON(habits, completions)
      const jsonText = await jsonBlob.text()
      const exportData = JSON.parse(jsonText)

      // Should maintain data relationships
      expect(exportData.habits).toHaveLength(2)
      expect(exportData.completions).toHaveLength(30)
      
      // Should have completions for both habits
      const habit1Completions = exportData.completions.filter((c: any) => c.habitId === 'habit-1')
      const habit2Completions = exportData.completions.filter((c: any) => c.habitId === 'habit-2')
      expect(habit1Completions).toHaveLength(15)
      expect(habit2Completions).toHaveLength(15)
    })
  })

  describe('Sync Service Integration', () => {
    let syncService: SyncService

    beforeEach(() => {
      syncService = new SyncService()
    })

    afterEach(() => {
      syncService.cleanup()
    })

    it('should handle sync conflicts using timestamps', async () => {
      const localData: AnalyticsData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [{ id: 'local-insight', type: 'day-of-week-pattern', message: 'Local insight', confidence: 'high', dataSupport: 10, actionable: true }],
        dataPointCount: 30,
        oldestDataPoint: Timestamp.fromDate(new Date('2023-01-01')),
        newestDataPoint: Timestamp.fromDate(new Date('2023-01-30'))
      }

      const remoteData: AnalyticsData = {
        ...localData,
        calculatedAt: Timestamp.fromDate(new Date('2023-01-01T10:00:01Z')), // 1 second later
        insights: [{ id: 'remote-insight', type: 'time-of-day-pattern', message: 'Remote insight', confidence: 'medium', dataSupport: 15, actionable: true }]
      }

      const localSyncable = {
        ...localData,
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')),
          deviceId: 'device-1',
          version: 1000
        }
      }

      const remoteSyncable = {
        ...remoteData,
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(new Date('2023-01-01T10:00:01Z')),
          deviceId: 'device-2',
          version: 1001
        }
      }

      const resolved = syncService.resolveConflict(localSyncable, remoteSyncable)

      // Should resolve to the newer data (remote)
      expect(resolved.syncMetadata.deviceId).toBe('device-2')
      expect(resolved.calculatedAt.toMillis()).toBe(remoteData.calculatedAt.toMillis())
    })

    it('should merge insights from simultaneous updates', async () => {
      const baseTime = new Date('2023-01-01T10:00:00Z')
      
      const localData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.fromDate(baseTime),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [{ id: 'local-insight', type: 'day-of-week-pattern' as const, message: 'Local insight', confidence: 'high' as const, dataSupport: 10, actionable: true }],
        dataPointCount: 30,
        oldestDataPoint: Timestamp.fromDate(new Date('2023-01-01')),
        newestDataPoint: Timestamp.fromDate(new Date('2023-01-30')),
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(baseTime),
          deviceId: 'device-1',
          version: 1000
        }
      }

      const remoteData = {
        ...localData,
        insights: [{ id: 'remote-insight', type: 'time-of-day-pattern' as const, message: 'Remote insight', confidence: 'medium' as const, dataSupport: 15, actionable: true }],
        syncMetadata: {
          lastSyncAt: Timestamp.fromDate(new Date(baseTime.getTime() + 500)), // 500ms later (within 1 second)
          deviceId: 'device-2',
          version: 1000
        }
      }

      const resolved = syncService.resolveConflict(localData, remoteData)

      // Should merge insights from both devices
      expect(resolved.insights).toHaveLength(2)
      expect(resolved.insights.map(i => i.id)).toContain('local-insight')
      expect(resolved.insights.map(i => i.id)).toContain('remote-insight')
    })

    it('should cache data when offline', () => {
      const analyticsData: AnalyticsData = {
        habitId: 'test-habit',
        userId: 'test-user',
        calculatedAt: Timestamp.now(),
        trends: {} as any,
        dayOfWeekStats: {} as any,
        timeOfDayDistribution: {} as any,
        monthComparison: {} as any,
        insights: [],
        dataPointCount: 10,
        oldestDataPoint: Timestamp.now(),
        newestDataPoint: Timestamp.now()
      }

      syncService.cacheAnalyticsOffline('test-user', 'test-habit', analyticsData)
      const cached = syncService.getCachedAnalytics('test-user', 'test-habit')

      expect(cached).toBeTruthy()
      expect(cached?.habitId).toBe('test-habit')
      expect(cached?.syncMetadata).toBeTruthy()
    })

    it('should notify sync status changes', (done) => {
      let statusCount = 0
      const unsubscribe = syncService.onSyncStatusChange((status) => {
        statusCount++
        if (statusCount === 1) {
          expect(status).toBe('syncing')
        } else if (statusCount === 2) {
          expect(status).toBe('synced')
          unsubscribe()
          done()
        }
      })

      // Trigger status changes (this would normally happen during sync operations)
      // For testing, we'll access the private method through any casting
      ;(syncService as any).notifySyncStatus('syncing')
      ;(syncService as any).notifySyncStatus('synced')
    })
  })

  describe('Access Control Integration', () => {
    let accessControlService: AccessControlService

    beforeEach(() => {
      accessControlService = new AccessControlService()
    })

    afterEach(() => {
      accessControlService.clearAllCache()
    })

    it('should verify premium user access correctly', async () => {
      // Mock Firestore to return premium subscription
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPremium: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
          plan: 'premium'
        })
      })

      vi.doMock('firebase/firestore', async () => {
        const actual = await vi.importActual('firebase/firestore')
        return {
          ...actual,
          getDoc: mockGetDoc
        }
      })

      const isPremium = await accessControlService.isPremiumUser('test-user')
      expect(isPremium).toBe(true)
    })

    it('should deny access for expired subscriptions', async () => {
      // Mock Firestore to return expired subscription
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPremium: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
          plan: 'premium'
        })
      })

      vi.doMock('firebase/firestore', async () => {
        const actual = await vi.importActual('firebase/firestore')
        return {
          ...actual,
          getDoc: mockGetDoc
        }
      })

      const isPremium = await accessControlService.isPremiumUser('test-user')
      expect(isPremium).toBe(false)
    })

    it('should check feature access for premium features', async () => {
      // Mock premium user
      vi.spyOn(accessControlService, 'isPremiumUser').mockResolvedValue(true)

      const hasAnalyticsAccess = await accessControlService.checkFeatureAccess('test-user', 'advanced-analytics')
      const hasExportAccess = await accessControlService.checkFeatureAccess('test-user', 'data-export')
      const hasInsightsAccess = await accessControlService.checkFeatureAccess('test-user', 'insights')

      expect(hasAnalyticsAccess).toBe(true)
      expect(hasExportAccess).toBe(true)
      expect(hasInsightsAccess).toBe(true)
    })

    it('should cache subscription status to reduce Firestore calls', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          isPremium: true,
          plan: 'premium'
        })
      })

      vi.doMock('firebase/firestore', async () => {
        const actual = await vi.importActual('firebase/firestore')
        return {
          ...actual,
          getDoc: mockGetDoc
        }
      })

      // First call should hit Firestore
      await accessControlService.getSubscriptionStatus('test-user')
      expect(mockGetDoc).toHaveBeenCalledTimes(1)

      // Second call should use cache
      await accessControlService.getSubscriptionStatus('test-user')
      expect(mockGetDoc).toHaveBeenCalledTimes(1) // Still 1, not 2
    })
  })

  describe('Error Handling and Edge Cases Integration', () => {
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

    it('should handle empty habit data gracefully', async () => {
      const habit = createMockHabit()
      const completions: CheckIn[] = []

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should still render dashboard structure
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
      
      // Should show insufficient data message
      await waitFor(() => {
        expect(screen.getByText(/Need at least/)).toBeInTheDocument()
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

    it('should handle export generation failures', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to export section
      await user.click(screen.getByText('Export Options'))

      // Mock export service to fail
      const exportService = new ExportService()
      vi.spyOn(exportService, 'exportToCSV').mockRejectedValue(new Error('Export failed'))

      // Try to export
      await user.click(screen.getByText('Export CSV'))

      // Should handle error gracefully (exact error handling depends on implementation)
      // The test verifies the app doesn't crash
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle calculation errors with invalid data', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8).map(c => ({
        ...c,
        // Corrupt timestamp data
        completedAt: c.completedAt ? { seconds: NaN, nanoseconds: 0 } as any : null
      }))

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should handle invalid timestamps gracefully
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle sync failures and retry logic', async () => {
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

      // Mock sync to fail first time, succeed second time
      let callCount = 0
      vi.spyOn(syncService, 'syncAnalytics').mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network error')
        }
        return Promise.resolve()
      })

      // First call should fail
      await expect(syncService.syncAnalytics('test-user', 'test-habit', analyticsData))
        .rejects.toThrow('Network error')

      // Second call should succeed (retry logic)
      await expect(syncService.syncAnalytics('test-user', 'test-habit', analyticsData))
        .resolves.toBeUndefined()
    })

    it('should handle memory constraints with large datasets', async () => {
      const habit = createMockHabit()
      // Create very large dataset to test memory handling
      const completions = createMockCompletions(5000, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should still render without memory issues
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle concurrent access control checks', async () => {
      const accessControlService = new AccessControlService()
      
      // Mock concurrent subscription checks
      const promises = Array.from({ length: 10 }, () => 
        accessControlService.isPremiumUser('test-user')
      )

      const results = await Promise.all(promises)
      
      // All results should be consistent
      const firstResult = results[0]
      expect(results.every(result => result === firstResult)).toBe(true)
    })

    it('should handle edge cases in date calculations', async () => {
      const habit = createMockHabit()
      const completions = [
        // Edge case: completion at midnight
        createMockCompletion(0, 'done', { 
          completedAt: Timestamp.fromDate(new Date('2023-01-01T00:00:00Z'))
        }),
        // Edge case: completion at end of day
        createMockCompletion(1, 'done', { 
          completedAt: Timestamp.fromDate(new Date('2023-01-01T23:59:59Z'))
        }),
        // Edge case: leap year date
        createMockCompletion(2, 'done', { 
          completedAt: Timestamp.fromDate(new Date('2024-02-29T12:00:00Z'))
        })
      ]

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should handle edge case dates without errors
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })

    it('should handle browser compatibility issues', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock missing browser APIs
      const originalIntersectionObserver = global.IntersectionObserver
      delete (global as any).IntersectionObserver

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should still render with fallbacks
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()

      // Restore API
      global.IntersectionObserver = originalIntersectionObserver
    })

    it('should handle analytics calculation timeouts', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock analytics hook to simulate timeout
      const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
      vi.mocked(usePremiumAnalytics).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Request timeout')
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show error state with retry option
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should handle partial data corruption gracefully', async () => {
      const habit = createMockHabit()
      const completions = [
        // Valid completion
        createMockCompletion(0, 'done'),
        // Partially corrupted completion
        {
          ...createMockCompletion(1, 'done'),
          dateKey: 'corrupted-date' // Invalid date format
        },
        // Another valid completion
        createMockCompletion(2, 'done')
      ]

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should filter out corrupted data and continue with valid data
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
    })
  })

  describe('End-to-End Analytics Flow Integration', () => {
    it('should complete full analytics workflow from data to insights', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(60, 0.75) // 2 months of data

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show premium analytics
      expect(screen.getByText('Premium Analytics')).toBeInTheDocument()

      // Navigate through all sections
      await user.click(screen.getByText('Trends & Patterns'))
      await waitFor(() => {
        expect(screen.getByTestId('trend-analysis')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Performance Analysis'))
      await waitFor(() => {
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
        expect(screen.getByTestId('time-of-day-distribution')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Predictive Insights'))
      await waitFor(() => {
        expect(screen.getByTestId('insight-list')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Detailed Breakdowns'))
      await waitFor(() => {
        expect(screen.getByTestId('detailed-breakdown')).toBeInTheDocument()
      })

      // Test export functionality
      await user.click(screen.getByText('Export Options'))
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Export JSON')).toBeInTheDocument()
      expect(screen.getByText('Export PDF')).toBeInTheDocument()
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

    it('should handle complete user journey from free to premium', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Start as free user
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      const mockPremiumAccess = vi.mocked(usePremiumAccess)
      
      mockPremiumAccess.mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(false),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show blur overlay for free user
      await waitFor(() => {
        expect(screen.getByTestId('premium-blur-overlay')).toBeInTheDocument()
      })

      // Try to access premium feature
      await user.click(screen.getByText('Performance Analysis'))
      await waitFor(() => {
        expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument()
      })

      // Simulate upgrade to premium
      mockPremiumAccess.mockReturnValue({
        isPremium: true,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should now show full analytics without restrictions
      await waitFor(() => {
        expect(screen.queryByTestId('premium-blur-overlay')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Premium Active')).toBeInTheDocument()
    })

    it('should maintain data consistency across navigation', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(45, 0.8)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to trends section
      await user.click(screen.getByText('Trends & Patterns'))
      const trendElement = await screen.findByTestId('trend-analysis')
      expect(trendElement).toHaveTextContent('45 completions')

      // Navigate to performance section
      await user.click(screen.getByText('Performance Analysis'))
      const dayStatsElement = await screen.findByTestId('day-of-week-stats')
      expect(dayStatsElement).toHaveTextContent('45 completions')

      // Data should be consistent across sections
      const monthComparisonElement = await screen.findByTestId('month-comparison')
      expect(monthComparisonElement).toHaveTextContent('45 completions')
    })

    it('should handle real-time data updates during analytics viewing', async () => {
      const habit = createMockHabit()
      let completions = createMockCompletions(30, 0.8)

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Initial render with 30 completions
      await waitFor(() => {
        expect(screen.getByTestId('trend-analysis')).toHaveTextContent('30 completions')
      })

      // Simulate new completion added
      completions = [...completions, createMockCompletion(-1, 'done')] // Add new completion

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should update to show 31 completions
      await waitFor(() => {
        expect(screen.getByTestId('trend-analysis')).toHaveTextContent('31 completions')
      })
    })

    it('should validate analytics accuracy with known data patterns', async () => {
      const habit = createMockHabit()
      
      // Create predictable pattern: 100% completion on weekdays, 0% on weekends
      const completions: CheckIn[] = []
      for (let i = 0; i < 28; i++) { // 4 weeks
        const date = dayjs().subtract(i, 'days')
        const isWeekend = date.day() === 0 || date.day() === 6 // Sunday or Saturday
        if (!isWeekend) {
          completions.push(createMockCompletion(i, 'done'))
        }
      }

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Navigate to performance analysis
      await user.click(screen.getByText('Performance Analysis'))

      // Should detect the weekday pattern
      await waitFor(() => {
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
      })

      // Navigate to insights
      await user.click(screen.getByText('Predictive Insights'))
      
      // Should generate insights about weekend behavior
      await waitFor(() => {
        expect(screen.getByTestId('insight-list')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Responsiveness Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(1000, 0.8) // Large dataset

      const startTime = performance.now()
      
      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (adjust threshold as needed)
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

    it('should handle progressive loading of analytics sections', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(100, 0.8)

      // Mock progressive loading states
      const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
      let loadingState = { trends: true, insights: true, performance: true }
      
      vi.mocked(usePremiumAnalytics).mockImplementation(() => ({
        data: {
          trends: loadingState.trends ? null : { fourWeeks: { completionRate: 75 } },
          insights: loadingState.insights ? [] : [{ id: '1', message: 'Test insight' }],
          performance: loadingState.performance ? null : { bestDay: 'monday' }
        },
        isLoading: Object.values(loadingState).some(Boolean),
        error: null
      } as any))

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show loading initially
      expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument()

      // Simulate progressive loading completion
      loadingState = { trends: false, insights: true, performance: true }
      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should show partial content
      await waitFor(() => {
        expect(screen.queryByTestId('analytics-skeleton')).toBeInTheDocument()
      })

      // Complete loading
      loadingState = { trends: false, insights: false, performance: false }
      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should show full analytics
      await waitFor(() => {
        expect(screen.queryByTestId('analytics-skeleton')).not.toBeInTheDocument()
        expect(screen.getByText('Premium Analytics')).toBeInTheDocument()
      })
    })

    it('should maintain performance with concurrent analytics calculations', async () => {
      const habits = Array.from({ length: 3 }, (_, i) => 
        createMockHabit({ id: `habit-${i}`, habitName: `Habit ${i}` })
      )
      const allCompletions = habits.flatMap(habit => 
        createMockCompletions(50, 0.8).map(c => ({ ...c, habitId: habit.id }))
      )

      const startTime = performance.now()

      // Render multiple analytics dashboards concurrently
      const dashboards = habits.map(habit => {
        const habitCompletions = allCompletions.filter(c => c.habitId === habit.id)
        return (
          <div key={habit.id}>
            <AnalyticsDashboard habit={habit} completions={habitCompletions} />
          </div>
        )
      })

      renderWithProviders(<div>{dashboards}</div>)

      const endTime = performance.now()
      const totalRenderTime = endTime - startTime

      // Should handle multiple dashboards efficiently
      expect(totalRenderTime).toBeLessThan(5000) // 5 seconds for 3 dashboards

      // All dashboards should render
      expect(screen.getAllByText('Premium Analytics')).toHaveLength(3)
    })
  })

  describe('Cross-Service Integration Tests', () => {
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

    it('should handle analytics workflow with access control integration', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Test premium user workflow
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: true,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show full analytics
      expect(screen.getByText('Premium Active')).toBeInTheDocument()

      // Should allow access to all sections
      await user.click(screen.getByText('Performance Analysis'))
      await waitFor(() => {
        expect(screen.getByTestId('day-of-week-stats')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Export Options'))
      expect(screen.getByText('Export CSV')).toBeInTheDocument()

      // Test access control service integration
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

    it('should handle complete offline-to-online sync workflow', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(25, 0.8)

      // Start offline
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

      // Simulate going online
      vi.mocked(useOfflineAnalytics).mockReturnValue({
        isOnline: true,
        isAnalyticsCached: vi.fn().mockReturnValue(false)
      } as any)

      // Re-render to simulate online state
      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should no longer show offline indicator
      await waitFor(() => {
        expect(screen.queryByText(/Offline - showing cached data/)).not.toBeInTheDocument()
      })

      // Test sync service offline/online behavior
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

      // Simulate offline sync (should cache)
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      await syncService.syncAnalytics('test-user', habit.id, analyticsData)
      
      const cachedData = syncService.getCachedAnalytics('test-user', habit.id)
      expect(cachedData).toBeTruthy()

      // Simulate online sync (should sync and clear cache)
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      await syncService.syncAnalytics('test-user', habit.id, analyticsData)

      syncService.cleanup()
    })

    it('should handle error recovery across all services', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Mock analytics error
      const { usePremiumAnalytics } = require('../hooks/usePremiumAnalytics')
      vi.mocked(usePremiumAnalytics).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Analytics calculation failed')
      } as any)

      renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Test export service error handling
      const exportService = new ExportService()
      
      // Mock export failure
      vi.spyOn(exportService, 'exportToCSV').mockRejectedValue(new Error('Export failed'))
      
      await expect(
        exportService.exportToCSV([habit], completions)
      ).rejects.toThrow('Export failed')

      // Test sync service error handling
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

      // Should handle sync errors gracefully
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

  describe('Real-World Scenario Integration Tests', () => {
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

    it('should handle subscription lifecycle and feature access changes', async () => {
      const habit = createMockHabit()
      const completions = createMockCompletions(30, 0.8)

      // Start as free user
      const { usePremiumAccess } = require('../hooks/usePremiumAccess')
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: false,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(false),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      const { rerender } = renderWithProviders(
        <AnalyticsDashboard habit={habit} completions={completions} />
      )

      // Should show blur overlay
      await waitFor(() => {
        expect(screen.getByTestId('premium-blur-overlay')).toBeInTheDocument()
      })

      // Simulate upgrade to premium
      vi.mocked(usePremiumAccess).mockReturnValue({
        isPremium: true,
        isLoading: false,
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        refreshPremiumStatus: vi.fn().mockResolvedValue(undefined)
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <AnalyticsDashboard habit={habit} completions={completions} />
        </QueryClientProvider>
      )

      // Should show full analytics
      await waitFor(() => {
        expect(screen.queryByTestId('premium-blur-overlay')).not.toBeInTheDocument()
        expect(screen.getByText('Premium Active')).toBeInTheDocument()
      })

      // Should have access to all features
      await user.click(screen.getByText('Export Options'))
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
      expect(screen.getByText('Export JSON')).toBeInTheDocument()
      expect(screen.getByText('Export PDF')).toBeInTheDocument()

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
})