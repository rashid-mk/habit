# Implementation Plan

- [x] 1. Enhance check document structure and hooks

  - [x] 1.1 Update CheckIn interface to include status field


    - Modify the `CheckIn` interface in `src/hooks/useHabits.ts` to add optional `status: 'done' | 'not_done'` field
    - Ensure backward compatibility by treating documents without status as 'done'
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.2 Enhance useHabitChecks hook with date range filtering


    - Add optional `startDate` and `endDate` parameters to `useHabitChecks` hook
    - Implement Firestore query with date range filtering using `where` clauses
    - Update query key to include date range for proper caching
    - _Requirements: 1.1, 7.3_

  - [x] 1.3 Create useToggleCheckIn hook for status cycling


    - Implement custom hook in `src/hooks/useHabits.ts` that handles status transitions
    - Implement `getNextStatus` function: skip → done → not_done → skip
    - Create mutation function that creates, updates, or deletes check documents based on status
    - Integrate with existing analytics update logic
    - Add optimistic updates and error handling with rollback
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_


- [ ] 2. Create TimelineDay component
  - [x] 2.1 Implement TimelineDay component structure


    - Create new file `src/components/TimelineDay.tsx`
    - Define `TimelineDayProps` interface with date, status, habitId, habitColor, isBreakHabit, onStatusChange, isLoading
    - Implement component that displays date (day name and number) and status indicator
    - Add minimum touch target size of 44x44 pixels
    - _Requirements: 1.2, 1.3, 8.1_


  - [ ] 2.2 Implement status visual indicators
    - Create three distinct visual states: skip (gray dash), done (green checkmark), not_done (red X)
    - Apply different colors for break habits (red for done, orange for not_done)
    - Use habitColor prop if provided for custom coloring
    - Ensure WCAG AA color contrast standards
    - _Requirements: 1.4, 1.5, 1.6, 8.3_


  - [ ] 2.3 Add tap/click interaction and animations
    - Implement onClick handler that calls onStatusChange callback
    - Add optimistic UI feedback with scale animation on tap
    - Show loading spinner when isLoading is true
    - Disable interaction during loading state
    - Add CSS transitions for smooth state changes

    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.4_

  - [ ] 2.4 Implement accessibility features
    - Add proper ARIA labels with date and status information

    - Make component keyboard accessible (Tab, Space, Enter)
    - Add screen reader announcements for status changes
    - Support high contrast mode and reduced motion preferences


    - _Requirements: 8.4, 8.5_

