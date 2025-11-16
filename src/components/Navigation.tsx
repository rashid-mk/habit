import { useNavigate } from 'react-router-dom'
import { ProfileDropdown } from './ProfileDropdown'

interface NavigationProps {
  showBackButton?: boolean
  backTo?: string
  title?: string
}

export function Navigation({ showBackButton = false, backTo = '/dashboard', title }: NavigationProps) {
  const navigate = useNavigate()

  return (
    <nav className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={() => navigate(backTo)}
                className="mr-2 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {title || 'Habit Tracker'}
            </h1>
          </div>
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  )
}
