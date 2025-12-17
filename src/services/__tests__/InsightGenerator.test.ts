import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { InsightGenerator } from '../InsightGenerator'
import { CheckIn } from '../../hooks/useHabits'
import { DayOfWeekStats, TimeDistribution, DayOfWeek } from '../../types/analytics'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

describe('InsightGenerator', () => {
  const generator = new InsightGenerator()

  describe('Property 19: Insight Generation Threshold', () => {
    /**
     * Feature: premium-analytics, Property 19: Insight Generation Threshold
     * Validates: Requirements 5.1
     * 
     * For any habit with at least 4 weeks of historical data, predictive insights 
     * should be generated based on detected patterns.
     */
    it('should generate insights when data meets minimum threshold (28+ days) and patterns exist', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 28, max: 100 }), // number of days of data (>= 28)
          fc.float({ min: 20, max: 100 }), // best day rate
          fc.float({ min: 0, max: 60 }), // worst day rate (ensuring variance > 15%)
          (numDays, bestRate, worstRate) => {
            // Ensure variance is > 15%
            if (bestRate - worstRate <= 15) {
              return true // Skip cases without sufficient variance
            }
            
            // Create completions with sufficient data
            const now = dayjs()
            const completions: CheckIn[] = []
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create mock day of week stats with significant variance
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: bestRate, totalCompletions: 5, totalScheduled: 5 },
              tuesday: { completionRate: 70, totalCompletions: 4, totalScheduled: 5 },
              wednesday: { completionRate: 75, totalCompletions: 4, totalScheduled: 5 },
              thursday: { completionRate: 65, totalCompletions: 3, totalScheduled: 5 },
              friday: { completionRate: worstRate, totalCompletions: 2, totalScheduled: 5 },
              saturday: { completionRate: 80, totalCompletions: 4, totalScheduled: 5 },
              sunday: { completionRate: 60, totalCompletions: 3, totalScheduled: 5 },
              bestDay: 'monday',
              worstDay: 'friday'
            }
            
            // Create mock time distribution
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // With sufficient data (>= 28 days) AND patterns (variance > 15%), 
            // insights should be generated
            expect(insights).toBeDefined()
            expect(Array.isArray(insights)).toBe(true)
            expect(insights.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate insights with insufficient data (< 28 days)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 27 }), // number of days of data (< 28)
          (numDays) => {
            // Create completions with insufficient data
            const now = dayjs()
            const completions: CheckIn[] = []
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create mock stats
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: 100, totalCompletions: 0, totalScheduled: 0 },
              tuesday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              wednesday: { completionRate: 75, totalCompletions: 0, totalScheduled: 0 },
              thursday: { completionRate: 80, totalCompletions: 0, totalScheduled: 0 },
              friday: { completionRate: 60, totalCompletions: 0, totalScheduled: 0 },
              saturday: { completionRate: 90, totalCompletions: 0, totalScheduled: 0 },
              sunday: { completionRate: 40, totalCompletions: 0, totalScheduled: 0 },
              bestDay: 'monday',
              worstDay: 'sunday'
            }
            
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // With insufficient data (< 28 days), no insights should be generated
            expect(insights).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 20: Day-of-Week Insight Generation', () => {
    /**
     * Feature: premium-analytics, Property 20: Day-of-Week Insight Generation
     * Validates: Requirements 5.2
     * 
     * For any dataset where day-of-week patterns are detected (completion rate variance > 15% between days), 
     * insights about likelihood of completion on specific days should be generated.
     */
    it('should generate day-of-week insights when variance > 15%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 20, max: 100 }), // best day rate
          fc.float({ min: 0, max: 50 }), // worst day rate (ensuring variance > 15%)
          (bestRate, worstRate) => {
            // Ensure variance is > 15%
            if (bestRate - worstRate <= 15) {
              return true // Skip this case
            }
            
            // Create sufficient completions (28+ days)
            const now = dayjs()
            const completions: CheckIn[] = []
            const numDays = 35 // 5 weeks
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create day of week stats with significant variance
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: bestRate, totalCompletions: 5, totalScheduled: 5 },
              tuesday: { completionRate: 70, totalCompletions: 4, totalScheduled: 5 },
              wednesday: { completionRate: 75, totalCompletions: 4, totalScheduled: 5 },
              thursday: { completionRate: 65, totalCompletions: 3, totalScheduled: 5 },
              friday: { completionRate: worstRate, totalCompletions: 2, totalScheduled: 5 },
              saturday: { completionRate: 80, totalCompletions: 4, totalScheduled: 5 },
              sunday: { completionRate: 60, totalCompletions: 3, totalScheduled: 5 },
              bestDay: 'monday',
              worstDay: 'friday'
            }
            
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should generate at least one day-of-week pattern insight
            const dayPatternInsights = insights.filter(i => i.type === 'day-of-week-pattern')
            expect(dayPatternInsights.length).toBeGreaterThan(0)
            
            // Insight should mention best and worst days
            const insight = dayPatternInsights[0]
            expect(insight.message).toContain('Monday')
            expect(insight.message).toContain('Friday')
            expect(insight.actionable).toBe(true)
            expect(insight.recommendation).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate day-of-week insights when variance <= 15%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 65 }), // rates with low variance
          (baseRate) => {
            // Skip invalid values
            if (!Number.isFinite(baseRate)) {
              return true
            }
            
            // Create completions
            const now = dayjs()
            const completions: CheckIn[] = []
            const numDays = 35
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create day of week stats with low variance (<= 15%)
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: baseRate, totalCompletions: 5, totalScheduled: 5 },
              tuesday: { completionRate: baseRate + 5, totalCompletions: 5, totalScheduled: 5 },
              wednesday: { completionRate: baseRate + 3, totalCompletions: 5, totalScheduled: 5 },
              thursday: { completionRate: baseRate + 7, totalCompletions: 5, totalScheduled: 5 },
              friday: { completionRate: baseRate + 10, totalCompletions: 5, totalScheduled: 5 },
              saturday: { completionRate: baseRate + 2, totalCompletions: 5, totalScheduled: 5 },
              sunday: { completionRate: baseRate + 8, totalCompletions: 5, totalScheduled: 5 },
              bestDay: 'friday',
              worstDay: 'monday'
            }
            
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should not generate day-of-week pattern insights when variance is low
            const dayPatternInsights = insights.filter(i => i.type === 'day-of-week-pattern')
            expect(dayPatternInsights.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 21: Time-of-Day Insight Generation', () => {
    /**
     * Feature: premium-analytics, Property 21: Time-of-Day Insight Generation
     * Validates: Requirements 5.3
     * 
     * For any dataset where time-of-day patterns are detected (clear peak hours), 
     * insights about optimal completion times should be generated.
     */
    it('should generate time-of-day insights when peak hours represent >30% of completions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }), // peak hour
          fc.integer({ min: 30, max: 60 }), // number of completions (ensure enough for 14+ days)
          (peakHour, numCompletions) => {
            // Ensure we have at least 28 days of data (requirement for insights)
            if (numCompletions < 28) {
              return true // Skip insufficient data
            }
            
            // Create completions with at least 28 days of data
            const now = dayjs()
            const completions: CheckIn[] = []
            
            // 70% of completions at peak hour, 30% distributed elsewhere
            const peakCompletions = Math.floor(numCompletions * 0.7)
            const otherCompletions = numCompletions - peakCompletions
            
            // Add peak hour completions
            for (let i = 0; i < peakCompletions; i++) {
              const date = now.subtract(i, 'day').hour(peakHour).minute(0).second(0)
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Add other completions at different hours
            for (let i = 0; i < otherCompletions; i++) {
              const otherHour = (peakHour + i + 1) % 24
              const date = now.subtract(peakCompletions + i, 'day').hour(otherHour).minute(0).second(0)
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create time distribution
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            hourlyDistribution[peakHour] = peakCompletions
            
            // Distribute other completions
            for (let i = 0; i < otherCompletions; i++) {
              const otherHour = (peakHour + i + 1) % 24
              hourlyDistribution[otherHour] = (hourlyDistribution[otherHour] || 0) + 1
            }
            
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [peakHour],
              optimalReminderTimes: [(peakHour - 1 + 24) % 24]
            }
            
            // Create mock day stats with low variance (so only time insights are generated)
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              tuesday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              wednesday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              thursday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              friday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              saturday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              sunday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              bestDay: 'monday',
              worstDay: 'sunday'
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should generate time-of-day pattern insight
            const timePatternInsights = insights.filter(i => i.type === 'time-of-day-pattern')
            expect(timePatternInsights.length).toBeGreaterThan(0)
            
            // Insight should mention the peak hour and provide recommendation
            const insight = timePatternInsights[0]
            expect(insight.actionable).toBe(true)
            expect(insight.recommendation).toBeDefined()
            // Should mention a high percentage (>60% since we set 70% but rounding may vary)
            expect(insight.message).toMatch(/\d{2}%/) // Should contain a percentage
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate time-of-day insights when peak hours represent <=30% of completions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 50 }), // number of completions
          (numCompletions) => {
            // Create completions evenly distributed across hours
            const now = dayjs()
            const completions: CheckIn[] = []
            
            for (let i = 0; i < numCompletions; i++) {
              const hour = i % 24 // Distribute evenly
              const date = now.subtract(i, 'day').hour(hour).minute(0).second(0)
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create time distribution with even distribution
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = Math.floor(numCompletions / 24)
            }
            
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [9], // Even though there's a peak hour, percentage is low
              optimalReminderTimes: [8]
            }
            
            // Create mock day stats
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              tuesday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              wednesday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              thursday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              friday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              saturday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              sunday: { completionRate: 50, totalCompletions: 0, totalScheduled: 0 },
              bestDay: 'monday',
              worstDay: 'sunday'
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should not generate time-of-day pattern insights when distribution is even
            const timePatternInsights = insights.filter(i => i.type === 'time-of-day-pattern')
            expect(timePatternInsights.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 22: Weekend Behavior Insight', () => {
    /**
     * Feature: premium-analytics, Property 22: Weekend Behavior Insight
     * Validates: Requirements 5.4
     * 
     * For any dataset where weekend completion rates differ from weekday rates by more than 15%, 
     * insights about weekend behavior should be generated.
     */
    it('should generate weekend behavior insights when difference > 15%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 20, max: 100 }), // weekend rate
          fc.float({ min: 0, max: 70 }), // weekday rate
          (weekendRate, weekdayRate) => {
            // Ensure difference is > 15%
            if (Math.abs(weekendRate - weekdayRate) <= 15) {
              return true // Skip this case
            }
            
            // Create sufficient completions
            const now = dayjs()
            const completions: CheckIn[] = []
            const numDays = 35
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create day of week stats with weekend/weekday difference
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: weekdayRate, totalCompletions: 5, totalScheduled: 5 },
              tuesday: { completionRate: weekdayRate, totalCompletions: 5, totalScheduled: 5 },
              wednesday: { completionRate: weekdayRate, totalCompletions: 5, totalScheduled: 5 },
              thursday: { completionRate: weekdayRate, totalCompletions: 5, totalScheduled: 5 },
              friday: { completionRate: weekdayRate, totalCompletions: 5, totalScheduled: 5 },
              saturday: { completionRate: weekendRate, totalCompletions: 5, totalScheduled: 5 },
              sunday: { completionRate: weekendRate, totalCompletions: 5, totalScheduled: 5 },
              bestDay: weekendRate > weekdayRate ? 'saturday' : 'monday',
              worstDay: weekendRate > weekdayRate ? 'monday' : 'saturday'
            }
            
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should generate weekend behavior insight
            const weekendInsights = insights.filter(i => i.type === 'weekend-behavior')
            expect(weekendInsights.length).toBeGreaterThan(0)
            
            // Insight should mention weekends and weekdays
            const insight = weekendInsights[0]
            expect(insight.message.toLowerCase()).toMatch(/weekend|weekday/)
            expect(insight.actionable).toBe(true)
            expect(insight.recommendation).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate weekend behavior insights when difference <= 15%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50, max: 65 }), // base rate with low variance
          (baseRate) => {
            // Skip invalid values
            if (!Number.isFinite(baseRate)) {
              return true
            }
            
            // Create completions
            const now = dayjs()
            const completions: CheckIn[] = []
            const numDays = 35
            
            for (let i = 0; i < numDays; i++) {
              const date = now.subtract(i, 'day')
              completions.push({
                dateKey: date.format('YYYY-MM-DD'),
                completedAt: Timestamp.fromDate(date.toDate()),
                habitId: 'test-habit',
                status: 'done',
                isCompleted: true
              })
            }
            
            // Create day of week stats with similar weekend/weekday rates
            const dayOfWeekStats: DayOfWeekStats = {
              monday: { completionRate: baseRate, totalCompletions: 5, totalScheduled: 5 },
              tuesday: { completionRate: baseRate + 2, totalCompletions: 5, totalScheduled: 5 },
              wednesday: { completionRate: baseRate + 1, totalCompletions: 5, totalScheduled: 5 },
              thursday: { completionRate: baseRate + 3, totalCompletions: 5, totalScheduled: 5 },
              friday: { completionRate: baseRate - 1, totalCompletions: 5, totalScheduled: 5 },
              saturday: { completionRate: baseRate + 5, totalCompletions: 5, totalScheduled: 5 },
              sunday: { completionRate: baseRate + 4, totalCompletions: 5, totalScheduled: 5 },
              bestDay: 'saturday',
              worstDay: 'friday'
            }
            
            const hourlyDistribution: Record<number, number> = {}
            for (let h = 0; h < 24; h++) {
              hourlyDistribution[h] = 0
            }
            const timeDistribution: TimeDistribution = {
              hourlyDistribution,
              peakHours: [],
              optimalReminderTimes: []
            }
            
            // Generate insights
            const insights = generator.generateInsights(completions, dayOfWeekStats, timeDistribution)
            
            // Should not generate weekend behavior insights when difference is small
            const weekendInsights = insights.filter(i => i.type === 'weekend-behavior')
            expect(weekendInsights.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly identify whether weekends or weekdays are better', () => {
      // Test case 1: Weekends better
      const now = dayjs()
      const completions1: CheckIn[] = []
      for (let i = 0; i < 35; i++) {
        const date = now.subtract(i, 'day')
        completions1.push({
          dateKey: date.format('YYYY-MM-DD'),
          completedAt: Timestamp.fromDate(date.toDate()),
          habitId: 'test-habit',
          status: 'done',
          isCompleted: true
        })
      }
      
      const weekendBetterStats: DayOfWeekStats = {
        monday: { completionRate: 40, totalCompletions: 2, totalScheduled: 5 },
        tuesday: { completionRate: 45, totalCompletions: 2, totalScheduled: 5 },
        wednesday: { completionRate: 42, totalCompletions: 2, totalScheduled: 5 },
        thursday: { completionRate: 38, totalCompletions: 2, totalScheduled: 5 },
        friday: { completionRate: 43, totalCompletions: 2, totalScheduled: 5 },
        saturday: { completionRate: 80, totalCompletions: 4, totalScheduled: 5 },
        sunday: { completionRate: 85, totalCompletions: 4, totalScheduled: 5 },
        bestDay: 'sunday',
        worstDay: 'thursday'
      }
      
      const hourlyDistribution: Record<number, number> = {}
      for (let h = 0; h < 24; h++) {
        hourlyDistribution[h] = 0
      }
      const timeDistribution: TimeDistribution = {
        hourlyDistribution,
        peakHours: [],
        optimalReminderTimes: []
      }
      
      const insights1 = generator.generateInsights(completions1, weekendBetterStats, timeDistribution)
      const weekendInsight1 = insights1.find(i => i.type === 'weekend-behavior')
      
      expect(weekendInsight1).toBeDefined()
      expect(weekendInsight1!.message.toLowerCase()).toContain('weekend')
      expect(weekendInsight1!.message).toMatch(/higher.*weekend/i)
      
      // Test case 2: Weekdays better
      const weekdayBetterStats: DayOfWeekStats = {
        monday: { completionRate: 85, totalCompletions: 4, totalScheduled: 5 },
        tuesday: { completionRate: 80, totalCompletions: 4, totalScheduled: 5 },
        wednesday: { completionRate: 82, totalCompletions: 4, totalScheduled: 5 },
        thursday: { completionRate: 88, totalCompletions: 4, totalScheduled: 5 },
        friday: { completionRate: 83, totalCompletions: 4, totalScheduled: 5 },
        saturday: { completionRate: 40, totalCompletions: 2, totalScheduled: 5 },
        sunday: { completionRate: 45, totalCompletions: 2, totalScheduled: 5 },
        bestDay: 'thursday',
        worstDay: 'saturday'
      }
      
      const insights2 = generator.generateInsights(completions1, weekdayBetterStats, timeDistribution)
      const weekendInsight2 = insights2.find(i => i.type === 'weekend-behavior')
      
      expect(weekendInsight2).toBeDefined()
      expect(weekendInsight2!.message.toLowerCase()).toContain('weekday')
      expect(weekendInsight2!.message).toMatch(/higher.*weekday/i)
    })
  })
})
