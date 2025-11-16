import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationPrompt } from '../NotificationPrompt';
import { useNotifications } from '../../hooks/useNotifications';

vi.mock('../../hooks/useNotifications');

const mockUseNotifications = useNotifications as ReturnType<typeof vi.fn>;

describe('NotificationPrompt', () => {
  it('should not render when showPrompt is false', () => {
    vi.mocked(mockUseNotifications).mockReturnValue({
      permission: 'default',
      token: null,
      showPrompt: false,
      requestPermission: vi.fn(),
      dismissPrompt: vi.fn(),
    });

    const { container } = render(<NotificationPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when showPrompt is true', () => {
    vi.mocked(mockUseNotifications).mockReturnValue({
      permission: 'default',
      token: null,
      showPrompt: true,
      requestPermission: vi.fn(),
      dismissPrompt: vi.fn(),
    });

    render(<NotificationPrompt />);

    expect(screen.getByText('Enable Habit Reminders')).toBeInTheDocument();
    expect(screen.getByText(/Get timely notifications/)).toBeInTheDocument();
  });

  it('should call requestPermission when Enable button clicked', () => {
    const mockRequestPermission = vi.fn();
    
    vi.mocked(mockUseNotifications).mockReturnValue({
      permission: 'default',
      token: null,
      showPrompt: true,
      requestPermission: mockRequestPermission,
      dismissPrompt: vi.fn(),
    });

    render(<NotificationPrompt />);

    const enableButton = screen.getByText('Enable Notifications');
    fireEvent.click(enableButton);

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should call dismissPrompt when Maybe Later button clicked', () => {
    const mockDismissPrompt = vi.fn();
    
    vi.mocked(mockUseNotifications).mockReturnValue({
      permission: 'default',
      token: null,
      showPrompt: true,
      requestPermission: vi.fn(),
      dismissPrompt: mockDismissPrompt,
    });

    render(<NotificationPrompt />);

    const laterButton = screen.getByText('Maybe Later');
    fireEvent.click(laterButton);

    expect(mockDismissPrompt).toHaveBeenCalled();
  });
});
