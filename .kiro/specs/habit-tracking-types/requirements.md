# Requirements Document

## Introduction

This feature enhances the habit tracking system to support three distinct tracking types: simple task-based habits, count-based habits (tracking number of repetitions), and time-based habits (tracking duration). This allows users to track different types of habits more accurately based on their specific goals.

## Glossary

- **Habit Tracker System**: The application system that manages user habits and check-ins
- **Simple Habit**: A habit tracked with a binary completion state (done/not done)
- **Count Habit**: A habit tracked by the number of times it is completed (e.g., 3 push-ups, 5 glasses of water)
- **Time Habit**: A habit tracked by duration (e.g., 30 minutes of reading, 1 hour of exercise)
- **Tracking Type**: The method used to measure habit completion (simple, count, or time)
- **Target Value**: The goal amount for count or time-based habits
- **Progress Value**: The current amount completed for a given day
- **Check-In**: A record of habit completion for a specific date

## Requirements

### Requirement 1

**User Story:** As a user, I want to select different tracking types when creating a habit, so that I can track my habits in the most appropriate way for each activity

#### Acceptance Criteria

1. WHEN THE Habit Tracker System displays the habit creation form, THE Habit Tracker System SHALL present three tracking type options: Task, Amount, and Time
2. WHEN a user selects the Task tracking type, THE Habit Tracker System SHALL configure the habit for simple binary completion tracking
3. WHEN a user selects the Amount tracking type, THE Habit Tracker System SHALL display an input field for the target count value
4. WHEN a user selects the Time tracking type, THE Habit Tracker System SHALL display an input field for the target duration value
5. WHEN a user submits the habit creation form, THE Habit Tracker System SHALL validate that count-based habits have a target value between 1 and 999

### Requirement 2

**User Story:** As a user, I want to see visual indicators for different tracking types, so that I can quickly identify how each habit should be tracked

#### Acceptance Criteria

1. WHEN THE Habit Tracker System displays a habit card, THE Habit Tracker System SHALL show an icon representing the tracking type (checkmark for task, number for count, clock for time)
2. WHEN THE Habit Tracker System displays a count-based habit card, THE Habit Tracker System SHALL show the target count value with the appropriate unit
3. WHEN THE Habit Tracker System displays a time-based habit card, THE Habit Tracker System SHALL show the target duration in a human-readable format
4. WHEN THE Habit Tracker System displays a habit with partial progress, THE Habit Tracker System SHALL show the current progress value alongside the target value

### Requirement 3

**User Story:** As a user, I want to check in count-based habits by incrementing the count, so that I can track multiple completions throughout the day

#### Acceptance Criteria

1. WHEN a user taps a count-based habit card, THE Habit Tracker System SHALL increment the progress value by 1
2. WHEN the progress value reaches the target count, THE Habit Tracker System SHALL mark the habit as completed for that day
3. WHEN a user taps a completed count-based habit, THE Habit Tracker System SHALL allow incrementing beyond the target value
4. WHEN THE Habit Tracker System displays a count-based habit, THE Habit Tracker System SHALL show the current count and target count (e.g., "3/5")
5. WHEN a user long-presses a count-based habit card, THE Habit Tracker System SHALL display options to manually adjust the count or reset to zero

### Requirement 4

**User Story:** As a user, I want to log time for time-based habits, so that I can accurately track duration-based activities

#### Acceptance Criteria

1. WHEN a user taps a time-based habit card, THE Habit Tracker System SHALL display a time input interface
2. WHEN a user enters a duration value, THE Habit Tracker System SHALL add the entered time to the current progress
3. WHEN the progress duration reaches or exceeds the target duration, THE Habit Tracker System SHALL mark the habit as completed for that day
4. WHEN THE Habit Tracker System displays a time-based habit, THE Habit Tracker System SHALL show the current duration and target duration in appropriate units
5. WHEN a user long-presses a time-based habit card, THE Habit Tracker System SHALL display options to manually adjust the time or reset to zero

### Requirement 5

**User Story:** As a user, I want my existing simple habits to continue working without changes, so that my tracking history remains intact

#### Acceptance Criteria

1. WHEN THE Habit Tracker System loads existing habits without a tracking type, THE Habit Tracker System SHALL default them to simple task tracking
2. WHEN THE Habit Tracker System displays legacy habit check-ins, THE Habit Tracker System SHALL render them correctly as simple completions
3. WHEN a user edits an existing simple habit, THE Habit Tracker System SHALL allow changing the tracking type while preserving the habit history
4. WHEN THE Habit Tracker System calculates analytics for habits, THE Habit Tracker System SHALL handle all three tracking types correctly in streak and completion rate calculations
