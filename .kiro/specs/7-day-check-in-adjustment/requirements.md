# Requirements Document

## Introduction

The 7-Day Check-In Adjustment feature enhances the Habit Tracker System by allowing users to retroactively adjust their check-in status for the previous 7 days directly from the habit card. This feature provides users with flexibility to correct missed entries, update their progress, and maintain accurate habit tracking records without navigating to separate pages. The interface presents a vertical timeline of the last 7 days with multi-touch toggle functionality to cycle between three states: done, not done, and skip.

## Glossary

- **Habit_Card**: The dashboard component displaying a single habit with its current status and quick actions
- **Check_In_Status**: The state of a habit for a specific date, which can be "done", "not done", or "skip"
- **Seven_Day_Timeline**: A vertical list of the previous 7 days displayed on the habit card for status adjustment
- **Status_Toggle**: A user interaction that cycles through the three check-in states for a specific date
- **Done_State**: A check-in status indicating the user completed the habit on that date
- **Not_Done_State**: A check-in status indicating the user explicitly did not complete the habit on that date
- **Skip_State**: A check-in status indicating no check-in record exists for that date (neutral/untracked)
- **Habit_Tracker_System**: The complete web application including frontend React app, Firebase backend services, and Cloud Functions
- **Check_Document**: A Firestore document at path /users/{uid}/habits/{habitId}/checks/{dateKey} storing check-in data
- **Analytics_Engine**: Cloud Function that calculates and maintains habit statistics based on check-in data

## Requirements

### Requirement 1: Display 7-Day Timeline on Habit Card

**User Story:** As a user, I want to see the last 7 days on my habit card, so that I can quickly review my recent check-in history.

#### Acceptance Criteria

1. WHEN a user views a habit card on the dashboard, THE Habit_Card SHALL display a vertical timeline showing the previous 7 days including today
2. WHEN the Seven_Day_Timeline is displayed, THE Habit_Card SHALL show each date with the day name and date number in descending order (most recent at top)
3. WHEN the Seven_Day_Timeline is displayed, THE Habit_Card SHALL indicate the current check-in status for each date using visual indicators
4. WHEN a date has a Done_State, THE Habit_Card SHALL display a checkmark icon with success styling
5. WHEN a date has a Not_Done_State, THE Habit_Card SHALL display an X icon with error styling
6. WHEN a date has a Skip_State, THE Habit_Card SHALL display a neutral indicator showing no check-in exists

### Requirement 2: Toggle Check-In Status

**User Story:** As a user, I want to tap on any of the last 7 days to change its status, so that I can correct or update my check-in records.

#### Acceptance Criteria

1. WHEN a user taps on a date in the Seven_Day_Timeline, THE Habit_Card SHALL cycle the status to the next state in the sequence: Skip → Done → Not Done → Skip
2. WHEN a user taps on a date with Skip_State, THE Habit_Card SHALL change the status to Done_State and display optimistic UI feedback within 100 milliseconds
3. WHEN a user taps on a date with Done_State, THE Habit_Card SHALL change the status to Not_Done_State and display optimistic UI feedback within 100 milliseconds
4. WHEN a user taps on a date with Not_Done_State, THE Habit_Card SHALL change the status to Skip_State and display optimistic UI feedback within 100 milliseconds
5. WHEN a status change occurs, THE Habit_Card SHALL provide visual feedback including a brief animation or highlight effect

### Requirement 3: Persist Status Changes to Firestore

**User Story:** As a user, I want my status adjustments to be saved automatically, so that my changes are preserved and reflected in my analytics.

#### Acceptance Criteria

1. WHEN a user changes a date from Skip_State to Done_State, THE Habit_Tracker_System SHALL create a Check_Document in Firestore at path /users/{uid}/habits/{habitId}/checks/{dateKey} within 1 second
2. WHEN a user changes a date from Done_State to Not_Done_State, THE Habit_Tracker_System SHALL update the existing Check_Document with status "not_done" within 1 second
3. WHEN a user changes a date from Not_Done_State to Skip_State, THE Habit_Tracker_System SHALL delete the Check_Document from Firestore within 1 second
4. WHEN a user changes a date from Skip_State to Not_Done_State, THE Habit_Tracker_System SHALL create a Check_Document with status "not_done" within 1 second
5. WHEN any Check_Document is created, updated, or deleted, THE Habit_Tracker_System SHALL trigger the Analytics_Engine to recalculate habit statistics

