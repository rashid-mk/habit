import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakDisplay } from '../StreakDisplay'

describe('StreakDisplay', () => {
  it('should render current and longest streak', () => {
    render(<StreakDisplay currentStreak={5} longestStreak={10} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    expect(screen.getByText('Longest Streak')).toBeInTheDocument()
  })

  it('should render zero streaks', () => {
    render(<StreakDisplay currentStreak={0} longestStreak={0} />)

    const zeroElements = screen.getAllByText('0')
    expect(zeroElements).toHaveLength(2)
  })

  it('should render large streak numbers', () => {
    render(<StreakDisplay currentStreak={100} longestStreak={365} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('365')).toBeInTheDocument()
  })
})
