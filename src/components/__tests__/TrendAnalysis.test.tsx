import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendAnalysis } from '../TrendAnalysis'
import { CheckIn } from '../../hooks/useHabits'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

describe('TrendAnalysis', () => {
  it('should render trend analysis with data', () => {
    const completions: CheckIn[] = []
    const now = dayjs()
    
    // Create 28 days of completions (4 weeks)
    for (let i = 0; i < 28; i++) {
      const date = now.subtract(i, 'day')
      completions.push({
        dateKey: date.format('YYYY-MM-DD'),
        completedAt: Timestamp.fromDate(date.toDate()),
        habitId: 'test-habit',
        status: i % 2 === 0 ? 'done' : 'missed',
        isCompleted: i % 2 === 0
      })
    }

    render(<TrendAnalysis completions={completions} />)

    // Check that trend analysis section is rendered
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument()
    expect(screen.getByText('Completion Trend')).toBeInTheDocument()
    
    // Check that period buttons are rendered
    expect(screen.getByText('4 Weeks')).toBeInTheDocument()
    expect(screen.getByText('3 Months')).toBeInTheDocument()
    expect(screen.getByText('6 Months')).toBeInTheDocument()
    expect(screen.getByText('1 Year')).toBeInTheDocument()
  })

  it('should render with empty completions', () => {
    render(<TrendAnalysis completions={[]} />)

    expect(screen.getByText('Trend Analysis')).toBeInTheDocument()
    expect(screen.getByText('Completion Trend')).toBeInTheDocument()
    expect(screen.getByText('Completion Rate')).toBeInTheDocument()
  })
})
