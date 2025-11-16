import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateHabitForm } from '../CreateHabitForm'

describe('CreateHabitForm', () => {
  it('should render all form fields', () => {
    const mockOnSubmit = vi.fn()
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument()
    expect(screen.getByText(/frequency/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/daily/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/specific days/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reminder time/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create habit/i })).toBeInTheDocument()
  })

  it('should validate habit name is required', async () => {
    const mockOnSubmit = vi.fn()
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/habit name is required/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate habit name length (1-100 characters)', async () => {
    const mockOnSubmit = vi.fn()
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    const submitButton = screen.getByRole('button', { name: /create habit/i })

    // Test with name longer than 100 characters
    const longName = 'a'.repeat(101)
    fireEvent.change(habitNameInput, { target: { value: longName } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/must be between 1 and 100 characters/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate specific days selection when frequency is specific', async () => {
    const mockOnSubmit = vi.fn()
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Test Habit' } })

    // Select "Specific days" radio button
    const specificDaysRadio = screen.getByRole('radio', { name: /specific days/i })
    fireEvent.click(specificDaysRadio)

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select at least one day/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid daily frequency data', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Morning Meditation' } })

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        habitName: 'Morning Meditation',
        frequency: 'daily',
        duration: 30,
        reminderTime: undefined,
      })
    })
  })

  it('should submit form with specific days selected', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Gym Workout' } })

    // Select "Specific days" radio button
    const specificDaysRadio = screen.getByRole('radio', { name: /specific days/i })
    fireEvent.click(specificDaysRadio)

    // Select Monday, Wednesday, Friday
    const mondayButton = screen.getByRole('button', { name: /monday/i })
    const wednesdayButton = screen.getByRole('button', { name: /wednesday/i })
    const fridayButton = screen.getByRole('button', { name: /friday/i })
    
    fireEvent.click(mondayButton)
    fireEvent.click(wednesdayButton)
    fireEvent.click(fridayButton)

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        habitName: 'Gym Workout',
        frequency: ['monday', 'wednesday', 'friday'],
        duration: 30,
        reminderTime: undefined,
      })
    })
  })

  it('should submit form with reminder time', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    const reminderTimeInput = screen.getByLabelText(/reminder time/i)
    
    fireEvent.change(habitNameInput, { target: { value: 'Evening Reading' } })
    fireEvent.change(reminderTimeInput, { target: { value: '20:00' } })

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        habitName: 'Evening Reading',
        frequency: 'daily',
        duration: 30,
        reminderTime: '20:00',
      })
    })
  })

  it('should display loading state when isLoading is true', () => {
    const mockOnSubmit = vi.fn()
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} isLoading={true} />)

    const submitButton = screen.getByRole('button', { name: /creating/i })
    expect(submitButton).toBeDisabled()
  })

  it('should display error message when error prop is provided', () => {
    const mockOnSubmit = vi.fn()
    const errorMessage = 'Failed to create habit'
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should allow toggling days on and off', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<CreateHabitForm onSubmit={mockOnSubmit} />)

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Test Habit' } })

    // Select "Specific days" radio button
    const specificDaysRadio = screen.getByRole('radio', { name: /specific days/i })
    fireEvent.click(specificDaysRadio)

    const mondayButton = screen.getByRole('button', { name: /monday/i })
    
    // Toggle Monday on
    fireEvent.click(mondayButton)
    // Toggle Monday off
    fireEvent.click(mondayButton)
    // Toggle Monday on again
    fireEvent.click(mondayButton)

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        habitName: 'Test Habit',
        frequency: ['monday'],
        duration: 30,
        reminderTime: undefined,
      })
    })
  })
})