- [ ] 3. Create SevenDayTimeline component
  - [x] 3.1 Implement SevenDayTimeline component structure

    - Create new file `src/components/SevenDayTimeline.tsx`
    - Define `SevenDayTimelineProps` interface with habitId, habitStartDate, habitColor, isBreakHabit
    - Implement vertical layout container with glassmorphism styling
    - _Requirements: 1.1, 1.2_

  - [ ] 3.2 Implement date calculation logic
    - Calculate 7-day date range from today back 6 days

    - Respect habit start date (don't show dates before habit creation)
    - Handle timezone using dayjs with local timezone
    - Format dates for display (day name and day number)
    - Mark today's date with isToday flag
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [ ] 3.3 Fetch and map check-in data
    - Use enhanced `useHabitChecks` hook with date range filtering
    - Map check documents to timeline dates
    - Determine status for each date: 'done' if document exists with status='done', 'not_done' if status='not_done', 'skip' if no document
    - Handle loading and error states from query
    - _Requirements: 1.3, 1.4, 1.5, 1.6_


  - [ ] 3.4 Render TimelineDay components
    - Map over calculated dates array and render TimelineDay for each

    - Pass appropriate props including date, status, habitId, habitColor, isBreakHabit
    - Implement onStatusChange handler that calls useToggleCheckIn hook
    - Add proper spacing between timeline days (gap-2)
    - _Requirements: 1.1, 1.2, 2.1_



  - [ ] 3.5 Add error handling and user feedback
    - Display error message if check-in data fails to load
    - Show retry button on error
    - Implement error toast for failed status changes

    - Handle rollback on mutation failure
    - _Requirements: 6.2, 6.3_

- [ ] 4. Integrate timeline into HabitCard
  - [ ] 4.1 Add SevenDayTimeline to HabitCard component
    - Import SevenDayTimeline component in `src/components/HabitCard.tsx`


    - Add timeline section between stats and quick actions sections

    - Pass habitId, habit.startDate, habit.color, and isBreakHabit as props


    - Add collapsible/expandable functionality with toggle button
    - _Requirements: 1.1_

  - [ ] 4.2 Style timeline integration with glassmorphism theme
    - Apply consistent glassmorphism styling to timeline container

    - Match existing card theme (different styling for build vs break habits)
    - Add smooth expand/collapse animation
    - Ensure responsive design for mobile and desktop
    - _Requirements: 7.1, 7.2_




  - [ ] 4.3 Optimize rendering performance
    - Memoize SevenDayTimeline component with React.memo
    - Memoize TimelineDay components with React.memo
    - Use useMemo for date calculations
    - Ensure smooth scrolling performance on dashboard


    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 5. Update analytics to handle not_done status
  - [x] 5.1 Enhance analytics calculator for status field

    - Update `src/utils/analyticsCalculator.ts` to read status field from check documents
    - Modify streak calculation to break on 'not_done' status
    - Update completion rate to count only 'done' status as completed
    - Maintain backward compatibility for documents without status field
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 5.2 Ensure analytics updates trigger on status changes
    - Verify useToggleCheckIn hook triggers analytics recalculation
    - Test that analytics update within 2-3 seconds after status change
    - Invalidate React Query cache for analytics after mutations
    - _Requirements: 4.4, 4.5, 3.5_

- [ ] 6. Add mobile optimizations
  - [ ] 6.1 Implement responsive design for timeline
    - Add responsive breakpoints for mobile, tablet, and desktop
    - Adjust touch target sizes for mobile (ensure 44x44 minimum)
    - Optimize spacing and layout for small screens
    - _Requirements: 8.1, 8.2_

  - [ ] 6.2 Add haptic feedback for mobile devices
    - Implement haptic feedback on status toggle using Vibration API
    - Check for device support before triggering haptic feedback
    - Make haptic feedback subtle and non-intrusive
    - _Requirements: 8.2_

  - [ ] 6.3 Optimize performance for mobile devices
    - Test rendering performance on low-end devices
    - Minimize re-renders with proper memoization
    - Use efficient CSS animations (transform and opacity only)
    - Lazy load timeline data if needed
    - _Requirements: 7.1, 7.2_

- [ ] 7. Write tests for timeline components
  - [ ] 7.1 Write unit tests for TimelineDay component
    - Test rendering of different status states (skip, done, not_done)
    - Test status cycling on tap interaction
    - Test loading state display
    - Test accessibility features (ARIA labels, keyboard navigation)
    - Test minimum touch target size
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 8.1, 8.4_

  - [ ] 7.2 Write unit tests for SevenDayTimeline component
    - Test date calculation logic (7-day range, habit start date boundary)
    - Test check-in data mapping to timeline dates
    - Test loading and error states
    - Test rendering of TimelineDay components
    - _Requirements: 1.1, 1.2, 5.3, 5.4, 5.5_

  - [ ] 7.3 Write unit tests for useToggleCheckIn hook
    - Test status transition logic (skip → done → not_done → skip)
    - Test Firestore mutations (create, update, delete)
    - Test analytics trigger after mutation
    - Test error handling and rollback
    - Test optimistic updates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 7.4 Write integration tests for timeline feature
    - Test complete user flow: view timeline, toggle status, verify analytics update
    - Test offline behavior with queued mutations
    - Test concurrent status changes on multiple dates
    - Test error recovery and retry mechanism
    - _Requirements: 3.5, 4.1, 4.2, 4.3, 6.2, 6.3_

- [ ] 8. Performance testing and optimization
  - [ ] 8.1 Measure and optimize query performance
    - Test Firestore query performance with date range filtering
    - Verify efficient caching with React Query
    - Measure time to fetch 7-day check-in data
    - Optimize query if needed (add indexes, batch requests)
    - _Requirements: 7.3, 7.4_

  - [ ] 8.2 Measure and optimize rendering performance
    - Test rendering time for timeline on dashboard with multiple habits
    - Verify 60fps scrolling performance
    - Profile component re-renders and optimize with memoization
    - Test on low-end mobile devices
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 8.3 Test animation performance
    - Verify all animations run at 60fps
    - Test on various devices (mobile, tablet, desktop)
    - Optimize animations if needed (use GPU-accelerated properties)
    - Test with reduced motion preference enabled
    - _Requirements: 7.1, 7.2_
