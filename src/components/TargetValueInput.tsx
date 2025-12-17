interface TargetValueInputProps {
  trackingType: 'count' | 'time'
  value: number
  unit: 'times' | 'minutes' | 'hours'
  onValueChange: (value: number) => void
  onUnitChange: (unit: 'times' | 'minutes' | 'hours') => void
  disabled?: boolean
  error?: string
}

export function TargetValueInput({
  trackingType,
  value,
  unit,
  onValueChange,
  onUnitChange,
  disabled = false,
  error,
}: TargetValueInputProps) {
  const handleIncrement = () => {
    if (value < 999) {
      onValueChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > 1) {
      onValueChange(value - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0
    if (newValue >= 1 && newValue <= 999) {
      onValueChange(newValue)
    }
  }

  const label = trackingType === 'count' ? 'How many times?' : 'How long?'
  const unitOptions = trackingType === 'count' ? ['times'] : ['minutes', 'hours']

  return (
    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-blue-200/50 dark:ring-blue-800/50">
      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= 1}
          className="w-12 h-12 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md"
          aria-label="Decrease value"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </button>

        {/* Value Input */}
        <div className="flex-1 relative">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min="1"
            max="999"
            disabled={disabled}
            className="block w-full rounded-xl border-0 bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-center text-lg font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm"
            aria-label="Target value"
          />
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= 999}
          className="w-12 h-12 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md"
          aria-label="Increase value"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Unit Selector (only for time tracking) */}
        {trackingType === 'time' && (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as 'minutes' | 'hours')}
            disabled={disabled}
            className="rounded-xl border-0 bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm"
            aria-label="Time unit"
          >
            {unitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {/* Display unit for count tracking */}
        {trackingType === 'count' && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
            times
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        {trackingType === 'count'
          ? 'Set how many times you want to complete this habit'
          : 'Set how long you want to spend on this habit'}
      </p>
    </div>
  )
}
