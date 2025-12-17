import React from 'react'
import { TimeDistribution } from '../types/analytics'
import { TimeOfDayHeatmap } from './TimeOfDayHeatmap'

interface TimeOfDayDistributionProps {
  distribution: TimeDistribution
  habitName: string
}

export const TimeOfDayDistribution: React.FC<TimeOfDayDistributionProps> = ({
  distribution,
  habitName
}) => {
  const { peakHours, optimalReminderTimes, hourlyDistribution } = distribution
  
  // Calculate total completions
  const totalCompletions = Object.values(hourlyDistribution).reduce((sum, count) => sum + count, 0)
  
  // Format hour for display (12-hour format)
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }
  
  // Check if we have enough data (at least 2 weeks worth)
  const hasEnoughData = totalCompletions >= 14
  
  if (totalCompletions === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Time of Day Analysis
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No completion data available yet. Complete "{habitName}" to see when you're most productive.
        </p>
      </div>
    )
  }
  
  if (!hasEnoughData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Time of Day Analysis
        </h3>
        <div className="mb-6">
          <TimeOfDayHeatmap distribution={distribution} />
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Need more data:</strong> Complete at least 2 weeks of data to see peak hours and get reminder recommendations.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Time of Day Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          When you typically complete "{habitName}"
        </p>
      </div>
      
      {/* Heatmap */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          24-Hour Activity Pattern
        </h4>
        <TimeOfDayHeatmap distribution={distribution} />
      </div>
      
      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            🌟 Peak Performance Hours
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200 mb-2">
            You're most likely to complete this habit at:
          </p>
          <div className="flex flex-wrap gap-2">
            {peakHours.map(hour => (
              <span
                key={hour}
                className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-sm font-medium"
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Optimal Reminder Times */}
      {optimalReminderTimes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ⏰ Recommended Reminder Times
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Based on your peak hours, consider setting reminders at:
          </p>
          <div className="flex flex-wrap gap-2">
            {optimalReminderTimes.map(hour => (
              <span
                key={hour}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            These times are 1 hour before your peak performance hours
          </p>
        </div>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Completions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCompletions}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Peak Hours</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{peakHours.length}</p>
        </div>
      </div>
    </div>
  )
}
