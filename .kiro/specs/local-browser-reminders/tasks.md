# Implementation Plan

- [x] 1. Create ReminderService utility


  - Create `src/utils/reminderService.ts` with ReminderService class
  - Implement time checking logic to compare current time with reminder times
  - Implement localStorage management for tracking shown reminders
  - Add cleanup function for old reminder data (>7 days)
  - _Requirements: 1.3, 3.1, 3.2, 4.1, 4.2, 5.2, 5.3, 5.4, 5.5_


- [ ] 2. Implement notification display logic
  - Add showNotification method to ReminderService
  - Check if habit is completed before showing notification
  - Check if today is an active day for the habit
  - Include habit name in notification title
  - Add click handler to navigate to habit detail


  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 5.1_

- [ ] 3. Create useReminders React hook
  - Create `src/hooks/useReminders.ts` file
  - Implement permission state management
  - Add requestPermission function
  - Check browser support for Notification API


  - Start/stop ReminderService based on app lifecycle
  - Pass habits and checks data to service
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1_

- [ ] 4. Integrate reminders into App component
  - Import useReminders hook in App.tsx


  - Fetch all habits and today's checks
  - Initialize reminder service on app load
  - Handle permission request flow
  - Show permission denied message if needed
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [ ] 5. Add reminder status indicators
  - Show bell icon on habit cards with reminders
  - Display reminder time in habit card
  - Add visual indicator for permission status
  - Show helper text for enabling notifications
  - _Requirements: 1.4, 2.2_

- [x] 6. Add error handling and edge cases

  - Handle browser not supporting Notification API
  - Handle permission denied gracefully
  - Handle invalid reminder times
  - Add error boundaries for reminder failures
  - Log errors for debugging
  - _Requirements: All_

- [x] 7. Test reminder functionality



  - Test time checking logic with various times
  - Test localStorage state management
  - Test permission request flow
  - Test notification display (manual)
  - Test with completed vs incomplete habits
  - Test with active vs inactive days
  - _Requirements: All_
