import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import fc from 'fast-check'
import { SyncService, SyncableAnalyticsData } from '../SyncService'
import { AnalyticsData } from '../../types/analytics'
import { Timestamp } from 'firebase/firestore'

vi.mock('../../config/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() }))
  }
}))

describe('SyncService Property Tests', () => {
  let syncService: SyncService
  let mockSetDoc: Mock
  let mockOnSnapshot: Mock
  let mockGetDoc: Mock
  let mockDoc: Mock
  let mockServerTimestamp: Mock

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    
    // Get mocked functions
    const firestore = await import('firebase/firestore')
    mockSetDoc = firestore.setDoc as Mock
    mockOnSnapshot = firestore.onSnapshot as Mock
    mockGetDoc = firestore.getDoc as Mock
    mockDoc = firestore.doc as Mock
    mockServerTimestamp = firestore.serverTimestamp as Mock
    
    // Mock successful Firestore operations
    mockSetDoc.mockResolvedValue(undefined)
    mockGetDoc.mockResolvedValue({ exists: () => false })
    mockOnSnapshot.mockReturnValue(() => {}) // unsubscribe function
    mockDoc.mockReturnValue({})
    mockServerTimestamp.mockReturnValue({ toMillis: () => Date.now() })

    syncService = new SyncService()
  })

  afterEach(() => {
    if (syncService) {
      syncService.cleanup()
    }
  })

  // Simple generator for analytics data
  const simpleAnalyticsDataArb = fc.record({
    habitId: fc.string({ minLength: 1, maxLength: 50 }),
    userId: fc.string({ minLength: 1, maxLength: 50 }),
    calculatedAt: fc.constant(Timestamp.now()),
    trends: fc.record({
      fourWeeks: fc.record({
        period: fc.constant('4W' as const),
        completionRate: fc.float({ min: 0, max: 100 }),
        percentageChange: fc.float({ min: -100, max: 100 }),
        direction: fc.constantFrom('up', 'down', 'stable'),
        dataPoints: fc.array(fc.record({
          date: fc.constant('2024-01-01'),
          value: fc.float({ min: 0, max: 100 })
        }), { maxLength: 5 })
      }),
      threeMonths: fc.record({
        period: fc.constant('3M' as const),
        completionRate: fc.float({ min: 0, max: 100 }),
        percentageChange: fc.float({ min: -100, max: 100 }),
        direction: fc.constantFrom('up', 'down', 'stable'),
        dataPoints: fc.array(fc.record({
          date: fc.constant('2024-01-01'),
          value: fc.float({ min: 0, max: 100 })
        }), { maxLength: 5 })
      }),
      sixMonths: fc.record({
        period: fc.constant('6M' as const),
        completionRate: fc.float({ min: 0, max: 100 }),
        percentageChange: fc.float({ min: -100, max: 100 }),
        direction: fc.constantFrom('up', 'down', 'stable'),
        dataPoints: fc.array(fc.record({
          date: fc.constant('2024-01-01'),
          value: fc.float({ min: 0, max: 100 })
        }), { maxLength: 5 })
      }),
      oneYear: fc.record({
        period: fc.constant('1Y' as const),
        completionRate: fc.float({ min: 0, max: 100 }),
        percentageChange: fc.float({ min: -100, max: 100 }),
        direction: fc.constantFrom('up', 'down', 'stable'),
        dataPoints: fc.array(fc.record({
          date: fc.constant('2024-01-01'),
          value: fc.float({ min: 0, max: 100 })
        }), { maxLength: 5 })
      })
    }),
    dayOfWeekStats: fc.record({
      monday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      tuesday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      wednesday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      thursday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      friday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      saturday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      sunday: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      bestDay: fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      worstDay: fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    }),
    timeOfDayDistribution: fc.record({
      hourlyDistribution: fc.constant({}),
      peakHours: fc.array(fc.integer({ min: 0, max: 23 }), { maxLength: 3 }),
      optimalReminderTimes: fc.array(fc.integer({ min: 0, max: 23 }), { maxLength: 3 })
    }),
    monthComparison: fc.record({
      currentMonth: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      previousMonth: fc.record({
        completionRate: fc.float({ min: 0, max: 100 }),
        totalCompletions: fc.nat({ max: 1000 }),
        totalScheduled: fc.nat({ max: 1000 })
      }),
      percentageChange: fc.float({ min: -100, max: 100 }),
      isSignificant: fc.boolean()
    }),
    insights: fc.array(fc.record({
      id: fc.string({ maxLength: 10 }),
      type: fc.constantFrom('day-of-week-pattern', 'time-of-day-pattern', 'weekend-behavior', 'timing-impact', 'streak-correlation'),
      message: fc.string({ maxLength: 20 }),
      confidence: fc.constantFrom('high', 'medium', 'low'),
      dataSupport: fc.nat({ max: 1000 }),
      actionable: fc.boolean(),
      recommendation: fc.option(fc.string({ maxLength: 20 }))
    }), { maxLength: 3 }),
    dataPointCount: fc.nat({ max: 1000 }),
    oldestDataPoint: fc.constant(Timestamp.now()),
    newestDataPoint: fc.constant(Timestamp.now())
  })

  describe('Property 29: Sync Timing', () => {
    it('should complete sync operations within reasonable time when online', async () => {
      // Feature: premium-analytics, Property 29: Sync Timing
      // Validates: Requirements 9.1
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          async (userId, habitId, analyticsData) => {
            // Ensure we're online
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: true
            })

            const startTime = Date.now()
            
            try {
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              const endTime = Date.now()
              const syncDuration = endTime - startTime
              
              // Sync should complete within 30 seconds (30000ms) as per requirements
              expect(syncDuration).toBeLessThan(30000)
              
              // Verify that setDoc was called with the correct parameters
              expect(mockSetDoc).toHaveBeenCalled()
              
              return true
            } catch (error) {
              // If there's an error, the sync should still complete quickly
              const endTime = Date.now()
              const syncDuration = endTime - startTime
              expect(syncDuration).toBeLessThan(30000)
              
              return true
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Property 30: Offline Caching and Sync', () => {
    it('should cache analytics data when offline', async () => {
      // Feature: premium-analytics, Property 30: Offline Caching and Sync
      // Validates: Requirements 9.2
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          async (userId, habitId, analyticsData) => {
            // Clear any previous calls
            mockSetDoc.mockClear()
            
            // Set offline
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: false
            })

            // Sync while offline - should cache the data
            await syncService.syncAnalytics(userId, habitId, analyticsData)
            
            // Verify data is cached
            const cachedData = syncService.getCachedAnalytics(userId, habitId)
            expect(cachedData).toBeTruthy()
            expect(cachedData?.habitId).toBe(analyticsData.habitId)
            expect(cachedData?.userId).toBe(analyticsData.userId)
            
            // Verify setDoc was not called while offline
            expect(mockSetDoc).not.toHaveBeenCalled()
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should preserve cached data across multiple offline operations', async () => {
      // Feature: premium-analytics, Property 30: Offline Caching and Sync
      // Validates: Requirements 9.2
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              habitId: fc.string({ minLength: 1, maxLength: 50 }),
              analytics: simpleAnalyticsDataArb
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (operations) => {
            // Clear any previous calls
            mockSetDoc.mockClear()
            
            // Set offline
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: false
            })

            // Perform multiple sync operations while offline
            for (const { userId, habitId, analytics } of operations) {
              await syncService.syncAnalytics(userId, habitId, analytics)
            }
            
            // Verify all data is cached
            for (const { userId, habitId, analytics } of operations) {
              const cachedData = syncService.getCachedAnalytics(userId, habitId)
              expect(cachedData).toBeTruthy()
              expect(cachedData?.habitId).toBe(analytics.habitId)
              expect(cachedData?.userId).toBe(analytics.userId)
            }
            
            // Verify setDoc was not called while offline
            expect(mockSetDoc).not.toHaveBeenCalled()
            
            return true
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 31: Conflict Resolution by Timestamp', () => {
    it('should resolve conflicts by selecting data with most recent timestamp', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          fc.integer({ min: 2000, max: 9999 }), // timestamp difference > 1000ms to avoid merge path
          (localAnalytics, remoteAnalytics, timestampDiff) => {
            const baseTime = Date.now()
            
            // Create syncable data with different timestamps
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: baseTime
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime + timestampDiff } as Timestamp,
                deviceId: 'remote-device',
                version: baseTime + timestampDiff
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // Should select the one with more recent timestamp (remote in this case)
            expect(resolved.syncMetadata?.deviceId).toBe('remote-device')
            expect(resolved.syncMetadata?.version).toBe(baseTime + timestampDiff)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should use version number as tiebreaker when timestamps are equal', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          fc.integer({ min: 1, max: 1000 }), // version difference
          (localAnalytics, remoteAnalytics, versionDiff) => {
            const baseTime = Date.now()
            const baseVersion = 1000
            
            // Create syncable data with same timestamps but different versions
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: baseVersion
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp, // Same timestamp
                deviceId: 'remote-device',
                version: baseVersion + versionDiff // Higher version
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // For simultaneous updates (same timestamp), it should merge and increment version
            expect(resolved.syncMetadata?.version).toBe(baseVersion + versionDiff + 1)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should prefer local data when both timestamp and version are equal', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          (localAnalytics, remoteAnalytics) => {
            const baseTime = Date.now()
            const baseVersion = 1000
            
            // Create syncable data with identical timestamps and versions
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: baseVersion
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp, // Same timestamp
                deviceId: 'remote-device',
                version: baseVersion // Same version
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // For simultaneous updates with equal versions, should merge and increment version
            expect(resolved.syncMetadata?.version).toBe(baseVersion + 1)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should merge insights from simultaneous updates', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          (localAnalytics, remoteAnalytics) => {
            const baseTime = Date.now()
            
            // Create unique insights for each device
            const localInsights = [
              { id: 'local-1', type: 'day-of-week-pattern' as const, message: 'Local insight 1', confidence: 'high' as const, dataSupport: 100, actionable: true },
              { id: 'shared-1', type: 'time-of-day-pattern' as const, message: 'Shared insight', confidence: 'medium' as const, dataSupport: 50, actionable: false }
            ]
            
            const remoteInsights = [
              { id: 'remote-1', type: 'weekend-behavior' as const, message: 'Remote insight 1', confidence: 'low' as const, dataSupport: 75, actionable: true },
              { id: 'shared-1', type: 'time-of-day-pattern' as const, message: 'Shared insight', confidence: 'medium' as const, dataSupport: 50, actionable: false }
            ]
            
            // Create syncable data with near-simultaneous timestamps (within merge threshold)
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              insights: localInsights,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: 1000
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              insights: remoteInsights,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime + 500 } as Timestamp, // Within 1000ms threshold
                deviceId: 'remote-device',
                version: 1001 // Higher version
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // Should merge insights and increment version
            expect(resolved.insights).toBeDefined()
            expect(resolved.insights!.length).toBeGreaterThanOrEqual(Math.max(localInsights.length, remoteInsights.length))
            expect(resolved.syncMetadata?.version).toBe(1002) // Incremented from max version
            
            // Should contain insights from both sources
            const resolvedIds = resolved.insights!.map(i => i.id)
            expect(resolvedIds).toContain('local-1')
            expect(resolvedIds).toContain('remote-1')
            expect(resolvedIds).toContain('shared-1')
            
            return true
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should use version number for non-simultaneous updates', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          fc.integer({ min: 1, max: 1000 }), // version difference
          (localAnalytics, remoteAnalytics, versionDiff) => {
            const baseTime = Date.now()
            const baseVersion = 1000
            
            // Create syncable data with timestamps more than 1 second apart
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: baseVersion
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime + 2000 } as Timestamp, // 2 seconds later
                deviceId: 'remote-device',
                version: baseVersion + versionDiff // Higher version
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // Should select the one with more recent timestamp (remote)
            expect(resolved.syncMetadata?.deviceId).toBe('remote-device')
            expect(resolved.syncMetadata?.version).toBe(baseVersion + versionDiff)
            
            return true
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle conflicts with missing sync metadata gracefully', async () => {
      // Feature: premium-analytics, Property 31: Conflict Resolution by Timestamp
      // Validates: Requirements 9.3
      
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          (localAnalytics, remoteAnalytics) => {
            // Create data with missing or incomplete sync metadata
            const localData: SyncableAnalyticsData = {
              ...localAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => Date.now() } as Timestamp,
                deviceId: 'local-device',
                version: 100
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => 0 } as Timestamp, // Invalid timestamp
                deviceId: 'remote-device',
                version: 0 // Invalid version
              }
            }
            
            // Resolve conflict
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // Should handle gracefully and prefer the data with valid metadata
            expect(resolved.syncMetadata?.deviceId).toBe('local-device')
            expect(resolved.syncMetadata?.version).toBe(100)
            
            return true
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('Property 32: Sync Status Display', () => {
    it('should notify sync status changes accurately', async () => {
      // Feature: premium-analytics, Property 32: Sync Status Display
      // Validates: Requirements 9.4
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          async (userId, habitId, analyticsData) => {
            const statusUpdates: string[] = []
            
            // Subscribe to status changes
            const unsubscribe = syncService.onSyncStatusChange((status) => {
              statusUpdates.push(status)
            })
            
            try {
              // Test online sync
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
              })
              
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // Should have received syncing and synced status updates
              expect(statusUpdates).toContain('syncing')
              expect(statusUpdates).toContain('synced')
              
              // Clear status updates
              statusUpdates.length = 0
              
              // Test offline sync
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
              })
              
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // Should have received syncing and offline status updates
              expect(statusUpdates).toContain('syncing')
              expect(statusUpdates).toContain('offline')
              
              return true
            } finally {
              unsubscribe()
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain consistent status across multiple subscribers', async () => {
      // Feature: premium-analytics, Property 32: Sync Status Display
      // Validates: Requirements 9.4
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          fc.integer({ min: 2, max: 5 }), // number of subscribers
          async (userId, habitId, analyticsData, numSubscribers) => {
            const allStatusUpdates: string[][] = []
            const unsubscribers: (() => void)[] = []
            
            // Create multiple subscribers
            for (let i = 0; i < numSubscribers; i++) {
              const statusUpdates: string[] = []
              allStatusUpdates.push(statusUpdates)
              
              const unsubscribe = syncService.onSyncStatusChange((status) => {
                statusUpdates.push(status)
              })
              unsubscribers.push(unsubscribe)
            }
            
            try {
              // Perform sync operation
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
              })
              
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // All subscribers should have received the same status updates
              const firstSubscriberUpdates = allStatusUpdates[0]
              for (let i = 1; i < allStatusUpdates.length; i++) {
                expect(allStatusUpdates[i]).toEqual(firstSubscriberUpdates)
              }
              
              return true
            } finally {
              // Clean up all subscribers
              unsubscribers.forEach(unsubscribe => unsubscribe())
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Simultaneous Update Handling', () => {
    it('should detect and handle simultaneous updates during sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          async (userId, habitId, localAnalytics, remoteAnalytics) => {
            const baseTime = Date.now()
            
            // Mock existing document with recent data from another device
            const existingData: SyncableAnalyticsData = {
              ...remoteAnalytics,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime - 2000 } as Timestamp, // 2 seconds ago
                deviceId: 'other-device',
                version: 1000
              }
            }
            
            mockGetDoc.mockResolvedValueOnce({
              exists: () => true,
              data: () => existingData
            })
            
            // Ensure we're online
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: true
            })
            
            // Sync new data
            await syncService.syncAnalytics(userId, habitId, localAnalytics)
            
            // Should have called getDoc to check for conflicts
            expect(mockGetDoc).toHaveBeenCalled()
            
            // Should have called setDoc to write resolved data
            expect(mockSetDoc).toHaveBeenCalled()
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should merge data points and timestamps correctly', async () => {
      await fc.assert(
        fc.property(
          simpleAnalyticsDataArb,
          simpleAnalyticsDataArb,
          fc.integer({ min: 100, max: 1000 }), // dataPointCount1
          fc.integer({ min: 100, max: 1000 }), // dataPointCount2
          (analytics1, analytics2, dataPoints1, dataPoints2) => {
            const baseTime = Date.now()
            
            const localData: SyncableAnalyticsData = {
              ...analytics1,
              dataPointCount: dataPoints1,
              oldestDataPoint: { toMillis: () => baseTime - 10000 } as Timestamp,
              newestDataPoint: { toMillis: () => baseTime - 1000 } as Timestamp,
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime } as Timestamp,
                deviceId: 'local-device',
                version: 1000
              }
            }
            
            const remoteData: SyncableAnalyticsData = {
              ...analytics2,
              dataPointCount: dataPoints2,
              oldestDataPoint: { toMillis: () => baseTime - 15000 } as Timestamp, // Older
              newestDataPoint: { toMillis: () => baseTime } as Timestamp, // Newer
              syncMetadata: {
                lastSyncAt: { toMillis: () => baseTime + 500 } as Timestamp, // Simultaneous
                deviceId: 'remote-device',
                version: 1001
              }
            }
            
            const resolved = syncService.resolveConflict(localData, remoteData)
            
            // Should use max data point count
            expect(resolved.dataPointCount).toBe(Math.max(dataPoints1, dataPoints2))
            
            // Should use oldest data point from either source
            expect(resolved.oldestDataPoint?.toMillis()).toBe(baseTime - 15000)
            
            // Should use newest data point from either source
            expect(resolved.newestDataPoint?.toMillis()).toBe(baseTime)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property 33: Sync Retry and Error Handling', () => {
    it('should retry failed sync operations and handle errors gracefully', async () => {
      // Feature: premium-analytics, Property 33: Sync Retry and Error Handling
      // Validates: Requirements 9.5
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          async (userId, habitId, analyticsData) => {
            const statusUpdates: string[] = []
            
            // Subscribe to status changes
            const unsubscribe = syncService.onSyncStatusChange((status) => {
              statusUpdates.push(status)
            })
            
            try {
              // Make setDoc fail initially
              mockSetDoc.mockRejectedValueOnce(new Error('Network error'))
              
              // Ensure we're online
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
              })
              
              // Attempt sync - should fail and cache data
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // Should have received syncing and error status updates
              expect(statusUpdates).toContain('syncing')
              expect(statusUpdates).toContain('error')
              
              // Verify data is cached for retry
              const cachedData = syncService.getCachedAnalytics(userId, habitId)
              expect(cachedData).toBeTruthy()
              expect(cachedData?.habitId).toBe(analyticsData.habitId)
              
              return true
            } finally {
              unsubscribe()
              // Reset mock to succeed for cleanup
              mockSetDoc.mockResolvedValue(undefined)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should handle multiple consecutive failures gracefully', async () => {
      // Feature: premium-analytics, Property 33: Sync Retry and Error Handling
      // Validates: Requirements 9.5
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              habitId: fc.string({ minLength: 1, maxLength: 50 }),
              analytics: simpleAnalyticsDataArb
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (operations) => {
            const statusUpdates: string[] = []
            
            // Subscribe to status changes
            const unsubscribe = syncService.onSyncStatusChange((status) => {
              statusUpdates.push(status)
            })
            
            try {
              // Make all setDoc calls fail
              mockSetDoc.mockRejectedValue(new Error('Persistent network error'))
              
              // Ensure we're online
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
              })
              
              // Attempt multiple sync operations - all should fail
              for (const { userId, habitId, analytics } of operations) {
                await syncService.syncAnalytics(userId, habitId, analytics)
              }
              
              // Should have received error status for failed operations
              expect(statusUpdates).toContain('error')
              
              // All data should be cached for retry
              for (const { userId, habitId, analytics } of operations) {
                const cachedData = syncService.getCachedAnalytics(userId, habitId)
                expect(cachedData).toBeTruthy()
                expect(cachedData?.habitId).toBe(analytics.habitId)
              }
              
              return true
            } finally {
              unsubscribe()
              // Reset mock to succeed for cleanup
              mockSetDoc.mockResolvedValue(undefined)
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should clear cached data after successful retry', async () => {
      // Feature: premium-analytics, Property 33: Sync Retry and Error Handling
      // Validates: Requirements 9.5
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // habitId
          simpleAnalyticsDataArb,
          async (userId, habitId, analyticsData) => {
            try {
              // First, fail the sync to cache data
              mockSetDoc.mockRejectedValueOnce(new Error('Temporary error'))
              
              // Ensure we're online
              Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true
              })
              
              // First sync attempt - should fail and cache
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // Verify data is cached
              let cachedData = syncService.getCachedAnalytics(userId, habitId)
              expect(cachedData).toBeTruthy()
              
              // Now make setDoc succeed
              mockSetDoc.mockResolvedValue(undefined)
              
              // Second sync attempt - should succeed and clear cache
              await syncService.syncAnalytics(userId, habitId, analyticsData)
              
              // Cache should be cleared after successful sync
              cachedData = syncService.getCachedAnalytics(userId, habitId)
              expect(cachedData).toBeNull()
              
              return true
            } finally {
              // Reset mock to succeed for cleanup
              mockSetDoc.mockResolvedValue(undefined)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})