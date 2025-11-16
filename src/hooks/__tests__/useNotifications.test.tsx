import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotifications } from '../useNotifications';
import { useAuthState } from '../useAuth';
import { updateDoc } from 'firebase/firestore';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('firebase/firestore');
vi.mock('../../config/firebase', () => ({
  db: {},
  messaging: {},
  getToken: vi.fn(),
  onMessage: vi.fn(() => vi.fn()),
}));

const mockUseAuthState = useAuthState as ReturnType<typeof vi.fn>;
const mockUpdateDoc = updateDoc as ReturnType<typeof vi.fn>;

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn(),
    } as any;
  });

  it('should initialize with default permission state', () => {
    vi.mocked(mockUseAuthState).mockReturnValue({
      user: null,
      loading: false,
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.permission).toBe('default');
    expect(result.current.token).toBeNull();
    expect(result.current.showPrompt).toBe(false);
  });

  it('should show prompt when user is authenticated and permission is default', () => {
    vi.mocked(mockUseAuthState).mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' } as any,
      loading: false,
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.showPrompt).toBe(true);
  });

  it('should not show prompt when permission already granted', () => {
    global.Notification.permission = 'granted';
    
    vi.mocked(mockUseAuthState).mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' } as any,
      loading: false,
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.showPrompt).toBe(false);
  });

  it('should request permission and store token', async () => {
    const mockToken = 'test-fcm-token';
    const { getToken } = await import('../../config/firebase');
    
    vi.mocked(getToken).mockResolvedValue(mockToken);
    global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    vi.mocked(mockUpdateDoc).mockResolvedValue(undefined as any);

    vi.mocked(mockUseAuthState).mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' } as any,
      loading: false,
    });

    const { result } = renderHook(() => useNotifications());

    const success = await result.current.requestPermission();

    await waitFor(() => {
      expect(success).toBe(true);
      expect(result.current.permission).toBe('granted');
      expect(result.current.token).toBe(mockToken);
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  it('should dismiss prompt', () => {
    vi.mocked(mockUseAuthState).mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' } as any,
      loading: false,
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.showPrompt).toBe(true);

    result.current.dismissPrompt();

    expect(result.current.showPrompt).toBe(false);
  });
});
