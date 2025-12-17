interface TrackingTypeSelectorProps {
  selectedType: 'simple' | 'count' | 'time'
  onTypeChange: (type: 'simple' | 'count' | 'time') => void
  disabled?: boolean
}

export function TrackingTypeSelector({ selectedType, onTypeChange, disabled = false }: TrackingTypeSelectorProps) {
  const trackingTypes = [
    {
      value: 'simple' as const,
      label: 'Task',
      description: 'Simple completion',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      value: 'count' as const,
      label: 'Amount',
      description: 'Track count',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
    },
    {
      value: 'time' as const,
      label: 'Time',
      description: 'Track duration',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
        How do you want to track this? *
      </label>
      <div className="grid grid-cols-3 gap-3">
        {trackingTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg ${
              selectedType === type.value
                ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30 ring-2 ring-blue-500 dark:ring-blue-400 shadow-blue-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:ring-blue-300 dark:hover:ring-blue-600 shadow-gray-200/50 dark:shadow-gray-900/50'
            }`}
            aria-label={`Select ${type.label} tracking type`}
            aria-pressed={selectedType === type.value}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                selectedType === type.value
                  ? 'bg-blue-500 dark:bg-blue-400 shadow-lg shadow-blue-500/50'
                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
              }`}
            >
              <div
                className={`${
                  selectedType === type.value
                    ? 'text-white'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`}
              >
                {type.icon}
              </div>
            </div>
            <span
              className={`text-sm font-semibold mb-0.5 ${
                selectedType === type.value
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {type.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {type.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
