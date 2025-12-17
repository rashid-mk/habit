# Design Document

## Overview

This design extends the existing habit tracking system to support three distinct tracking types: simple task-based, count-based, and time-based habits. The implementation maintains backward compatibility with existing habits while adding new data fields and UI components to handle different tracking methods.

## Architecture

### Data Model Changes

The `Habit` interface will be extended with new fields:

```typescript
export interface Habit {
  id: string
  habitName: string
  habitType?: 'build' | 'break'
  trackingType: 'simple' | 'count' | 'time' // NEW
  targetValue?: number // NEW - for count (number) or time (minutes)
  targetUnit?: 'times' | 'minutes' | 'hours' // NEW - display unit
  color?: string
  frequency: 'daily' | string[]
  reminderTime?: string
  startDate: Timestamp
  createdAt: Timestamp
  isActive: boolean
  endConditionType?: 'never' | 'on_date' | 'after_completions'
  endConditionValue?: string | number
}
```

The `CheckIn` interface will be extended:

```typescript
export interface CheckIn {
  dateKey: string
  completedAt: Timestamp
  habitId: string
  status?: 'done' | 'not_done'
  progressValue?: number // NEW - current count or minutes logged
  isCompleted: boolean // NEW - whether target was reached
}
```

### Component Structure

```
CreateHabitForm
├── Tracking Type Selector (NEW)
│   ├── Task Button
│   ├── Amount Button
│   └── Time Button
├── Target Value Input (NEW - conditional)
│   ├── Count Input (for amount type)
│   └── Duration Input (for time type)
└── Existing form fields...

HabitCard
├── Tracking Type Icon (NEW)
├── Progress Display (ENHANCED)
│   ├── Simple: Checkmark only
│   ├── Count: "3/5 times"
│   └── Time: "15/30 min"
└── Check-in Button (ENHANCED)

CheckInModal (NEW - for count/time habits)
├── Current Progress Display
├── Input Interface
│   ├── Quick Add Buttons (+1, +5, +10 for count)
│   ├── Time Picker (for time)
│   └── Manual Input Field
└── Action Buttons (Save, Cancel, Reset)
```

## Components and Interfaces

### 1. Tracking Type Selector Component

A new section in the `CreateHabitForm` that allows users to choose the tracking type:

```typescript
interface TrackingTypeSelectorProps {
  selectedType: 'simple' | 'count' | 'time'
  onTypeChange: (type: 'simple' | 'count' | 'time') => void
  disabled?: boolean
}
```

**Visual Design:**
- Three horizontally arranged cards/buttons
- Each with an icon and label
- Active state with colored border and background
- Icons: ✓ (Task), # (Amount), ⏱ (Time)

### 2. Target Value Input Component

Conditional input that appears based on selected tracking type:

```typescript
interface TargetValueInputProps {
  trackingType: 'count' | 'time'
  value: number
  unit: 'times' | 'minutes' | 'hours'
  onValueChange: (value: number) => void
  onUnitChange: (unit: 'times' | 'minutes' | 'hours') => void
  disabled?: boolean
}
```

**For Count Type:**
- Number input with increment/decrement buttons
- Label: "How many times?"
- Range: 1-999
- Unit selector: "times" (default)

**For Time Type:**
- Number input with increment/decrement buttons
- Label: "How long?"
- Range: 1-999
- Unit selector: "minutes" or "hours"

### 3. Enhanced Habit Card

The existing `HabitCard` component will be enhanced to display tracking type information:

**Simple Habits:**
- Current behavior (checkmark when complete)

**Count Habits:**
- Show progress: "3/5 times" or "3/5"
- Progress bar showing percentage
- Tap to increment by 1
- Long-press for manual adjustment

**Time Habits:**
- Show progress: "15/30 min" or "1.5/2 hrs"
- Progress bar showing percentage
- Tap to open time input modal
- Long-press for manual adjustment

### 4. Check-In Modal (NEW)

A modal for logging count or time progress:

```typescript
interface CheckInModalProps {
  habit: Habit
  currentProgress: number
  onSave: (newProgress: number) => void
  onClose: () => void
}
```

**For Count Habits:**
- Display current count
- Quick add buttons: +1, +5, +10
- Manual input field
- Reset button
- Visual feedback when target reached

**For Time Habits:**
- Display current time logged
- Quick add buttons: +5 min, +15 min, +30 min
- Time picker for custom duration
- Reset button
- Visual feedback when target reached

## Data Models

### Database Schema Changes

**Firestore Structure (unchanged paths, new fields):**

```
users/{userId}/habits/{habitId}
  - trackingType: 'simple' | 'count' | 'time'
  - targetValue: number (optional)
  - targetUnit: 'times' | 'minutes' | 'hours' (optional)
  - ... existing fields

users/{userId}/habits/{habitId}/checks/{dateKey}
  - progressValue: number (optional)
  - isCompleted: boolean
  - ... existing fields
```

