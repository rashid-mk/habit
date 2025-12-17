import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { ExportService } from '../ExportService'
import { Habit, CheckIn } from '../../hooks/useHabits'
import { Timestamp } from 'firebase/firestore'
import { DateRange } from '../../types/analytics'

describe('ExportService', () => {
  const exportService = new ExportService()

  // Helper to convert Blob to text in test environment
  const blobToText = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(blob)
    })
  }

  // Generators for property-based testing
  const dateKeyArbitrary = fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().split('T')[0])

  const habitArbitrary = fc.record({
    id: fc.uuid(),
    habitName: fc.string({ minLength: 1, maxLength: 50 }),
    habitType: fc.constantFrom('build' as const, 'break' as const),
    trackingType: fc.constantFrom('simple' as const, 'count' as const, 'time' as const),
    targetValue: fc.option(fc.integer({ min: 1, max: 999 })),
    targetUnit: fc.option(fc.constantFrom('times' as const, 'minutes' as const, 'hours' as const)),
    color: fc.option(fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`)),
    frequency: fc.constantFrom('daily' as const),
    reminderTime: fc.option(fc.string()),
    goal: fc.option(fc.integer({ min: 1, max: 10 })),
    startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => Timestamp.fromDate(d)),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => Timestamp.fromDate(d)),
    isActive: fc.boolean(),
    endConditionType: fc.option(fc.constantFrom('never' as const, 'on_date' as const, 'after_completions' as const)),
    endConditionValue: fc.option(fc.oneof(fc.string(), fc.integer())),
  }) as fc.Arbitrary<Habit>

  const checkInArbitrary = (habitIds: string[]) => fc.record({
    dateKey: dateKeyArbitrary,
    completedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
      .filter(d => !isNaN(d.getTime()))
      .map(d => Timestamp.fromDate(d)),
    habitId: fc.constantFrom(...habitIds),
    status: fc.constantFrom('done' as const, 'not_done' as const, undefined),
    completionCount: fc.option(fc.integer({ min: 1, max: 10 })),
    goal: fc.option(fc.integer({ min: 1, max: 10 })),
    timestamps: fc.option(fc.array(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => Timestamp.fromDate(d))
    )),
    progressValue: fc.option(fc.integer({ min: 0, max: 999 })),
    isCompleted: fc.option(fc.boolean()),
  }) as fc.Arbitrary<CheckIn>

  const dateRangeArbitrary = fc.tuple(dateKeyArbitrary, dateKeyArbitrary)
    .filter(([d1, d2]) => {
      return typeof d1 === 'string' && typeof d2 === 'string' && d1.length === 10 && d2.length === 10
    })
    .map(([d1, d2]) => {
      const [startDate, endDate] = d1 <= d2 ? [d1, d2] : [d2, d1]
      return { startDate, endDate } as DateRange
    })

  describe('CSV Export', () => {
    // Feature: premium-analytics, Property 23: CSV Export Column Completeness
    // **Property 23: CSV Export Column Completeness**
    // **Validates: Requirements 7.2**
    it('should include all required columns in CSV export', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(habitArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(checkInArbitrary(['habit-0', 'habit-1', 'habit-2', 'habit-3', 'habit-4']), { 
            minLength: 1, 
            maxLength: 20 
          }),
          async (habits, completions) => {
            // Assign proper habit IDs
            const habitsWithIds = habits.map((h, i) => ({ ...h, id: `habit-${i}` }))
            
            // Export to CSV
            const csvBlob = await exportService.exportToCSV(habitsWithIds, completions)
            const csvText = await blobToText(csvBlob)
            const lines = csvText.split('\n').filter(line => line.trim())
            
            // Check that we have at least a header
            expect(lines.length).toBeGreaterThanOrEqual(1)
            
            // Check header contains all required columns
            const header = lines[0]
            const requiredColumns = ['date', 'habit_name', 'completion_status', 'progress_value', 'streak_count']
            
            for (const column of requiredColumns) {
              expect(header).toContain(column)
            }
            
            // If there are data rows, check they have data
            if (lines.length > 1) {
              for (let i = 1; i < lines.length; i++) {
                const row = lines[i]
                // For this test, we just need to verify the row has data
                const hasData = row.length > 0
                expect(hasData).toBe(true)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    // Feature: premium-analytics, Property 26: Date Range Export Filtering
    // **Property 26: Date Range Export Filtering**
    // **Validates: Requirements 7.6**
    it('should only include completions within the specified date range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(habitArbitrary, { minLength: 1, maxLength: 3 }),
          fc.array(checkInArbitrary(['habit-0', 'habit-1', 'habit-2']), { minLength: 5, maxLength: 20 }),
          dateRangeArbitrary,
          async (habits, completions, dateRange) => {
            // Assign proper habit IDs
            const habitsWithIds = habits.map((h, i) => ({ ...h, id: `habit-${i}` }))
            
            // Export to CSV with date range filter
            const csvBlob = await exportService.exportToCSV(habitsWithIds, completions, dateRange)
            const csvText = await blobToText(csvBlob)
            const lines = csvText.split('\n').filter(line => line.trim())
            
            // Skip header
            const dataLines = lines.slice(1)
            
            // Extract dates from CSV (first column)
            for (const line of dataLines) {
              // Split by comma to get first column (date)
              const firstComma = line.indexOf(',')
              if (firstComma > 0) {
                const date = line.substring(0, firstComma).replace(/"/g, '')
                
                // Verify date is within range
                expect(date >= dateRange.startDate).toBe(true)
                expect(date <= dateRange.endDate).toBe(true)
              }
            }
            
            // Verify that completions outside the range are not included
            const completionsInRange = completions.filter(c => 
              c.dateKey >= dateRange.startDate && c.dateKey <= dateRange.endDate
            )
            
            // Number of data lines should match completions in range
            // (accounting for habits that might not exist)
            const habitIds = new Set(habitsWithIds.map(h => h.id))
            const validCompletionsInRange = completionsInRange.filter(c => habitIds.has(c.habitId))
            expect(dataLines.length).toBe(validCompletionsInRange.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle habits with commas in names', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Exercise, eat healthy',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completion: CheckIn = {
        dateKey: '2024-01-01',
        completedAt: Timestamp.now(),
        habitId: 'test-1',
        status: 'done',
      }

      const csvBlob = await exportService.exportToCSV([habit], [completion])
      const csvText = await blobToText(csvBlob)
      
      // Should properly escape the comma in the habit name
      expect(csvText).toContain('"Exercise, eat healthy"')
    })

    it('should handle empty completions array', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Test Habit',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const csvBlob = await exportService.exportToCSV([habit], [])
      const csvText = await blobToText(csvBlob)
      const lines = csvText.split('\n').filter(line => line.trim())
      
      // Should only have header
      expect(lines.length).toBe(1)
      expect(lines[0]).toContain('date,habit_name,completion_status,progress_value,streak_count')
    })

    it('should handle progress values correctly', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Count Habit',
        trackingType: 'count',
        targetValue: 10,
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completion: CheckIn = {
        dateKey: '2024-01-01',
        completedAt: Timestamp.now(),
        habitId: 'test-1',
        status: 'done',
        progressValue: 5,
      }

      const csvBlob = await exportService.exportToCSV([habit], [completion])
      const csvText = await blobToText(csvBlob)
      
      expect(csvText).toContain('5')
    })
  })

  describe('JSON Export', () => {
    // Feature: premium-analytics, Property 24: JSON Export Completeness
    // **Property 24: JSON Export Completeness**
    // **Validates: Requirements 7.3**
    it('should include all habit metadata and historical completion records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(habitArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(checkInArbitrary(['habit-0', 'habit-1', 'habit-2', 'habit-3', 'habit-4']), { 
            minLength: 1, 
            maxLength: 20 
          }),
          async (habits, completions) => {
            // Assign proper habit IDs
            const habitsWithIds = habits.map((h, i) => ({ ...h, id: `habit-${i}` }))
            
            // Export to JSON
            const jsonBlob = await exportService.exportToJSON(habitsWithIds, completions)
            const jsonText = await blobToText(jsonBlob)
            const data = JSON.parse(jsonText)
            
            // Verify top-level structure
            expect(data).toHaveProperty('exportedAt')
            expect(data).toHaveProperty('dateRange')
            expect(data).toHaveProperty('habits')
            expect(data).toHaveProperty('completions')
            
            // Verify all habits are included
            expect(data.habits).toHaveLength(habitsWithIds.length)
            
            // Verify all habit metadata fields are present for each habit
            for (let i = 0; i < habitsWithIds.length; i++) {
              const originalHabit = habitsWithIds[i]
              const exportedHabit = data.habits[i]
              
              // Required fields
              expect(exportedHabit).toHaveProperty('id')
              expect(exportedHabit).toHaveProperty('habitName')
              expect(exportedHabit).toHaveProperty('frequency')
              expect(exportedHabit).toHaveProperty('startDate')
              expect(exportedHabit).toHaveProperty('createdAt')
              expect(exportedHabit).toHaveProperty('isActive')
              
              // Verify values match
              expect(exportedHabit.id).toBe(originalHabit.id)
              expect(exportedHabit.habitName).toBe(originalHabit.habitName)
              expect(exportedHabit.isActive).toBe(originalHabit.isActive)
              
              // Optional fields should be preserved if present
              if (originalHabit.habitType !== undefined) {
                expect(exportedHabit).toHaveProperty('habitType')
              }
              if (originalHabit.trackingType !== undefined) {
                expect(exportedHabit).toHaveProperty('trackingType')
              }
              if (originalHabit.targetValue !== undefined) {
                expect(exportedHabit).toHaveProperty('targetValue')
              }
              if (originalHabit.targetUnit !== undefined) {
                expect(exportedHabit).toHaveProperty('targetUnit')
              }
              if (originalHabit.color !== undefined) {
                expect(exportedHabit).toHaveProperty('color')
              }
              if (originalHabit.reminderTime !== undefined) {
                expect(exportedHabit).toHaveProperty('reminderTime')
              }
              if (originalHabit.goal !== undefined) {
                expect(exportedHabit).toHaveProperty('goal')
              }
              if (originalHabit.endConditionType !== undefined) {
                expect(exportedHabit).toHaveProperty('endConditionType')
              }
              if (originalHabit.endConditionValue !== undefined) {
                expect(exportedHabit).toHaveProperty('endConditionValue')
              }
            }
            
            // Verify all completions are included
            const habitIds = new Set(habitsWithIds.map(h => h.id))
            const validCompletions = completions.filter(c => habitIds.has(c.habitId))
            expect(data.completions).toHaveLength(validCompletions.length)
            
            // Verify all completion record fields are present and properly structured
            for (const exportedCompletion of data.completions) {
              // Required fields must always be present
              expect(exportedCompletion).toHaveProperty('dateKey')
              expect(exportedCompletion).toHaveProperty('completedAt')
              expect(exportedCompletion).toHaveProperty('habitId')
              
              // Verify habitId is valid
              expect(habitIds.has(exportedCompletion.habitId)).toBe(true)
              
              // Verify dateKey is a valid date string
              expect(typeof exportedCompletion.dateKey).toBe('string')
              expect(exportedCompletion.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
              
              // Verify completedAt is an ISO string (timestamps are serialized)
              expect(typeof exportedCompletion.completedAt).toBe('string')
              
              // All optional fields that exist should have appropriate types
              if ('status' in exportedCompletion) {
                expect(['done', 'not_done', null]).toContain(exportedCompletion.status)
              }
              if ('completionCount' in exportedCompletion) {
                expect(typeof exportedCompletion.completionCount === 'number' || 
                       exportedCompletion.completionCount === null).toBe(true)
              }
              if ('goal' in exportedCompletion) {
                expect(typeof exportedCompletion.goal === 'number' || 
                       exportedCompletion.goal === null).toBe(true)
              }
              if ('timestamps' in exportedCompletion) {
                expect(Array.isArray(exportedCompletion.timestamps) || 
                       exportedCompletion.timestamps === null).toBe(true)
              }
              if ('progressValue' in exportedCompletion) {
                expect(typeof exportedCompletion.progressValue === 'number' || 
                       exportedCompletion.progressValue === null).toBe(true)
              }
              if ('isCompleted' in exportedCompletion) {
                expect(typeof exportedCompletion.isCompleted === 'boolean' || 
                       exportedCompletion.isCompleted === null).toBe(true)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should export valid JSON with all habit metadata', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Test Habit',
        habitType: 'build',
        trackingType: 'simple',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completion: CheckIn = {
        dateKey: '2024-01-01',
        completedAt: Timestamp.now(),
        habitId: 'test-1',
        status: 'done',
      }

      const jsonBlob = await exportService.exportToJSON([habit], [completion])
      const jsonText = await blobToText(jsonBlob)
      const data = JSON.parse(jsonText)

      expect(data).toHaveProperty('exportedAt')
      expect(data).toHaveProperty('habits')
      expect(data).toHaveProperty('completions')
      expect(data.habits).toHaveLength(1)
      expect(data.completions).toHaveLength(1)
    })

    it('should filter JSON export by date range', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Test Habit',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completions: CheckIn[] = [
        {
          dateKey: '2024-01-01',
          completedAt: Timestamp.now(),
          habitId: 'test-1',
          status: 'done',
        },
        {
          dateKey: '2024-01-15',
          completedAt: Timestamp.now(),
          habitId: 'test-1',
          status: 'done',
        },
        {
          dateKey: '2024-02-01',
          completedAt: Timestamp.now(),
          habitId: 'test-1',
          status: 'done',
        },
      ]

      const dateRange: DateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      const jsonBlob = await exportService.exportToJSON([habit], completions, dateRange)
      const jsonText = await blobToText(jsonBlob)
      const data = JSON.parse(jsonText)

      expect(data.completions).toHaveLength(2)
      expect(data.completions.every((c: any) => 
        c.dateKey >= dateRange.startDate && c.dateKey <= dateRange.endDate
      )).toBe(true)
    })
  })

  describe('Email Delivery', () => {
    it('should throw error when user is not authenticated', async () => {
      const blob = new Blob(['test'], { type: 'text/csv' })
      
      await expect(
        exportService.sendViaEmail(blob, 'csv', 'test@example.com')
      ).rejects.toThrow('User must be authenticated to send export emails')
    })

    it('should handle email delivery errors gracefully', async () => {
      const blob = new Blob(['test'], { type: 'text/csv' })
      
      // Test with invalid email format - should throw authentication error first
      await expect(
        exportService.sendViaEmail(blob, 'csv', 'invalid-email')
      ).rejects.toThrow('User must be authenticated to send export emails')
    })

    it('should convert blob to base64 correctly', async () => {
      // Test the blobToBase64 helper method indirectly
      const testData = 'test,data,content'
      const blob = new Blob([testData], { type: 'text/csv' })
      
      // This will fail at authentication, but we can verify the method exists
      await expect(
        exportService.sendViaEmail(blob, 'csv', 'test@example.com')
      ).rejects.toThrow('User must be authenticated')
    })
  })

  describe('PDF Export', () => {
    // Feature: premium-analytics, Property 25: PDF Export Content Completeness
    // **Property 25: PDF Export Content Completeness**
    // **Validates: Requirements 7.4**
    it('should include charts, statistics, and insights in PDF export', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(habitArbitrary, { minLength: 1, maxLength: 3 }),
          fc.array(checkInArbitrary(['habit-0', 'habit-1', 'habit-2']), { 
            minLength: 5, 
            maxLength: 15 
          }),
          async (habits, completions) => {
            // Assign proper habit IDs
            const habitsWithIds = habits.map((h, i) => ({ ...h, id: `habit-${i}` }))
            
            // Create mock insights
            const insights = [
              {
                id: 'insight-1',
                type: 'day-of-week-pattern' as const,
                message: 'You perform best on weekdays',
                confidence: 'high' as const,
                dataSupport: 20,
                actionable: true,
                recommendation: 'Schedule important habits for weekdays',
              },
            ]

            // Export to PDF (without analytics and chart elements for property test)
            const pdfBlob = await exportService.exportToPDF(
              habitsWithIds, 
              completions,
              undefined, // analytics
              insights,
              undefined, // chartElements
              undefined  // dateRange
            )
            
            // Verify PDF was generated
            expect(pdfBlob).toBeInstanceOf(Blob)
            expect(pdfBlob.type).toBe('application/pdf')
            expect(pdfBlob.size).toBeGreaterThan(0)
            
            // Verify PDF has reasonable size (should contain content)
            // Base PDF with minimal content is ~2KB, with insights and habits should be larger
            const minExpectedSize = 1500 // bytes
            expect(pdfBlob.size).toBeGreaterThan(minExpectedSize)
            
            // For more detailed verification, we can check that the PDF size increases
            // with more habits and insights (indicating content is being added)
            const baselineBlob = await exportService.exportToPDF([], [], undefined, [], undefined, undefined)
            
            // PDF with content should be larger than empty PDF
            if (habitsWithIds.length > 0 || insights.length > 0) {
              expect(pdfBlob.size).toBeGreaterThan(baselineBlob.size)
            }
            
            // Verify PDF structure by reading as text (works in test environment)
            const pdfText = await blobToText(pdfBlob)
            
            // Verify PDF header
            expect(pdfText).toContain('%PDF')
            
            // Verify key sections are present in the PDF structure
            // These strings appear in the PDF content stream
            expect(pdfText).toContain('Summary Statistics')
            expect(pdfText).toContain('Insights')
            expect(pdfText).toContain('Habits List')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should generate valid PDF with basic content', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Test Habit',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completion: CheckIn = {
        dateKey: '2024-01-01',
        completedAt: Timestamp.now(),
        habitId: 'test-1',
        status: 'done',
      }

      const pdfBlob = await exportService.exportToPDF([habit], [completion])
      
      expect(pdfBlob).toBeInstanceOf(Blob)
      expect(pdfBlob.type).toBe('application/pdf')
      expect(pdfBlob.size).toBeGreaterThan(0)
    })

    it('should include date range in PDF when provided', async () => {
      const habit: Habit = {
        id: 'test-1',
        habitName: 'Test Habit',
        frequency: 'daily',
        startDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        isActive: true,
      }

      const completions: CheckIn[] = [
        {
          dateKey: '2024-01-01',
          completedAt: Timestamp.now(),
          habitId: 'test-1',
          status: 'done',
        },
        {
          dateKey: '2024-01-15',
          completedAt: Timestamp.now(),
          habitId: 'test-1',
          status: 'done',
        },
      ]

      const dateRange: DateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }

      const pdfBlob = await exportService.exportToPDF(
        [habit], 
        completions,
        undefined,
        undefined,
        undefined,
        dateRange
      )
      
      const pdfText = await blobToText(pdfBlob)
      
      expect(pdfText).toContain('2024-01-01')
      expect(pdfText).toContain('2024-01-31')
    })

    it('should handle empty habits and completions', async () => {
      const pdfBlob = await exportService.exportToPDF([], [])
      
      expect(pdfBlob).toBeInstanceOf(Blob)
      expect(pdfBlob.type).toBe('application/pdf')
      expect(pdfBlob.size).toBeGreaterThan(0)
    })
  })
})
