import { Navigation } from '../components/Navigation'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation showBackButton backTo="/dashboard" title="About" />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-3xl border border-white/20 dark:border-gray-700/20 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">About Habit Tracker</h2>
            <p className="text-gray-600 dark:text-gray-300">Build better habits, one day at a time</p>
          </div>

          {/* Description */}
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What is Habit Tracker?</h3>
              <p className="leading-relaxed">
                Habit Tracker is a simple yet powerful tool designed to help you build and maintain positive habits. 
                Whether you want to exercise more, read daily, or develop any other habit, our app makes it easy to 
                track your progress and stay motivated.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Track unlimited habits with customizable frequencies</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Visual analytics including streaks and completion rates</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Timeline view to see your progress over time</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Offline support with automatic sync</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Beautiful, modern interface with dark mode support</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Why Build Habits?</h3>
              <p className="leading-relaxed">
                Research shows that it takes an average of 66 days to form a new habit. By tracking your habits 
                consistently, you're more likely to stick with them and make lasting positive changes in your life. 
                Our app helps you stay accountable and motivated throughout your journey.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy & Security</h3>
              <p className="leading-relaxed">
                Your data is stored securely using Firebase's industry-standard security practices. We never share 
                your personal information with third parties. Your habits and progress are private and belong to you.
              </p>
            </section>

            <section className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Version 1.0.0 • Built with ❤️ using React, Firebase, and Tailwind CSS
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