### Migration Strategy

**Backward Compatibility:**
- Existing habits without `trackingType` default to 'simple'
- Existing check-ins without `progressValue` are treated as simple completions
- No data migration required - handled at read time

### Validation Rules

**Habit Creation:**
- `trackingType` is required (defaults to 'simple')
- If `trackingType` is 'count' or 'time', `targetValue` must be between 1 and 999
- If `trackingType` is 'count' or 'time', `targetUnit` is required

**Check-In:**
- For simple habits: `progressValue` is not used
- For count habits: `progressValue` must be >= 0
- For time habits: `progressValue` must be >= 0 (in minutes)
- `isCompleted` is true when `progressValue >= targetValue`

## Error Handling

### Validation Errors

1. **Missing Target Value:**
   - Error: "Please enter a target value"
   - When: User selects count/time but doesn't enter target

2. **Invalid Target Value:**
   - Error: "Target must be between 1 and 999"
   - When: User enters value outside valid range

3. **Invalid Progress Value:**
   - Error: "Please enter a valid number"
   - When: User enters non-numeric or negative value

### Network Errors

- Use existing error handling patterns from `useCheckIn` hook
- Optimistic updates for immediate UI feedback
- Rollback on failure with error message

## Testing Strategy

### Unit Tests

1. **Tracking Type Selector:**
   - Renders all three options
   - Calls onChange with correct type
   - Shows active state correctly

2. **Target Value Input:**
   - Validates input range
   - Handles unit changes
   - Increments/decrements correctly

3. **Enhanced Habit Card:**
   - Displays correct progress format for each type
   - Calculates completion percentage correctly
   - Shows appropriate icons

4. **Check-In Modal:**
   - Quick add buttons work correctly
   - Manual input validates properly
   - Saves correct progress value

### Integration Tests

1. **Create Count Habit Flow:**
   - Select amount tracking type
   - Enter target value
   - Submit form
   - Verify habit created with correct data

2. **Check-In Count Habit Flow:**
   - Tap habit card
   - Increment count
   - Verify progress updates
   - Verify completion when target reached

3. **Create Time Habit Flow:**
   - Select time tracking type
   - Enter target duration
   - Submit form
   - Verify habit created with correct data

4. **Check-In Time Habit Flow:**
   - Tap habit card
   - Open modal
   - Add time
   - Verify progress updates
   - Verify completion when target reached

### Edge Cases

1. **Legacy Habits:**
   - Verify habits without trackingType display as simple
   - Verify check-ins work correctly

2. **Progress Beyond Target:**
   - Count habits can exceed target
   - Time habits can exceed target
   - Still marked as completed

3. **Multiple Check-Ins Same Day:**
   - Progress accumulates correctly
   - Completion state updates properly

## UI/UX Considerations

### Visual Hierarchy

1. **Tracking Type Selection:**
   - Prominent placement in create form
   - Clear visual distinction between types
   - Helpful descriptions/examples

2. **Progress Display:**
   - Large, readable numbers
   - Progress bar for visual feedback
   - Color coding (incomplete: gray, in-progress: blue, complete: green)

3. **Check-In Interaction:**
   - Simple habits: Single tap to complete
   - Count habits: Single tap to increment, long-press for modal
   - Time habits: Single tap to open modal

### Responsive Design

- Mobile: Full-width cards, bottom sheet modal
- Desktop: Grid layout, centered modal dialog
- Touch targets: Minimum 44x44px for all interactive elements

### Accessibility

- ARIA labels for tracking type icons
- Screen reader announcements for progress updates
- Keyboard navigation support for modal
- High contrast mode support

### Animation and Feedback

- Smooth transitions when switching tracking types
- Progress bar animation when updating
- Celebration animation when target reached
- Haptic feedback on mobile (if available)

## Performance Considerations

### Optimistic Updates

- Immediate UI update when checking in
- Background sync with Firestore
- Rollback on error

### Caching

- Cache habit data in React Query
- Minimize Firestore reads
- Use local calculations for progress percentages

### Bundle Size

- No new dependencies required
- Reuse existing UI components
- Minimal code addition (~500 lines)

## Implementation Notes

### Phase 1: Data Model & Backend
- Update TypeScript interfaces
- Extend Firestore write operations
- Add validation logic
- Maintain backward compatibility

### Phase 2: Create Habit UI
- Add tracking type selector
- Add target value inputs
- Update form validation
- Update form submission

### Phase 3: Habit Card Enhancement
- Add tracking type icons
- Update progress display logic
- Enhance check-in interaction
- Add progress bars

### Phase 4: Check-In Modal
- Create modal component
- Implement count interface
- Implement time interface
- Add quick action buttons

### Phase 5: Testing & Polish
- Write unit tests
- Write integration tests
- Test backward compatibility
- Polish animations and transitions
