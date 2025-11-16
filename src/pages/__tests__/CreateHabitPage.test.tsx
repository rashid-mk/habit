import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateHabitPage } from '../CreateHabitPage'
import * as useAuthModule from '../../hooks/useAuth'
import * as firestore from 'firebase/firestore'

vi.mock('../../hooks/useAuth')
vi.mock('firebase/firestore')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('CreateHabitPage', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuthState).mockReturnValue({
      user: mockUser as any,
      loading: false,
    })
  })

  it('should render the create habit form', () => {
    render(<CreateHabitPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/create new habit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument()
  })

  it('should navigate back to dashboard when back button is clicked', () => {
    render(<CreateHabitPage />, { wrapper: createWrapper() })

    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to dashboard after successful habit creation', async () => {
    const mockHabitId = 'habit-123'
    const mockAddDoc = vi.fn().mockResolvedValue({ id: mockHabitId })
    const mockSetDoc = vi.fn().mockResolvedValue(undefined)
    
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockImplementation(mockAddDoc)
    vi.mocked(firestore.doc).mockReturnValue({} as any)
    vi.mocked(firestore.setDoc).mockImplementation(mockSetDoc)
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    render(<CreateHabitPage />, { wrapper: createWrapper() })

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Morning Meditation' } })

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display error message when habit creation fails', async () => {
    const errorMessage = 'Failed to create habit'
    vi.mocked(firestore.collection).mockReturnValue({} as any)
    vi.mocked(firestore.addDoc).mockRejectedValue(new Error(errorMessage))
    vi.mocked(firestore.serverTimestamp).mockReturnValue({} as any)

    render(<CreateHabitPage />, { wrapper: createWrapper() })

    const habitNameInput = screen.getByLabelText(/habit name/i)
    fireEvent.change(habitNameInput, { target: { value: 'Morning Meditation' } })

    const submitButton = screen.getByRole('button', { name: /create habit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to create habit/i)).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
