import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { AnalyticsSkeleton } from '../AnalyticsSkeleton'

describe('AnalyticsSkeleton', () => {
  // **Feature: premium-analytics, Property 43: Loading Indicator Display**
  // **Validates: Requirements 11.5**
  it('should display loading indicators for all analytics loading operations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dashboard', 'chart', 'insight', 'export', 'breakdown'),
        fc.boolean(),
        (variant, hasClassName) => {
          const className = hasClassName ? 'test-class' : ''
          
          const { container } = render(
            <AnalyticsSkeleton variant={variant} className={className} />
          )
          
          // Property: For any analytics loading operation, skeleton screens or loading indicators should be displayed
          
          // All skeleton variants should have the animate-pulse class for loading indication
          const animatedElements = container.querySelectorAll('.animate-pulse')
          expect(animatedElements.length).toBeGreaterThan(0)
          
          // All skeleton variants should have the backdrop-blur styling indicating loading state
          const skeletonContainers = container.querySelectorAll('.backdrop-blur-xl')
          expect(skeletonContainers.length).toBeGreaterThan(0)
          
          // All skeleton variants should have gray placeholder elements
          const grayPlaceholders = container.querySelectorAll('[class*="bg-gray-"]')
          expect(grayPlaceholders.length).toBeGreaterThan(0)
          
          // Verify specific loading indicators based on variant
          if (variant === 'dashboard') {
            // Dashboard should show navigation skeleton
            const navElements = container.querySelectorAll('.grid-cols-2')
            expect(navElements.length).toBeGreaterThan(0)
          } else if (variant === 'chart') {
            // Chart should show chart area placeholder
            const chartArea = container.querySelector('.h-64')
            expect(chartArea).toBeTruthy()
          } else if (variant === 'insight') {
            // Insight should show insight cards
            const insightCards = container.querySelectorAll('.space-y-4')
            expect(insightCards.length).toBeGreaterThan(0)
          } else if (variant === 'export') {
            // Export should show export options
            const exportGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-3')
            expect(exportGrid).toBeTruthy()
          } else if (variant === 'breakdown') {
            // Breakdown should show calendar grid
            const calendarGrid = container.querySelector('.grid-cols-7')
            expect(calendarGrid).toBeTruthy()
          }
          
          // If className is provided, it should be applied
          if (hasClassName) {
            const mainContainer = container.firstChild as HTMLElement
            expect(mainContainer.className).toContain('test-class')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should display appropriate loading states for different analytics sections', () => {
    const variants = ['dashboard', 'chart', 'insight', 'export', 'breakdown'] as const
    
    variants.forEach(variant => {
      const { container } = render(<AnalyticsSkeleton variant={variant} />)
      
      // Each variant should have loading animation
      const animatedElements = container.querySelectorAll('.animate-pulse')
      expect(animatedElements.length).toBeGreaterThan(0)
      
      // Each variant should have proper structure (dashboard has different structure)
      if (variant === 'dashboard') {
        const mainContainer = container.firstChild as HTMLElement
        expect(mainContainer).toHaveClass('space-y-6')
        // Dashboard should have backdrop-blur elements inside
        const backdropElements = container.querySelectorAll('.backdrop-blur-xl')
        expect(backdropElements.length).toBeGreaterThan(0)
      } else {
        const mainContainer = container.firstChild as HTMLElement
        expect(mainContainer).toHaveClass('backdrop-blur-xl')
        expect(mainContainer).toHaveClass('rounded-3xl')
      }
    })
  })

  it('should handle default variant when no variant specified', () => {
    const { container } = render(<AnalyticsSkeleton />)
    
    // Default should still show loading indicators
    const animatedElements = container.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
    
    // Should have basic skeleton structure
    const placeholders = container.querySelectorAll('[class*="bg-gray-"]')
    expect(placeholders.length).toBeGreaterThan(0)
  })
})