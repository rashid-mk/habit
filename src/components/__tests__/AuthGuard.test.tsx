import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthGuard } from '../AuthGuard'
import * as useAuthModule from '../../hooks/useAuth'

vi.mock('../../hooks/useAuth')

describe('AuthGuard', () => {
  it('should show loading state', () => {
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: null,
      loading: true,
    })

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render children when authenticated', () => {
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: { uid: 'test-uid', email: 'test@example.com' } as any,
      loading: false,
    })

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: null,
      loading: false,
    })

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
