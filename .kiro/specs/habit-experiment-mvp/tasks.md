# Implementation Plan

- [x] 1. Initialize project structure and Firebase configuration





  - Create React app with Vite, install dependencies (React Router, React Query, TailwindCSS, Firebase SDK, Day.js)
  - Initialize Firebase project and configure Firebase services (Auth, Firestore, Functions, Hosting)
  - Set up environment variables for Firebase config
  - Configure Firestore offline persistence
  - _Requirements: 7.4_

- [x] 2. Implement authentication system




  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Create authentication components and pages


  - Build LoginPage component with email/password and Google OAuth forms
  - Build SignupPage component with email/password registration
  - Implement AuthGuard component for protected routes
  - Add authentication state management with React Query
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2.2 Implement Firebase Auth integration

  - Integrate signInWithEmailAndPassword for email login
  - Integrate signInWithPopup for Google OAuth
  - Integrate createUserWithEmailAndPassword for signup
  - Implement onAuthStateChanged listener for session management
  - Create user profile document in Firestore on signup
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 2.3 Add authentication error handling

  - Handle auth/user-not-found, auth/wrong-password, auth/email-already-in-use errors
  - Display user-friendly error messages
  - Implement redirect logic for authenticated users
  - _Requirements: 1.4_

- [x] 2.4 Write authentication tests


  - Test login flow with mock Firebase Auth
  - Test signup flow and user profile creation
  - Test AuthGuard redirect behavior
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3. Build habit creation functionality





  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Create habit form component


  - Build CreateHabitForm with inputs for habit name, frequency, duration, reminder time
  - Implement form validation (habit name 1-100 chars, frequency selection, optional reminder)
  - Add form state management and error display
  - _Requirements: 2.1, 2.3_

- [x] 3.2 Implement habit creation logic


  - Create Firestore write function to add habit document at /users/{uid}/habits/{habitId}
  - Initialize analytics document with zero values
  - Implement success redirect to dashboard
  - Add error handling for Firestore writes
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 3.3 Write habit creation tests


  - Test form validation logic
  - Test Firestore document creation with mock data
  - Test redirect behavior on success
  - _Requirements: 2.1, 2.2_

- [x] 4. Implement dashboard and habit display





  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.1 Create Dashboard component


  - Build Dashboard page to display list of user habits
  - Implement Firestore query to fetch habits from /users/{uid}/habits
  - Add loading and error states
  - Integrate React Query for data fetching and caching
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.2 Create analytics display components


  - Build StreakDisplay component showing current and longest streak
  - Build CompletionRateCard component with percentage and progress bar
  - Fetch analytics data from /users/{uid}/habits/{habitId}/analytics
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.3 Build HabitDetailPage component


  - Create habit detail page with route parameter for habitId
  - Display habit information and analytics
  - Add navigation from dashboard to detail page
  - _Requirements: 4.4_

- [x] 4.4 Write dashboard tests


  - Test habit list rendering with mock data
  - Test analytics display components
  - Test navigation to habit detail page
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Implement daily check-in functionality





  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Create CheckInButton component


  - Build one-tap check-in button with optimistic UI
  - Implement optimistic state update (show completed immediately)
  - Add rollback logic for failed writes
  - Display completion feedback within 100ms
  - _Requirements: 3.1, 3.4_

- [x] 5.2 Implement check-in Firestore write


  - Write check document to /users/{uid}/habits/{habitId}/checks/{dateKey}
  - Use dateKey as document ID (format: YYYY-MM-DD)
  - Prevent duplicate check-ins for same date
  - Add error handling and retry logic
  - _Requirements: 3.2, 3.5_

- [x] 5.3 Write check-in tests


  - Test optimistic UI update behavior
  - Test Firestore write with mock data
  - Test duplicate check-in prevention
  - Test rollback on error
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 6. Build timeline graph visualization




  - _Requirements: 4.4_

- [x] 6.1 Create TimelineGraph component


  - Build 30-day grid visualization showing completed/missed days
  - Implement date range generation for last 30 days
  - Query check-in data from /users/{uid}/habits/{habitId}/checks
  - Color-code cells based on completion status
  - _Requirements: 4.4_


- [x] 6.2 Write timeline graph tests

  - Test date range generation logic
  - Test completion status calculation
  - Test rendering with various check-in patterns
  - _Requirements: 4.4_

- [x] 7. Implement Cloud Functions for backend logic





  - _Requirements: 3.3, 4.5_


- [x] 7.1 Set up Cloud Functions project

  - Initialize Firebase Cloud Functions with Node.js 18
  - Install dependencies (firebase-admin, firebase-functions, dayjs)
  - Configure TypeScript for Cloud Functions
  - Set up local emulator for testing
  - _Requirements: 3.3, 4.5_


- [x] 7.2 Create onCheckWrite trigger function

  - Implement Firestore trigger on /users/{uid}/habits/{habitId}/checks/{dateKey} onCreate
  - Fetch all checks for the habit
  - Calculate current streak (consecutive days from today backward)
  - Calculate longest streak (max consecutive days in history)
  - Calculate completion rate (completed days / total days)
  - Update analytics document atomically
  - Complete processing within 800ms
  - _Requirements: 3.3, 4.5_




- [x] 7.3 Add analytics calculation logic





  - Implement current streak algorithm (count backward from today)
  - Implement longest streak algorithm (find max consecutive sequence)
  - Implement completion rate calculation (completed / total days * 100)
  - Handle edge cases (first check-in, gaps in streak, habit start date)
  - _Requirements: 4.5_


