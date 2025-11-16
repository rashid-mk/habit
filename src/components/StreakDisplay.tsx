interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Streaks</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{currentStreak}</div>
          <div className="text-sm text-gray-600 mt-1">Current Streak</div>
          <div className="text-xs text-gray-500">days</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{longestStreak}</div>
          <div className="text-sm text-gray-600 mt-1">Longest Streak</div>
          <div className="text-xs text-gray-500">days</div>
        </div>
      </div>
    </div>
  )
}
