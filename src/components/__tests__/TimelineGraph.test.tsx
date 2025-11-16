import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineGraph } from '../TimelineGraph'
import { CheckIn } from '../../hooks/useHabits'
import { Timestamp } from 'firebase/firestore'
import dayjs from 'dayjs'

describe('TimelineGraph', () => {
  const mockStartDate = dayjs().subtract(15, 'day').toDate()

  const createMockCheck = (daysAgo: number): CheckIn => ({
    dateKey: dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD'),
    completedAt: Timestamp.now(),
    habitId: 'test-habit',
  })

  it('should render 30-day grid', () => {
    const { container } = render(
      <TimelineGraph checks={[]} startDate={mockStartDate} />
    )

    const cells = container.querySelectorAll('.aspect-square')
    expect(cells).toHaveLength(30)
  })

  it('should show completed days in green', () => {
    const checks = [createMockCheck(0), createMockCheck(1), createMockCheck(2)]
    
    const { container } = render(
      <TimelineGraph checks={checks} startDate={mockStartDate} />
    )

    const completedCells = container.querySelectorAll('.bg-green-500')
    expect(completedCells.length).toBeGreaterThan(0)
  })

  it('should show missed days in red', () => {
    const checks: CheckIn[] = []
    
    const { container } = render(
      <TimelineGraph checks={checks} startDate={mockStartDate} />
    )

    const missedCells = container.querySelectorAll('.bg-red-100')
    expect(missedCells.length).toBeGreaterThan(0)
  })

  it('should show days before start date in gray', () => {
    const recentStartDate = dayjs().subtract(5, 'day').toDate()
    
    const { container } = render(
      <TimelineGraph checks={[]} startDate={recentStartDate} />
    )

    const beforeStartCells = container.querySelectorAll('.bg-gray-100')
    expect(beforeStartCells.length).toBeGreaterThan(0)
  })

  it('should highlight today with ring', () => {
    const { container } = render(
      <TimelineGraph checks={[]} startDate={mockStartDate} />
    )

    const todayCell = container.querySelector('.ring-2.ring-blue-500')
    expect(todayCell).toBeInTheDocument()
  })

  it('should render legend', () => {
    render(<TimelineGraph checks={[]} startDate={mockStartDate} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Missed')).toBeInTheDocument()
    expect(screen.getByText('Before start')).toBeInTheDocument()
  })

  it('should handle consecutive check-ins', () => {
    const checks = [
      createMockCheck(0),
      createMockCheck(1),
      createMockCheck(2),
      createMockCheck(3),
      createMockCheck(4),
    ]
    
    const { container } = render(
      <TimelineGraph checks={checks} startDate={mockStartDate} />
    )

    const completedCells = container.querySelectorAll('.bg-green-500')
    expect(completedCells.length).toBeGreaterThanOrEqual(5)
  })

  it('should handle check-ins with gaps', () => {
    const checks = [
      createMockCheck(0),
      createMockCheck(2),
      createMockCheck(5),
    ]
    
    const { container } = render(
      <TimelineGraph checks={checks} startDate={mockStartDate} />
    )

    const completedCells = container.querySelectorAll('.bg-green-500')
    expect(completedCells.length).toBeGreaterThanOrEqual(3)
    
    const missedCells = container.querySelectorAll('.bg-red-100')
    expect(missedCells.length).toBeGreaterThan(0)
  })

  it('should handle empty check-ins array', () => {
    const { container } = render(
      <TimelineGraph checks={[]} startDate={mockStartDate} />
    )

    const cells = container.querySelectorAll('.aspect-square')
    expect(cells).toHaveLength(30)
  })
})
