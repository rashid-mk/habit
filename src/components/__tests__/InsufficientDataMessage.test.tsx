import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsufficientDataMessage, InsufficientDataBanner } from '../InsufficientDataMessage'

describe('InsufficientDataMessage', () => {
  it('displays correct minimum required and current count', () => {
    render(
      <InsufficientDataMessage
        minimumRequired={28}
        currentCount={15}
        dataType="days of data"
        analysisType="day-of-week analysis"
      />
    )

    expect(screen.getByText(/need at least 28 days of data/i)).toBeInTheDocument()
    expect(screen.getByText('15 / 28 days of data')).toBeInTheDocument()
    expect(screen.getByText('13 more days of data needed')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(
      <InsufficientDataMessage
        minimumRequired={100}
        currentCount={25}
        dataType="data points"
      />
    )

    const progressBar = screen.getByRole('progressbar', { hidden: true })
    expect(progressBar).toHaveStyle({ width: '25%' })
  })

  it('displays guidance on how to get more data', () => {
    render(
      <InsufficientDataMessage
        minimumRequired={28}
        currentCount={10}
      />
    )

    expect(screen.getByText('How to get more data:')).toBeInTheDocument()
    expect(screen.getByText(/complete your habit more consistently/i)).toBeInTheDocument()
    expect(screen.getByText(/wait for more data to accumulate/i)).toBeInTheDocument()
    expect(screen.getByText(/check back in a few days/i)).toBeInTheDocument()
  })

  it('uses default values when not provided', () => {
    render(
      <InsufficientDataMessage
        minimumRequired={10}
        currentCount={5}
      />
    )

    expect(screen.getByText(/need at least 10 data points/i)).toBeInTheDocument()
    expect(screen.getByText(/for this analysis/i)).toBeInTheDocument()
  })

  it('handles case where current count equals minimum required', () => {
    render(
      <InsufficientDataMessage
        minimumRequired={20}
        currentCount={20}
      />
    )

    expect(screen.getByText('20 / 20 data points')).toBeInTheDocument()
    expect(screen.queryByText(/more.*needed/)).not.toBeInTheDocument()
  })
})

describe('InsufficientDataBanner', () => {
  it('displays compact insufficient data message', () => {
    render(
      <InsufficientDataBanner
        minimumRequired={14}
        currentCount={7}
        dataType="days"
      />
    )

    expect(screen.getByText('Need 7 more days for this analysis')).toBeInTheDocument()
    expect(screen.getByText('Progress: 7 / 14 days')).toBeInTheDocument()
  })

  it('uses default data type when not provided', () => {
    render(
      <InsufficientDataBanner
        minimumRequired={10}
        currentCount={3}
      />
    )

    expect(screen.getByText('Need 7 more data points for this analysis')).toBeInTheDocument()
    expect(screen.getByText('Progress: 3 / 10 data points')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <InsufficientDataBanner
        minimumRequired={5}
        currentCount={2}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})