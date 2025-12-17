# Implementation Plan

- [x] 1. Update data models and TypeScript interfaces


  - Add `trackingType`, `targetValue`, and `targetUnit` fields to the `Habit` interface in `src/hooks/useHabits.ts`
  - Add `progressValue` and `isCompleted` fields to the `CheckIn` interface
  - Update `HabitFormData` interface in `src/components/CreateHabitForm.tsx` to include new tracking fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_



- [ ] 2. Extend habit creation backend logic
  - [ ] 2.1 Update `useCreateHabit` hook to handle new tracking type fields
    - Modify the mutation function to save `trackingType`, `targetValue`, and `targetUnit` to Firestore
    - Add validation for target values (1-999 range)


    - Set default `trackingType` to 'simple' if not provided
    - _Requirements: 1.5, 5.1_
  
  - [x] 2.2 Update habit update logic in `src/hooks/useUpdateHabit.ts`


    - Allow updating tracking type and target values
    - Preserve existing check-in data when changing tracking type
    - _Requirements: 5.3_

- [x] 3. Create tracking type selector component


  - [ ] 3.1 Create `TrackingTypeSelector.tsx` component
    - Implement three-button layout (Task, Amount, Time)
    - Add icons for each tracking type (checkmark, hash, clock)
    - Handle selection state and onChange callback
    - Style with gradient backgrounds and hover effects
    - _Requirements: 1.1, 1.2, 1.3, 1.4_


  
  - [ ] 3.2 Create `TargetValueInput.tsx` component
    - Implement number input with increment/decrement buttons
    - Add unit selector for time habits (minutes/hours)

    - Add validation for 1-999 range
    - Show appropriate labels based on tracking type
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 4. Update CreateHabitForm component


  - [ ] 4.1 Integrate tracking type selector
    - Add state management for `trackingType`, `targetValue`, and `targetUnit`
    - Place selector after habit type selection
    - Show/hide target value input based on selected tracking type
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 4.2 Update form validation
    - Validate target value is present for count/time habits
    - Validate target value is within 1-999 range
    - Add appropriate error messages
    - _Requirements: 1.5_
  
  - [ ] 4.3 Update form submission
    - Include new tracking fields in form data
    - Handle unit conversion (hours to minutes for storage)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Enhance HabitCard component for different tracking types
  - [x] 5.1 Add tracking type icon display


    - Show checkmark icon for simple habits
    - Show number icon for count habits
    - Show clock icon for time habits
    - Position icon in top-right corner of card
    - _Requirements: 2.1_

  
  - [ ] 5.2 Implement progress display logic
    - For simple habits: Show checkmark when complete
    - For count habits: Show "X/Y times" format
    - For time habits: Show "X/Y min" or "X/Y hrs" format
    - Add progress bar visualization



    - _Requirements: 2.2, 2.3, 2.4, 3.4, 4.4_
  
  - [ ] 5.3 Update check-in interaction
    - Simple habits: Keep existing single-tap behavior
    - Count habits: Single tap increments by 1
    - Time habits: Single tap opens check-in modal
    - Add long-press handler for manual adjustment (all types)
    - _Requirements: 3.1, 3.2, 3.5, 4.1_



- [ ] 6. Create CheckInModal component
  - [ ] 6.1 Build modal structure and layout
    - Create modal backdrop and container
    - Add header with habit name and current progress

    - Add close button and keyboard escape handler
    - Style with backdrop blur and smooth animations
    - _Requirements: 3.5, 4.1_
  
  - [ ] 6.2 Implement count habit interface
    - Display current count and target
    - Add quick increment buttons (+1, +5, +10)

    - Add manual input field
    - Add reset button
    - Show completion celebration when target reached
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 6.3 Implement time habit interface
    - Display current time and target
    - Add quick add buttons (+5 min, +15 min, +30 min)
    - Add time picker for custom duration
    - Add reset button
    - Show completion celebration when target reached
    - Handle unit display (minutes vs hours)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Update check-in backend logic
  - [x] 7.1 Extend `useCheckIn` hook for progress tracking



    - Modify mutation to accept `progressValue` parameter
    - Calculate `isCompleted` based on progress vs target
    - Update Firestore write to include new fields
    - Maintain backward compatibility for simple habits

    - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3, 5.1, 5.2_
  
  - [ ] 7.2 Update `useUndoCheckIn` hook
    - Handle resetting progress value

    - Update completion status correctly
    - _Requirements: 3.5, 4.5_
  
  - [ ] 7.3 Create `useUpdateProgress` hook
    - Allow incrementing/decrementing progress
    - Allow setting specific progress value
    - Implement optimistic updates

    - Handle rollback on error
    - _Requirements: 3.1, 3.2, 3.5, 4.2, 4.5_

- [ ] 8. Update analytics calculation
  - [ ] 8.1 Modify `calculateAnalyticsLocal` function
    - Handle completion based on `isCompleted` field
    - Support all three tracking types in streak calculation
    - Maintain backward compatibility with legacy check-ins
    - _Requirements: 5.4_
  
  - [ ] 8.2 Update habit detail page displays
    - Show appropriate progress information in timeline

    - Update completion rate card for different tracking types
    - Display target values in habit details
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 9. Add backward compatibility handling

  - [ ] 9.1 Create migration utility functions
    - Function to detect legacy habits (no trackingType)
    - Function to default legacy habits to 'simple' type
    - Function to handle legacy check-ins without progressValue
    - _Requirements: 5.1, 5.2_
  
  - [ ] 9.2 Update habit loading logic
    - Apply defaults when loading habits without tracking type
    - Ensure all components handle undefined tracking fields
    - _Requirements: 5.1, 5.2_

- [ ] 10. Update EditHabitForm component
  - [ ] 10.1 Add tracking type editing
    - Show current tracking type
    - Allow changing tracking type
    - Show warning about preserving history
    - Update target value when changing type
    - _Requirements: 5.3_
  
  - [ ] 10.2 Update form validation and submission
    - Apply same validation as create form
    - Handle tracking type changes properly
    - _Requirements: 5.3_

- [ ] 11. Polish UI and add visual feedback
  - [ ] 11.1 Add progress bar animations
    - Smooth progress bar fill animation
    - Color transitions (gray → blue → green)
    - Pulse effect when target reached
    - _Requirements: 2.4_
  
  - [ ] 11.2 Add celebration effects
    - Confetti or sparkle animation when target reached
    - Success sound (optional, respects settings)
    - Haptic feedback on mobile
    - _Requirements: 3.2, 4.3_
  


  - [ ] 11.3 Improve accessibility
    - Add ARIA labels for tracking type icons
    - Add screen reader announcements for progress updates
    - Ensure keyboard navigation works in modal
    - Test with screen readers
    - _Requirements: 2.1, 2.4_

- [ ] 12. Build and verify implementation
  - Run `npm run build` to check for TypeScript errors
  - Verify all components render correctly
  - Test creating habits with all three tracking types
  - Test check-ins for all tracking types
  - Test backward compatibility with existing habits
  - Verify analytics calculations work correctly
  - _Requirements: All_
