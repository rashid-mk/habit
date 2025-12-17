# Design Document: Local Browser Reminders

## Overview

This feature implements a client-side reminder system using the browser's Notification API and JavaScript timers. Reminders are checked every minute against the system time, and notifications are shown for incomplete habits on their active days.

## Architecture

### High-Level Flow

```
User Sets Reminder → Store in Firestore → App Loads → Request Permission
                                              ↓
                                    Start Reminder Service
                                              ↓
                                    Check Every Minute
                                              ↓
                        Time Matches? → Check Completion → Show Notification
                                              ↓
                                    Track in localStorage
```

### Components

1. **ReminderService** (`src/utils/reminderService.ts`)
   - Core service for managing reminders
   - Checks reminders every minute
   - Shows browser notifications
   - Tracks shown reminders in localStorage

2. **useReminders Hook** (`src/hooks/useReminders.ts`)
   - React hook to integrate reminder service
   - Manages permission state
   - Starts/stops reminder checking
   - Provides permission request function

3. **Updated Habit Interface** (`src/hooks/useHabits.ts`)
   - Already has `reminderTime?: string` field
   - No changes needed to data model

4. **UI Updates**
   - Create/Edit forms already support reminder time
   - No changes needed

## Data Models

### Habit Document (Existing)
```typescript
interface Habit {
  id: string
  habitName: string
  habitType?: 'build' | 'break'
  color?: string
  frequency: 'daily' | string[]
  duration: number
  reminderTime?: string  // HH:MM format (already exists)
  startDate: Timestamp
  createdAt: Timestamp
  isActive: boolean
}
```

### LocalStorage Schema
```typescript
// Key: 'habit-reminders-shown'
interface ReminderState {
  date: string  // YYYY-MM-DD
  habitIds: string[]  // Array of habit IDs that have been reminded today
}
```

### Notification Permission State
```typescript
// Stored in component state, not persisted
type PermissionState = 'default' | 'granted' | 'denied'
```

## Components and Interfaces

### 1. ReminderService

**File**: `src/utils/reminderService.ts`

**Responsibilities**:
- Check all habits for pending reminders
- Compare current time with reminder times
- Show browser notifications
- Track shown reminders
- Clean up old reminder state

**Key Functions**:
```typescript
class ReminderService {
  private intervalId: number | null = null
  
  // Start checking reminders every minute
  start(habits: Habit[], checks: CheckIn[]): void
  
  // Stop checking reminders
  stop(): void
  
  // Check if it's time to show reminders
  private checkReminders(habits: Habit[], checks: CheckIn[]): void
  
  // Show a browser notification
  private showNotification(habit: Habit): void
  
  // Check if reminder was already shown today
  private wasReminderShown(habitId: string): boolean
  
  // Mark reminder as shown
  private markReminderShown(habitId: string): void
  
  // Get today's shown reminders from localStorage
  private getTodayReminders(): ReminderState
  
  // Clean up old reminder states (older than 7 days)
  private cleanupOldReminders(): void
}
```

### 2. useReminders Hook

**File**: `src/hooks/useReminders.ts`

**Responsibilities**:
- Initialize reminder service
- Manage notification permission
- Provide permission request function
- Start/stop service based on app state

**Interface**:
```typescript
interface UseRemindersReturn {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  isSupported: boolean
}

function useReminders(habits: Habit[], checks: CheckIn[]): UseRemindersReturn
```

### 3. App Integration

**File**: `src/App.tsx`

**Changes**:
- Import and use `useReminders` hook
- Pass habits and checks data
- Handle permission requests

## Error Handling

### Notification API Not Supported
- Check `'Notification' in window`
- Show message: "Browser notifications not supported"
- Disable reminder functionality gracefully

### Permission Denied
- Show helpful message with instructions
- Provide link to browser settings
- Allow user to retry permission request

### Invalid Reminder Time
- Validate HH:MM format on input
- Default to null if invalid
- Show validation error in form

### Service Worker Issues
- Notifications work without service worker
- Use basic Notification API
- No background sync needed

## Testing Strategy

### Unit Tests
- ReminderService time checking logic
- LocalStorage state management
- Reminder shown tracking
- Cleanup old reminders

### Integration Tests
- useReminders hook with mock data
- Permission request flow
- Notification display (mocked)

### Manual Testing
- Set reminder for 1 minute from now
- Verify notification appears
- Complete habit, verify no notification
- Test on inactive days
- Test permission denied flow
- Test browser compatibility

## Implementation Notes

### Browser Compatibility
- Notification API supported in all modern browsers
- Check support: `'Notification' in window`
- Fallback: Show in-app message if not supported

### Performance Considerations
- Check reminders every 60 seconds (not every second)
- Use efficient time comparison
- Limit localStorage reads/writes
- Clean up old data automatically

### User Experience
- Request permission only when user sets first reminder
- Show clear permission instructions
- Provide visual feedback for reminder status
- Allow easy enable/disable of reminders

### Security
- No sensitive data in notifications
- LocalStorage is origin-specific
- No external API calls needed
- All processing client-side

## Future Enhancements

- Snooze functionality
- Custom notification sounds
- Reminder repeat intervals
- Multiple reminders per habit
- Notification action buttons
- Service Worker for background notifications
