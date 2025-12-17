import dayjs from 'dayjs'
import { CheckIn } from '../hooks/useHabits'
import { 
  TrendData, 
  DayOfWeekStats, 
  TimeDistribution, 
  MonthComparison,
  TimePeriod,
  DayStats,
  TrendDirection,
  DataPoint,
  DayOfWeek
} from '../types/analytics'
import { createAnalyticsError } from '../utils/errorHandling'

/**
 * Premium Analytics Calculator
 * Core calculation engine for all premium analytics metrics
 */
export class PremiumAnalyticsCalculator {
  /**
   * Calculate completion rate for a given time period
   * Returns percentage of completed vs scheduled occurrences
   * 
   * @param completions - Array of check-in records
   * @param startDate - Start of the period
   * @param endDate - End of the period
   * @returns Completion rate as a percentage (0-100)
   */
  calculateCompletionRate(
    completions: CheckIn[],
    startDate: Date,
    endDate: Date
  ): number {
    try {
      // Validate inputs
      if (!completions) {
        throw createAnalyticsError('No completion data provided', 'calculation-error')
      }

      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw createAnalyticsError('Invalid date range provided', 'calculation-error')
      }
      
      // Calculate total days in the period
      const start = dayjs(startDate).startOf('day')
      const end = dayjs(endDate).startOf('day')
      const totalDays = end.diff(start, 'day') + 1
      
      if (totalDays <= 0) {
        throw createAnalyticsError('Invalid date range: end date must be after start date', 'calculation-error')
      }
      
      // Count completed days
      // For count/time habits, use isCompleted field
      // For simple habits, use status field (done or no status means completed)
      const completedDays = completions.filter(c => {
        try {
          const checkDate = dayjs(c.dateKey)
          if (!checkDate.isValid()) {
            console.warn('Invalid date in completion record:', c.dateKey)
            return false
          }

          const isInRange = (checkDate.isSame(start, 'day') || checkDate.isAfter(start, 'day')) &&
                            (checkDate.isSame(end, 'day') || checkDate.isBefore(end, 'day'))
          
          if (!isInRange) return false
          
          // Check if completed
          if (c.isCompleted !== undefined) {
            return c.isCompleted
          } else {
            return !c.status || c.status === 'done'
          }
        } catch (error) {
          console.warn('Error processing completion record:', c, error)
          return false
        }
      }).length
      
      // Calculate percentage
      const rate = (completedDays / totalDays) * 100
      
      // Ensure result is between 0 and 100
      const finalRate = Math.max(0, Math.min(100, rate))
      
      // Validate result
      if (isNaN(finalRate)) {
        throw createAnalyticsError('Calculation resulted in invalid number', 'calculation-error')
      }
      
      return finalRate
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error // Re-throw analytics errors
      }
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw createAnalyticsError(
        `Failed to calculate completion rate: ${errorMessage}`,
        'calculation-error'
      )
    }
  }
  
  /**
   * Calculate trend data for a specific time period
   * Analyzes completion patterns over 4W, 3M, 6M, or 1Y periods
   */
  calculateTrend(
    completions: CheckIn[],
    period: TimePeriod
  ): TrendData {
    try {
      // Validate inputs
      if (!completions) {
        throw createAnalyticsError('No completion data provided', 'calculation-error')
      }

      if (!period || !['4W', '3M', '6M', '1Y'].includes(period)) {
        throw createAnalyticsError('Invalid time period specified', 'calculation-error')
      }

      const now = dayjs()
      let startDate: dayjs.Dayjs
      let previousStartDate: dayjs.Dayjs
      let minimumDataPoints: number
      
      // Determine date ranges and minimum data requirements based on period
      switch (period) {
        case '4W':
          startDate = now.subtract(4, 'week')
          previousStartDate = now.subtract(8, 'week')
          minimumDataPoints = 7 // At least 1 week of data
          break
        case '3M':
          startDate = now.subtract(3, 'month')
          previousStartDate = now.subtract(6, 'month')
          minimumDataPoints = 14 // At least 2 weeks of data
          break
        case '6M':
          startDate = now.subtract(6, 'month')
          previousStartDate = now.subtract(12, 'month')
          minimumDataPoints = 30 // At least 1 month of data
          break
        case '1Y':
          startDate = now.subtract(1, 'year')
          previousStartDate = now.subtract(2, 'year')
          minimumDataPoints = 60 // At least 2 months of data
          break
      }
      
      // Check if we have enough data for meaningful analysis
      const currentCompletions = completions.filter(c => {
        try {
          const checkDate = dayjs(c.dateKey)
          if (!checkDate.isValid()) {
            console.warn('Invalid date in completion record:', c.dateKey)
            return false
          }
          return checkDate.isAfter(startDate) || checkDate.isSame(startDate, 'day')
        } catch (error) {
          console.warn('Error filtering completion:', c, error)
          return false
        }
      })

      if (currentCompletions.length < minimumDataPoints) {
        throw createAnalyticsError(
          `Need at least ${minimumDataPoints} data points for ${period} trend analysis`,
          'insufficient-data',
          false,
          minimumDataPoints
        )
      }
      
      // Calculate current period completion rate
      const completionRate = this.calculateCompletionRate(
        currentCompletions,
        startDate.toDate(),
        now.toDate()
      )
      
      // Calculate previous period completion rate for comparison
      const previousCompletions = completions.filter(c => {
        try {
          const checkDate = dayjs(c.dateKey)
          if (!checkDate.isValid()) return false
          return (checkDate.isAfter(previousStartDate) || checkDate.isSame(previousStartDate, 'day')) &&
                 checkDate.isBefore(startDate)
        } catch (error) {
          console.warn('Error filtering previous completion:', c, error)
          return false
        }
      })
      
      const previousRate = previousCompletions.length > 0 
        ? this.calculateCompletionRate(
            previousCompletions,
            previousStartDate.toDate(),
            startDate.subtract(1, 'day').toDate()
          )
        : 0
      
      // Calculate percentage change
      const percentageChange = previousRate === 0 
        ? (completionRate > 0 ? 100 : 0)
        : ((completionRate - previousRate) / previousRate) * 100
      
      // Validate percentage change
      if (isNaN(percentageChange)) {
        throw createAnalyticsError('Failed to calculate percentage change', 'calculation-error')
      }
      
      // Determine trend direction
      let direction: TrendDirection = 'stable'
      if (Math.abs(percentageChange) > 5) {
        direction = percentageChange > 0 ? 'up' : 'down'
      }
      
      // Calculate average progress for count/time habits
      let averageProgress: number | undefined
      const completionsWithProgress = currentCompletions.filter(c => 
        c.progressValue !== undefined && !isNaN(c.progressValue)
      )
      
      if (completionsWithProgress.length > 0) {
        try {
          const totalProgress = completionsWithProgress.reduce((sum, c) => sum + (c.progressValue || 0), 0)
          const days = now.diff(startDate, 'day') + 1
          averageProgress = totalProgress / days
          
          if (isNaN(averageProgress)) {
            console.warn('Invalid average progress calculation')
            averageProgress = undefined
          }
        } catch (error) {
          console.warn('Error calculating average progress:', error)
          averageProgress = undefined
        }
      }
      
      // Generate data points for visualization
      const dataPoints: DataPoint[] = []
      let currentDate = startDate
      
      while (currentDate.isBefore(now) || currentDate.isSame(now, 'day')) {
        try {
          const dayCompletions = completions.filter(c => {
            try {
              return dayjs(c.dateKey).isSame(currentDate, 'day')
            } catch (error) {
              return false
            }
          })
          
          const isCompleted = dayCompletions.some(c => 
            c.isCompleted !== undefined ? c.isCompleted : (!c.status || c.status === 'done')
          )
          
          dataPoints.push({
            date: currentDate.format('YYYY-MM-DD'),
            value: isCompleted ? 1 : 0
          })
        } catch (error) {
          console.warn('Error generating data point for date:', currentDate.format('YYYY-MM-DD'), error)
        }
        
        currentDate = currentDate.add(1, 'day')
      }
      
      return {
        period,
        completionRate,
        averageProgress,
        percentageChange,
        direction,
        dataPoints
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error // Re-throw analytics errors
      }
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw createAnalyticsError(
        `Failed to calculate trend for ${period}: ${errorMessage}`,
        'calculation-error'
      )
    }
  }
  
  /**
   * Calculate day-of-week statistics
   * Groups completions by day and calculates rates for each day
   */
  calculateDayOfWeekStats(
    completions: CheckIn[]
  ): DayOfWeekStats {
    try {
      // Validate inputs
      if (!completions) {
        throw createAnalyticsError('No completion data provided', 'calculation-error')
      }

      // Check minimum data requirement (at least 4 weeks as per requirements)
      const minimumDataPoints = 28 // 4 weeks
      if (completions.length < minimumDataPoints) {
        throw createAnalyticsError(
          'Need at least 4 weeks of data for day-of-week analysis',
          'insufficient-data',
          false,
          minimumDataPoints
        )
      }

      // Initialize counters for each day
      const dayData: Record<DayOfWeek, { completed: number; scheduled: number }> = {
        monday: { completed: 0, scheduled: 0 },
        tuesday: { completed: 0, scheduled: 0 },
        wednesday: { completed: 0, scheduled: 0 },
        thursday: { completed: 0, scheduled: 0 },
        friday: { completed: 0, scheduled: 0 },
        saturday: { completed: 0, scheduled: 0 },
        sunday: { completed: 0, scheduled: 0 }
      }
      
      // Group completions by day of week
      completions.forEach(c => {
        try {
          const checkDate = dayjs(c.dateKey)
          if (!checkDate.isValid()) {
            console.warn('Invalid date in completion record:', c.dateKey)
            return
          }

          const dayIndex = checkDate.day() // 0 = Sunday, 1 = Monday, etc.
          
          // Map day index to day name
          const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const dayName = dayNames[dayIndex]
          
          if (!dayName) {
            console.warn('Invalid day index:', dayIndex)
            return
          }
          
          dayData[dayName].scheduled++
          
          // Check if completed
          const isCompleted = c.isCompleted !== undefined 
            ? c.isCompleted 
            : (!c.status || c.status === 'done')
          
          if (isCompleted) {
            dayData[dayName].completed++
          }
        } catch (error) {
          console.warn('Error processing completion for day-of-week stats:', c, error)
        }
      })
      
      // Calculate stats for each day
      const calculateDayStats = (day: DayOfWeek): DayStats => {
        try {
          const { completed, scheduled } = dayData[day]
          const completionRate = scheduled > 0 ? (completed / scheduled) * 100 : 0
          
          if (isNaN(completionRate)) {
            console.warn(`Invalid completion rate for ${day}:`, { completed, scheduled })
            return {
              completionRate: 0,
              totalCompletions: completed,
              totalScheduled: scheduled
            }
          }
          
          return {
            completionRate,
            totalCompletions: completed,
            totalScheduled: scheduled
          }
        } catch (error) {
          console.warn(`Error calculating stats for ${day}:`, error)
          return {
            completionRate: 0,
            totalCompletions: 0,
            totalScheduled: 0
          }
        }
      }
      
      const stats: Record<DayOfWeek, DayStats> = {
        monday: calculateDayStats('monday'),
        tuesday: calculateDayStats('tuesday'),
        wednesday: calculateDayStats('wednesday'),
        thursday: calculateDayStats('thursday'),
        friday: calculateDayStats('friday'),
        saturday: calculateDayStats('saturday'),
        sunday: calculateDayStats('sunday')
      }
      
      // Find best and worst days
      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      let bestDay: DayOfWeek = 'monday'
      let worstDay: DayOfWeek = 'monday'
      let highestRate = -1
      let lowestRate = 101
      
      days.forEach(day => {
        try {
          const rate = stats[day].completionRate
          if (stats[day].totalScheduled > 0 && !isNaN(rate)) {
            if (rate > highestRate) {
              highestRate = rate
              bestDay = day
            }
            if (rate < lowestRate) {
              lowestRate = rate
              worstDay = day
            }
          }
        } catch (error) {
          console.warn(`Error comparing day ${day}:`, error)
        }
      })
      
      return {
        ...stats,
        bestDay,
        worstDay
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error // Re-throw analytics errors
      }
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw createAnalyticsError(
        `Failed to calculate day-of-week statistics: ${errorMessage}`,
        'calculation-error'
      )
    }
  }
  
  /**
   * Calculate time-of-day distribution
   * Analyzes completion times by hour of day
   */
  calculateTimeOfDayDistribution(
    completions: CheckIn[]
  ): TimeDistribution {
    const hourlyDistribution: Record<number, number> = {}
    
    // Initialize all hours to 0
    for (let hour = 0; hour < 24; hour++) {
      hourlyDistribution[hour] = 0
    }
    
    // Count completions by hour
    completions.forEach(c => {
      // Only count completed check-ins with timestamps
      const isCompleted = c.isCompleted !== undefined 
        ? c.isCompleted 
        : (!c.status || c.status === 'done')
      
      if (isCompleted && c.completedAt) {
        // Use completedAt timestamp
        const timestamp = c.completedAt instanceof Date 
          ? c.completedAt 
          : (c.completedAt as any).toDate?.() || new Date(c.completedAt as any)
        
        const hour = dayjs(timestamp).hour()
        hourlyDistribution[hour]++
      }
    })
    
    // Find peak hours (hours with highest completion counts)
    const sortedHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([hour]) => parseInt(hour))
    
    // Get top 3 peak hours with at least 1 completion
    const peakHours = sortedHours
      .filter(hour => hourlyDistribution[hour] > 0)
      .slice(0, 3)
    
    // Generate optimal reminder times (1 hour before peak hours)
    const optimalReminderTimes = peakHours
      .map(hour => (hour - 1 + 24) % 24)
      .filter((hour, index, self) => self.indexOf(hour) === index) // Remove duplicates
    
    return {
      hourlyDistribution,
      peakHours,
      optimalReminderTimes
    }
  }
  
  /**
   * Calculate month-over-month comparison
   * Compares current month with previous month
   */
  calculateMonthComparison(
    currentMonth: CheckIn[],
    previousMonth: CheckIn[]
  ): MonthComparison {
    // Calculate current month stats
    const currentCompleted = currentMonth.filter(c => 
      c.isCompleted !== undefined ? c.isCompleted : (!c.status || c.status === 'done')
    ).length
    const currentScheduled = currentMonth.length
    const currentRate = currentScheduled > 0 ? (currentCompleted / currentScheduled) * 100 : 0
    
    // Calculate previous month stats
    const previousCompleted = previousMonth.filter(c => 
      c.isCompleted !== undefined ? c.isCompleted : (!c.status || c.status === 'done')
    ).length
    const previousScheduled = previousMonth.length
    const previousRate = previousScheduled > 0 ? (previousCompleted / previousScheduled) * 100 : 0
    
    // Calculate percentage change
    const percentageChange = previousRate === 0
      ? (currentRate > 0 ? 100 : 0)
      : ((currentRate - previousRate) / previousRate) * 100
    
    // Determine if change is significant (>20%)
    const isSignificant = Math.abs(percentageChange) > 20
    
    return {
      currentMonth: {
        completionRate: currentRate,
        totalCompletions: currentCompleted,
        totalScheduled: currentScheduled
      },
      previousMonth: {
        completionRate: previousRate,
        totalCompletions: previousCompleted,
        totalScheduled: previousScheduled
      },
      percentageChange,
      isSignificant
    }
  }
}

// Export singleton instance
export const premiumAnalyticsCalculator = new PremiumAnalyticsCalculator()
