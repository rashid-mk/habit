import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsErrorBoundary } from '../AnalyticsErrorBoundary'
import { createAnalyticsError } from '../../utils/errorHandling'

// Component that throws an error
function ThrowError({ shouldThrow, errorType }: { shouldThrow: boolean; errorType?: string }) {
  if (shouldThrow) {
    if (errorType === 'insufficient-data') {
      throw createAnalyticsError('Need more data', 'insufficient-data', false, 28)
    } else if (errorType === 'permission-error') {
      throw createAnalyticsError('No permission', 'permission-error', false)
    } else {
      throw createAnalyticsError('Calculation failed', 'calculation-error')
    }
  }
  return <div>No error</div>
}

describe('AnalyticsErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Test Section">
        <ThrowError shouldThrow={false} />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Test Section">
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByText('Test Section Unavailable')).toBeInTheDocument()
    expect(screen.getByText(/calculation failed/i)).toBeInTheDocument()
  })

  it('shows insufficient data guidance for insufficient-data errors', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Analytics">
        <ThrowError shouldThrow={true} errorType="insufficient-data" />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByText('Analytics Unavailable')).toBeInTheDocument()
    expect(screen.getByText('How to get more data:')).toBeInTheDocument()
    expect(screen.getByText(/complete your habit more consistently/i)).toBeInTheDocument()
  })

  it('shows upgrade prompt for permission errors', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Premium Analytics">
        <ThrowError shouldThrow={true} errorType="permission-error" />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByText('Premium Analytics Unavailable')).toBeInTheDocument()
    expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
  })

  it('shows retry button for retryable errors', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Analytics">
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not show retry button for non-retryable errors', () => {
    render(
      <AnalyticsErrorBoundary sectionName="Analytics">
        <ThrowError shouldThrow={true} errorType="insufficient-data" />
      </AnalyticsErrorBoundary>
    )

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('uses custom fallback when provided', () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={resetError}>Reset</button>
      </div>
    )

    render(
      <AnalyticsErrorBoundary sectionName="Analytics" fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    )

    expect(screen.getByText('Custom error: Calculation failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <AnalyticsErrorBoundary sectionName="Analytics" onError={onError}>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Calculation failed' }),
      expect.any(Object)
    )
  })
})