import { Navigation } from '../components/Navigation'
import { useTheme } from '../contexts/ThemeContext'
import { useViewSettings } from '../contexts/ViewSettingsContext'

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { viewType, setViewType } = useViewSettings()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation showBackButton backTo="/dashboard" title="Settings" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Customize your habit tracking experience</p>
        </div>

        {/* Appearance Section */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Appearance
          </h2>

          {/* Theme Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-4">
                {theme === 'light' ? (
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                    theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-white/20 dark:border-gray-700/20 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Display
          </h2>

          {/* View Type */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Habit Card View</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how you want to view your habits on the dashboard
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    viewType === 'grid'
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/25'
                      : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      viewType === 'grid'
                        ? 'bg-purple-500 dark:bg-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <svg className={`w-8 h-8 ${viewType === 'grid' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${viewType === 'grid' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Grid View
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Cards in a grid layout
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setViewType('list')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    viewType === 'list'
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/25'
                      : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      viewType === 'list'
                        ? 'bg-purple-500 dark:bg-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <svg className={`w-8 h-8 ${viewType === 'list' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${viewType === 'list' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        List View
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Full-width list layout
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
