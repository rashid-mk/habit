import { lazy, Suspense, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { NotificationPrompt } from './components/NotificationPrompt'
import { SyncStatusIndicator } from './components/SyncStatusIndicator'
import { OfflineIndicator } from './components/OfflineIndicator'
import { MobileBottomNav } from './components/MobileBottomNav'
import { ReminderManager } from './components/ReminderManager'
import { CreateHabitFAB } from './components/CreateHabitFAB'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { ViewSettingsProvider } from './contexts/ViewSettingsContext'
import { CelebrationProvider, useCelebration } from './contexts/CelebrationContext'
import { DateRestrictionProvider } from './contexts/DateRestrictionContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { ConfettiCelebration } from './components/ConfettiCelebration'
import { initScrollOptimization } from './utils/scrollOptimization'

// Lazy load route components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const CreateHabitPage = lazy(() => import('./pages/CreateHabitPage').then(m => ({ default: m.CreateHabitPage })))
const EditHabitPage = lazy(() => import('./pages/EditHabitPage').then(m => ({ default: m.EditHabitPage })))
const HabitDetailPage = lazy(() => import('./pages/HabitDetailPage').then(m => ({ default: m.HabitDetailPage })))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        {/* App Logo/Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-ping opacity-20"></div>
          </div>
        </div>
        
        {/* Loading spinner */}
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mb-4"></div>
        
        {/* Loading text */}
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache persists for 10 minutes
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when connection is restored
      retry: 2, // Retry failed queries twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 2, // Retry failed mutations twice
      retryDelay: 1000, // Wait 1 second between retries
    },
  },
})

function GlobalCelebration() {
  const { showCelebration } = useCelebration()
  return <ConfettiCelebration isActive={showCelebration} onComplete={() => {}} />
}

function App() {
  // Initialize scroll optimization on app start
  useEffect(() => {
    const cleanup = initScrollOptimization()
    return cleanup
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ViewSettingsProvider>
            <CelebrationProvider>
              <DateRestrictionProvider>
                <DashboardProvider>
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/habits/create"
                  element={
                    <AuthGuard>
                      <CreateHabitPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/habits/:habitId/edit"
                  element={
                    <AuthGuard>
                      <EditHabitPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/habits/:habitId"
                  element={
                    <AuthGuard>
                      <HabitDetailPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/change-password"
                  element={
                    <AuthGuard>
                      <ChangePasswordPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <AuthGuard>
                      <AboutPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <AuthGuard>
                      <SettingsPage />
                    </AuthGuard>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            <NotificationPrompt />
            <SyncStatusIndicator />
            <OfflineIndicator />
            <ReminderManager />
            <CreateHabitFAB />
            <MobileBottomNav />
            <GlobalCelebration />
            </BrowserRouter>
                </DashboardProvider>
              </DateRestrictionProvider>
            </CelebrationProvider>
          </ViewSettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