### Requirement 4: Update Analytics After Status Changes

**User Story:** As a user, I want my streak and completion rate to update automatically when I adjust past check-ins, so that my analytics accurately reflect my actual progress.

#### Acceptance Criteria

1. WHEN a Check_Document is created or updated via status toggle, THE Analytics_Engine SHALL recalculate the current streak within 2 seconds
2. WHEN a Check_Document is created or updated via status toggle, THE Analytics_Engine SHALL recalculate the longest streak within 2 seconds
3. WHEN a Check_Document is created or updated via status toggle, THE Analytics_Engine SHALL recalculate the completion rate within 2 seconds
4. WHEN analytics are recalculated, THE Habit_Card SHALL display the updated streak count within 3 seconds
5. WHEN analytics are recalculated, THE Habit_Card SHALL display the updated completion percentage within 3 seconds

### Requirement 5: Handle Date Boundaries and Timezone

**User Story:** As a user, I want the 7-day timeline to respect my local timezone, so that the dates shown match my actual daily schedule.

#### Acceptance Criteria

1. WHEN the Seven_Day_Timeline is displayed, THE Habit_Card SHALL calculate dates using the user's local timezone
2. WHEN the current date changes at midnight, THE Habit_Card SHALL automatically update the Seven_Day_Timeline to show the new current day
3. WHEN a habit was created less than 7 days ago, THE Habit_Card SHALL only display dates from the habit creation date forward
4. WHEN a user views the Seven_Day_Timeline, THE Habit_Card SHALL not display dates before the habit creation date
5. WHEN calculating the 7-day range, THE Habit_Card SHALL include today as day 1 and extend back 6 additional days

### Requirement 6: Provide User Feedback for Status Changes

**User Story:** As a user, I want to see immediate feedback when I change a check-in status, so that I know my action was registered.

#### Acceptance Criteria

1. WHEN a user taps a date to change status, THE Habit_Card SHALL display a visual animation on the date indicator within 50 milliseconds
2. WHEN a status change is successfully saved to Firestore, THE Habit_Card SHALL display a subtle success indicator
3. IF a status change fails to save to Firestore, THEN THE Habit_Card SHALL revert the optimistic UI update and display an error message
4. WHEN a status change is in progress, THE Habit_Card SHALL disable further taps on that specific date until the operation completes
5. WHEN multiple status changes are made rapidly, THE Habit_Card SHALL queue the operations and process them sequentially

### Requirement 7: Maintain UI Performance with Timeline

**User Story:** As a user, I want the habit card to load quickly even with the 7-day timeline, so that the dashboard remains responsive.

#### Acceptance Criteria

1. WHEN a user views the dashboard with multiple habit cards, THE Habit_Tracker_System SHALL render each Seven_Day_Timeline within 200 milliseconds
2. WHEN a user scrolls through the dashboard, THE Habit_Tracker_System SHALL maintain smooth scrolling performance at 60 frames per second
3. WHEN check-in data is loaded from Firestore, THE Habit_Card SHALL use efficient queries to fetch only the required 7 days of data
4. WHEN a user has multiple habits, THE Habit_Tracker_System SHALL batch Firestore queries to minimize network requests
5. WHEN the Seven_Day_Timeline is rendered, THE Habit_Card SHALL use React memoization to prevent unnecessary re-renders

### Requirement 8: Accessibility and Mobile Interaction

**User Story:** As a user on mobile, I want the 7-day timeline to be easy to tap and read, so that I can adjust check-ins comfortably on my phone.

#### Acceptance Criteria

1. WHEN the Seven_Day_Timeline is displayed on mobile, THE Habit_Card SHALL ensure each date has a minimum touch target size of 44x44 pixels
2. WHEN a user taps a date, THE Habit_Card SHALL provide haptic feedback on devices that support it
3. WHEN the Seven_Day_Timeline is displayed, THE Habit_Card SHALL use sufficient color contrast for all status indicators to meet WCAG AA standards
4. WHEN a user uses a screen reader, THE Habit_Card SHALL announce the date and current status for each timeline item
5. WHEN a user changes a status, THE Habit_Card SHALL announce the new status to screen reader users
