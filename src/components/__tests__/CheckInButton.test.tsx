import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckInButton } from '../CheckInButton'

describe('CheckInButton', () => {
  it('should render check-in button when not completed', () => {
    const mockOnCheckIn = vi.fn()
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('should render completed state when isCompleted is true', () => {
    const mockOnCheckIn = vi.fn()
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={true}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /completed/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('should show optimistic UI update immediately on click', async () => {
    const mockOnCheckIn = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    fireEvent.click(button)

    // Should show completed state immediately (optimistic update)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    }, { timeout: 150 })

    expect(mockOnCheckIn).toHaveBeenCalledWith('habit1', '2025-11-15')
  })

  it('should call onCheckIn with correct parameters', async () => {
    const mockOnCheckIn = vi.fn().mockResolvedValue(undefined)
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnCheckIn).toHaveBeenCalledWith('habit1', '2025-11-15')
    })
  })

  it('should rollback optimistic update on error', async () => {
    const mockOnCheckIn = vi.fn().mockRejectedValue(new Error('Network error'))
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    fireEvent.click(button)

    // Should show completed state immediately
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    })

    // Should rollback to check-in state after error
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument()
    })

    // Should display error message
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('should display error message when check-in fails', async () => {
    const mockOnCheckIn = vi.fn().mockRejectedValue(new Error('Failed to check in'))
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/failed to check in/i)).toBeInTheDocument()
    })
  })

  it('should not allow duplicate check-ins', async () => {
    const mockOnCheckIn = vi.fn().mockResolvedValue(undefined)
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    
    // First click
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    })

    // Try to click again
    const completedButton = screen.getByRole('button', { name: /completed/i })
    fireEvent.click(completedButton)

    // Should only be called once
    expect(mockOnCheckIn).toHaveBeenCalledTimes(1)
  })

  it('should not allow check-in while loading', async () => {
    const mockOnCheckIn = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)))
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    
    // First click
    fireEvent.click(button)
    
    // Try to click again immediately
    fireEvent.click(button)
    fireEvent.click(button)

    // Should only be called once
    await waitFor(() => {
      expect(mockOnCheckIn).toHaveBeenCalledTimes(1)
    })
  })

  it('should display generic error message when error has no message', async () => {
    const mockOnCheckIn = vi.fn().mockRejectedValue({})
    
    render(
      <CheckInButton
        habitId="habit1"
        date="2025-11-15"
        isCompleted={false}
        onCheckIn={mockOnCheckIn}
      />
    )

    const button = screen.getByRole('button', { name: /check in/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/failed to check in. please try again/i)).toBeInTheDocument()
    })
  })
})