- [x] 7.4 Write Cloud Function tests


  - Test analytics calculations with various check-in patterns
  - Test with Firestore emulator
  - Test edge cases (no checks, single check, gaps)
  - Test performance (complete within 800ms)
  - _Requirements: 3.3, 4.5_

- [x] 8. Implement reminder notification system





  - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Create createHabit callable function


  - Implement callable Cloud Function for habit creation
  - Validate input parameters (habit name, frequency, duration, reminder time)
  - Create habit document in Firestore
  - Initialize analytics document
  - Schedule Cloud Task for reminder if reminderTime provided
  - Return habitId on success
  - _Requirements: 2.4, 5.5_

- [x] 8.2 Implement sendReminder scheduled function


  - Create Cloud Scheduler job to trigger function hourly
  - Query habits with reminder time matching current hour
  - Check if user has completed today's check-in
  - Send FCM notification if not completed
  - Include habit name and check-in prompt in notification
  - _Requirements: 5.2, 5.3_

- [x] 8.3 Add FCM token management


  - Store user FCM token in user document
  - Request notification permission on frontend
  - Display educational prompt for notification benefits
  - Update token when user grants permission
  - _Requirements: 5.4_

- [x] 8.4 Implement notification scheduling


  - Schedule Cloud Task when habit with reminder is created
  - Reschedule task when reminder time is updated
  - Cancel task when habit is deleted or reminder removed
  - _Requirements: 5.5_

- [x] 8.5 Write reminder system tests


  - Test createHabit function with various inputs
  - Test sendReminder function with mock FCM
  - Test notification scheduling logic
  - Test FCM token management
  - _Requirements: 5.2, 5.3, 5.5_

- [x] 9. Implement security rules and access control





  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Write Firestore security rules


  - Implement rules requiring authentication for all user data access
  - Restrict /users/{uid} documents to matching authenticated user
  - Restrict habits, checks, and analytics subcollections to owner
  - Prevent direct writes to analytics (Cloud Functions only)
  - _Requirements: 6.1, 6.2_



- [x] 9.2 Add rate limiting to Cloud Functions

  - Implement rate limiting middleware (100 requests/user/minute)
  - Track request counts per user
  - Return error when limit exceeded
  - _Requirements: 6.4_




- [x] 9.3 Implement input validation and sanitization





  - Validate all Cloud Function input parameters
  - Sanitize user-generated content (habit names)
  - Verify authentication tokens in Cloud Functions
  - _Requirements: 6.3, 6.5_


- [x] 9.4 Write security tests

  - Test Firestore rules with Firebase emulator
  - Test cross-user access is blocked
  - Test unauthenticated access is denied
  - Test rate limiting behavior
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 10. Add offline support and performance optimizations





  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 10.1 Configure offline persistence

  - Enable Firestore offline persistence in Firebase config
  - Configure cache size and persistence settings
  - Test offline check-in functionality
  - Implement sync status indicator
  - _Requirements: 7.4, 7.5_



- [x] 10.2 Optimize React Query caching

  - Configure cache time for habit and analytics queries (5 minutes)
  - Implement stale-while-revalidate strategy
  - Add prefetching for habit detail pages
  - _Requirements: 7.1_

- [x] 10.3 Implement code splitting and lazy loading


  - Lazy load route components with React.lazy()
  - Split vendor bundles for optimal caching
  - Optimize TailwindCSS bundle size (purge unused styles)
  - Tree-shake unused Firebase modules
  - _Requirements: 7.1_


- [x] 10.4 Add performance monitoring

  - Integrate Firebase Performance Monitoring
  - Track page load times and check-in latency
  - Monitor Cloud Function execution times
  - Set up alerts for performance degradation
  - _Requirements: 7.1, 7.2, 7.3_

- [-] 11. Build error handling and user feedback



  - _Requirements: 3.5, 7.2_

- [x] 11.1 Implement frontend error handling


  - Add error boundaries for React components
  - Handle Firestore errors (permission-denied, unavailable, not-found)
  - Display user-friendly error messages
  - Implement retry logic for network failures
  - _Requirements: 3.5_


- [x] 11.2 Add loading states and feedback

  - Implement loading spinners for async operations
  - Add skeleton screens for dashboard and habit detail
  - Show success messages for check-ins and habit creation
  - Display sync status for offline operations
  - _Requirements: 7.2_


- [x] 11.3 Write error handling tests

  - Test error boundary behavior
  - Test error message display
  - Test retry logic
  - Test offline error handling
  - _Requirements: 3.5_

- [x] 12. Deploy application to Firebase









  - _Requirements: 1.4, 7.1_

- [x] 12.1 Configure Firebase Hosting


  - Set up Firebase Hosting configuration
  - Configure build output directory
  - Set up redirects and rewrites for SPA routing
  - Configure caching headers
  - _Requirements: 1.4_

- [x] 12.2 Deploy frontend and backend


  - Build production React app
  - Deploy to Firebase Hosting
  - Deploy Cloud Functions
  - Deploy Firestore security rules
  - Set Cloud Function environment variables
  - _Requirements: 1.4, 7.1_

- [x] 12.3 Set up monitoring and alerts




  - Configure Cloud Function logging
  - Set up error rate alerts
  - Monitor Firestore quota usage
  - Track FCM notification delivery rates
  - _Requirements: 7.1_
