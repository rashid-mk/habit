import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompletionRateCard } from '../CompletionRateCard'

describe('CompletionRateCard', () => {
  it('should render completion rate percentage', () => {
    render(<CompletionRateCard completionRate={80} totalDays={10} completedDays={8} />)

    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('8 of 10 days completed')).toBeInTheDocument()
  })

  it('should render zero completion rate', () => {
    render(<CompletionRateCard completionRate={0} totalDays={10} completedDays={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('0 of 10 days completed')).toBeInTheDocument()
  })

  it('should render 100% completion rate', () => {
    render(<CompletionRateCard completionRate={100} totalDays={30} completedDays={30} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('30 of 30 days completed')).toBeInTheDocument()
  })

  it('should render progress bar with correct width', () => {
    const { container } = render(
      <CompletionRateCard completionRate={75} totalDays={20} completedDays={15} />
    )

    const progressBar = container.querySelector('.bg-green-600')
    expect(progressBar).toHaveStyle({ width: '75%' })
  })
})
