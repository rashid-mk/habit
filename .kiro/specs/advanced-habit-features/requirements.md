# Requirements Document

## Introduction

This feature adds advanced habit configuration options including goals, time of day preferences, custom start dates, and end conditions. It also fixes streak calculation issues for habits with specific frequency schedules.

## Glossary

- **Goal**: A target number of times to complete a habit within a time period (e.g., "2 times per day")
- **Time of Day**: Preferred time periods for completing a habit (Morning, Afternoon, Evening)
- **Start Date**: Custom date when the habit tracking begins (instead of creation date)
- **End Condition**: Criteria that determines when a habit is considered complete or finished
- **Streak**: Consecutive days where a habit was completed on active days

## Requirements

### Requirement 1: Fix Streak Calculation for Frequency-Based Habits

**User Story:** As a user with habits that have specific day frequencies, I want accurate streak counting that only considers my active days, so that my progress is correctly tracked

#### Acceptance Criteria

1. WHEN calculating streaks for habits with specific day frequencies, THE System SHALL only count active days in the streak
2. THE System SHALL not break streaks on inactive days (days not in the frequency list)
3. THE System SHALL correctly handle "not_done" status on active days by resetting the streak to 0
4. THE System SHALL skip over inactive days when counting consecutive completions
5. THE System SHALL calculate longest streak using the same active-day-only logic

### Requirement 2: Add Goal Configuration

**User Story:** As a user, I want to set a daily goal for how many times I should complete a habit, so that I can track multiple completions per day

#### Acceptance Criteria

1. WHEN creating a habit, THE System SHALL allow the user to set a goal (number of times per day)
2. THE System SHALL default the goal to 1 if not specified
3. THE System SHALL validate that the goal is a positive integer between 1 and 10
4. THE System SHALL store the goal value in the habit document
5. THE System SHALL display the goal on the habit card and detail page

### Requirement 3: Add Time of Day Preferences

**User Story:** As a user, I want to specify when during the day I prefer to do my habit, so that I can better plan my routine

#### Acceptance Criteria

1. WHEN creating a habit, THE System SHALL allow the user to select time of day preferences (Morning, Afternoon, Evening)
2. THE System SHALL allow multiple time periods to be selected
3. THE System SHALL store the selected time periods in the habit document
4. THE System SHALL display time of day badges on the habit card
5. WHERE no time periods are selected, THE System SHALL treat the habit as "anytime"

### Requirement 4: Add Custom Start Date

**User Story:** As a user, I want to set a custom start date for my habit, so that I can backdate or future-date habit tracking

#### Acceptance Criteria

1. WHEN creating a habit, THE System SHALL allow the user to select a custom start date
2. THE System SHALL default the start date to today if not specified
3. THE System SHALL prevent check-ins before the start date
4. THE System SHALL calculate analytics from the start date forward
5. THE System SHALL display the start date in the habit details

### Requirement 5: Add End Condition Options

**User Story:** As a user, I want to set when my habit should end, so that I can track time-bound goals

#### Acceptance Criteria

1. WHEN creating a habit, THE System SHALL allow the user to select an end condition type
2. THE System SHALL support the following end condition types:
   - Never (default)
   - On a Date (specific calendar date)
   - After Total Completions (number of successful days)
3. WHERE "On a Date" is selected, THE System SHALL allow date selection
4. WHERE "After Total Completions" is selected, THE System SHALL allow entering a target number
5. THE System SHALL mark habits as completed when the end condition is met
