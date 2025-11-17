import { useNavigate, useLocation } from 'react-router-dom'

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/dashboard')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Create Habit - Prominent Center Button */}
        <button
          onClick={() => navigate('/habits/create')}
          className="flex flex-col items-center justify-center flex-1 h-full relative"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 -mt-8 mb-1 ring-4 ring-white dark:ring-gray-800 hover:scale-110 active:scale-95 transition-transform">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Create</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/profile')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  )
}
