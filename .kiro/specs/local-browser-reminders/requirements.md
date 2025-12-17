# Requirements Document

## Introduction

This feature adds local browser-based reminders for habits that work using the system time. Users can set a reminder time for each habit, and the browser will show a notification at that time if the habit hasn't been completed yet.

## Glossary

- **Browser System**: The web browser running the habit tracker application
- **Local Reminder**: A notification triggered by the browser at a specific time using JavaScript timers
- **Reminder Time**: The time of day when the user wants to be reminded about a habit
- **System Time**: The local time on the user's device
- **Notification API**: Browser API for showing system notifications

## Requirements

### Requirement 1: Set Reminder Time

**User Story:** As a user, I want to set a reminder time for each habit, so that I get notified when it's time to complete my habit

#### Acceptance Criteria

1. WHEN creating a habit, THE Browser System SHALL allow the user to optionally set a reminder time
2. WHEN editing a habit, THE Browser System SHALL allow the user to add, modify, or remove the reminder time
3. THE Browser System SHALL store the reminder time in the habit document in Firestore
4. THE Browser System SHALL display the reminder time on the habit card if set
5. THE Browser System SHALL validate that the reminder time is in valid HH:MM format

### Requirement 2: Request Notification Permission

**User Story:** As a user, I want to grant notification permission once, so that I can receive habit reminders

#### Acceptance Criteria

1. WHEN the user first sets a reminder, THE Browser System SHALL request notification permission
2. IF permission is denied, THEN THE Browser System SHALL display a message explaining how to enable notifications
3. THE Browser System SHALL remember the permission status
4. THE Browser System SHALL show a notification permission prompt only once per session
5. WHERE notification permission is granted, THE Browser System SHALL enable reminder functionality

### Requirement 3: Trigger Local Reminders

**User Story:** As a user, I want to receive browser notifications at my set reminder time, so that I remember to complete my habits

#### Acceptance Criteria

1. WHEN the system time matches a habit's reminder time, THE Browser System SHALL check if the habit is completed for today
2. IF the habit is not completed AND today is an active day, THEN THE Browser System SHALL show a browser notification
3. THE Browser System SHALL include the habit name in the notification title
4. THE Browser System SHALL include a motivational message in the notification body
5. WHEN the user clicks the notification, THE Browser System SHALL navigate to the habit detail page

### Requirement 4: Check Reminders Periodically

**User Story:** As a user, I want reminders to work even if I open the app after the reminder time, so that I don't miss important habits

#### Acceptance Criteria

1. WHEN the app loads, THE Browser System SHALL check all habits for pending reminders
2. THE Browser System SHALL check for reminders every minute while the app is open
3. IF a reminder time has passed AND the habit is not completed, THEN THE Browser System SHALL show the notification
4. THE Browser System SHALL only show each reminder once per day
5. THE Browser System SHALL not show reminders for inactive days

### Requirement 5: Manage Reminder State

**User Story:** As a user, I want reminders to stop after I complete a habit, so that I don't get unnecessary notifications

#### Acceptance Criteria

1. WHEN a habit is marked as complete, THE Browser System SHALL not show reminders for that habit today
2. THE Browser System SHALL track which reminders have been shown today
3. WHEN the day changes, THE Browser System SHALL reset the reminder tracking
4. THE Browser System SHALL store reminder state in browser localStorage
5. THE Browser System SHALL clear old reminder state after 7 days
