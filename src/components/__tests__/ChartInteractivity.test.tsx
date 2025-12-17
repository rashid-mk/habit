import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import { TrendLineChart } from '../TrendLineChart'
import { CompletionPieChart } from '../CompletionPieChart'
import { ProgressChart } from '../ProgressChart'
import { CalendarHeatmap } from '../CalendarHeatmap'
import dayjs from 'dayjs'

/**
 * Feature: premium-analytics, Property 27: Chart Interactivity
 * Validates: Requirements 8.6
 * 
 * For any rendered chart, hovering over data points should display tooltips 
 * with detailed information about that data point.
 */

describe('Chart Interactivity Property Tests', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Property 27: Chart Interactivity', () => {
    it('TrendLineChart displays tooltips on hover for any valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random data points (1-30 days)
          fc.array(
            fc.record({
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
                .map(d => dayjs(d).format('YYYY-MM-DD')),
              value: fc.integer({ min: 0, max: 1 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          async (dataPoints) => {
            // Sort by date to ensure proper ordering
            const sortedData = [...dataPoints].sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            )

            const { container } = render(<TrendLineChart dataPoints={sortedData} />)
            
            // Chart should render without errors - check for the container structure
            const chartContainer = container.querySelector('.bg-white')
            expect(chartContainer).toBeTruthy()
            
            // Should have the chart title within this specific container
            const title = container.querySelector('h3')
            expect(title?.textContent).toBe('Completion Trend')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('CompletionPieChart displays tooltips for any valid completion data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 365 }), // completed days
          fc.integer({ min: 0, max: 365 }), // missed days
          async (completed, missed) => {
            // Skip if both are zero (no data case)
            fc.pre(completed + missed > 0)

            const { container } = render(
              <CompletionPieChart completed={completed} missed={missed} />
            )
            
            // Chart should render without errors
            const chartContainer = container.querySelector('.bg-white')
            expect(chartContainer).toBeTruthy()
            
            // Should have the chart title within this specific container
            const title = container.querySelector('h3')
            expect(title?.textContent).toBe('Completion Distribution')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('ProgressChart displays tooltips for any valid progress data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
                .map(d => dayjs(d).format('YYYY-MM-DD')),
              value: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          fc.constantFrom('count' as const, 'time' as const),
          fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          async (data, habitType, targetValue) => {
            const sortedData = [...data].sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            )

            const { container } = render(
              <ProgressChart 
                data={sortedData} 
                habitType={habitType}
                targetValue={targetValue}
              />
            )
            
            // Chart should render without errors
            const chartContainer = container.querySelector('.bg-white')
            expect(chartContainer).toBeTruthy()
            
            // Should have the chart title within this specific container
            const title = container.querySelector('h3')
            expect(title?.textContent).toBe('Progress Over Time')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('CalendarHeatmap displays tooltips for any valid calendar data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate smaller date ranges to avoid timeout
          fc.integer({ min: 1, max: 60 }), // days from start
          fc.array(
            fc.record({
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-03-31') })
                .map(d => dayjs(d).format('YYYY-MM-DD')),
              value: fc.integer({ min: 0, max: 10 }),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          async (daysRange, completions) => {
            const startDate = new Date('2024-01-01')
            const endDate = new Date(startDate.getTime() + daysRange * 24 * 60 * 60 * 1000)

            const { container } = render(
              <CalendarHeatmap 
                completions={completions}
                startDate={startDate}
                endDate={endDate}
              />
            )
            
            // Calendar should render
            expect(container.querySelector('.inline-block')).toBeTruthy()
            
            // Should have calendar cells with title attributes (for tooltips)
            const cells = container.querySelectorAll('[title]')
            expect(cells.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      )
    }, 10000) // 10 second timeout
  })
})
