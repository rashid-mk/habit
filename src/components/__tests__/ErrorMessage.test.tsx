import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorMessage } from '../ErrorMessage'
import { FirebaseError } from 'firebase/app'

describe('ErrorMessage', () => {
  it('displays user-friendly message for Firebase permission-denied error', () => {
    const error = new FirebaseError('permission-denied', 'Permission denied')
    render(<ErrorMessage error={error} />)

    expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument()
  })

  it('displays user-friendly message for Firebase unavailable error', () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    render(<ErrorMessage error={error} />)

    expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
  })

  it('displays user-friendly message for Firebase not-found error', () => {
    const error = new FirebaseError('not-found', 'Not found')
    render(<ErrorMessage error={error} />)

    expect(screen.getByText(/requested data was not found/i)).toBeInTheDocument()
  })

  it('displays retry button for retryable errors', () => {
    const error = new FirebaseError('unavailable', 'Service unavailable')
    const onRetry = vi.fn()
    render(<ErrorMessage error={error} onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    retryButton.click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not display retry button for non-retryable errors', () => {
    const error = new FirebaseError('permission-denied', 'Permission denied')
    const onRetry = vi.fn()
    render(<ErrorMessage error={error} onRetry={onRetry} />)

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('handles standard Error objects', () => {
    const error = new Error('Something went wrong')
    render(<ErrorMessage error={error} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('handles unknown error types', () => {
    const error = 'string error'
    render(<ErrorMessage error={error} />)

    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
  })
})
