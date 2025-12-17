import { CheckIn } from '../hooks/useHabits'
import { 
  Insight, 
  DayOfWeekStats, 
  TimeDistribution,
  ConfidenceLevel,
  DayOfWeek
} from '../types/analytics'
import dayjs from 'dayjs'

/**
 * Insight Generator
 * Detects patterns and generates actionable recommendations
 */
export class InsightGenerator {
  /**
   * Generate all insights for a habit based on completion data
   * Requires minimum 4 weeks of data to generate insights
   */
  generateInsights(
    completions: CheckIn[],
    dayOfWeekStats: DayOfWeekStats,
    timeDistribution: TimeDistribution
  ): Insight[] {
    const insights: Insight[] = []
    
    // Check if we have sufficient data (minimum 4 weeks = 28 days)
    if (completions.length < 28) {
      return insights
    }
    
    // Detect day-of-week patterns
    const dayPattern = this.detectDayOfWeekPattern(dayOfWeekStats, completions.length)
    if (dayPattern) {
      insights.push(dayPattern)
    }
    
    // Detect time-of-day patterns (requires at least 2 weeks)
    if (completions.length >= 14) {
      const timePattern = this.detectTimeOfDayPattern(timeDistribution, completions.length)
      if (timePattern) {
        insights.push(timePattern)
      }
    }
    
    // Detect weekend vs weekday behavior
    const weekendInsight = this.detectWeekendBehavior(dayOfWeekStats, completions.length)
    if (weekendInsight) {
      insights.push(weekendInsight)
    }
    
    // Detect early-day completion correlation
    const timingInsight = this.detectEarlyDayCorrelation(completions)
    if (timingInsight) {
      insights.push(timingInsight)
    }
    
    return insights
  }
  
  /**
   * Detect day-of-week patterns
   * Generates insights when completion rate variance > 15% between days
   */
  detectDayOfWeekPattern(
    stats: DayOfWeekStats,
    dataPoints: number
  ): Insight | null {
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    // Calculate variance in completion rates
    const rates = days
      .filter(day => stats[day].totalScheduled > 0)
      .map(day => stats[day].completionRate)
    
    if (rates.length < 2) {
      return null
    }
    
    const maxRate = Math.max(...rates)
    const minRate = Math.min(...rates)
    const variance = maxRate - minRate
    
    // Only generate insight if variance > 15%
    if (variance <= 15) {
      return null
    }
    
    const bestDay = stats.bestDay
    const worstDay = stats.worstDay
    const bestRate = stats[bestDay].completionRate
    const worstRate = stats[worstDay].completionRate
    
    const confidence = this.calculateConfidenceLevel(dataPoints, variance)
    
    return {
      id: `day-pattern-${Date.now()}`,
      type: 'day-of-week-pattern',
      message: `You're ${bestRate.toFixed(0)}% more likely to complete this habit on ${this.capitalizeDay(bestDay)}s compared to ${this.capitalizeDay(worstDay)}s (${worstRate.toFixed(0)}% completion rate).`,
      confidence,
      dataSupport: dataPoints,
      actionable: true,
      recommendation: `Consider scheduling important tasks on ${this.capitalizeDay(bestDay)}s when you're most consistent, and add extra reminders on ${this.capitalizeDay(worstDay)}s.`
    }
  }
  
  /**
   * Detect time-of-day patterns
   * Generates insights when clear peak hours are identified
   */
  detectTimeOfDayPattern(
    distribution: TimeDistribution,
    dataPoints: number
  ): Insight | null {
    const { peakHours, hourlyDistribution } = distribution
    
    // Need at least one peak hour with completions
    if (peakHours.length === 0) {
      return null
    }
    
    const totalCompletions = Object.values(hourlyDistribution).reduce((sum, count) => sum + count, 0)
    
    if (totalCompletions === 0) {
      return null
    }
    
    // Calculate what percentage of completions happen during peak hours
    const peakCompletions = peakHours.reduce((sum, hour) => sum + hourlyDistribution[hour], 0)
    const peakPercentage = (peakCompletions / totalCompletions) * 100
    
    // Only generate insight if peak hours represent significant portion (>30%)
    if (peakPercentage <= 30) {
      return null
    }
    
    const primaryPeakHour = peakHours[0]
    const peakTimeStr = this.formatHour(primaryPeakHour)
    
    const confidence = this.calculateConfidenceLevel(dataPoints, peakPercentage)
    
    return {
      id: `time-pattern-${Date.now()}`,
      type: 'time-of-day-pattern',
      message: `You complete this habit most often around ${peakTimeStr}, accounting for ${peakPercentage.toFixed(0)}% of your completions.`,
      confidence,
      dataSupport: dataPoints,
      actionable: true,
      recommendation: `Set your reminders for ${this.formatHour((primaryPeakHour - 1 + 24) % 24)} to align with your natural rhythm.`
    }
  }
  
  /**
   * Detect weekend vs weekday behavior
   * Generates insights when weekend differs from weekday by >15%
   */
  detectWeekendBehavior(
    stats: DayOfWeekStats,
    dataPoints: number
  ): Insight | null {
    const weekdayDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const weekendDays: DayOfWeek[] = ['saturday', 'sunday']
    
    // Calculate weekday average
    const weekdayStats = weekdayDays
      .filter(day => stats[day].totalScheduled > 0)
      .map(day => stats[day])
    
    if (weekdayStats.length === 0) {
      return null
    }
    
    const weekdayAvg = weekdayStats.reduce((sum, s) => sum + s.completionRate, 0) / weekdayStats.length
    
    // Calculate weekend average
    const weekendStats = weekendDays
      .filter(day => stats[day].totalScheduled > 0)
      .map(day => stats[day])
    
    if (weekendStats.length === 0) {
      return null
    }
    
    const weekendAvg = weekendStats.reduce((sum, s) => sum + s.completionRate, 0) / weekendStats.length
    
    // Calculate difference
    const difference = Math.abs(weekendAvg - weekdayAvg)
    
    // Only generate insight if difference > 15%
    if (difference <= 15) {
      return null
    }
    
    const confidence = this.calculateConfidenceLevel(dataPoints, difference)
    
    const isWeekendBetter = weekendAvg > weekdayAvg
    const betterPeriod = isWeekendBetter ? 'weekends' : 'weekdays'
    const worsePeriod = isWeekendBetter ? 'weekdays' : 'weekends'
    const betterRate = isWeekendBetter ? weekendAvg : weekdayAvg
    const worseRate = isWeekendBetter ? weekdayAvg : weekendAvg
    
    return {
      id: `weekend-pattern-${Date.now()}`,
      type: 'weekend-behavior',
      message: `Your completion rate is ${difference.toFixed(0)}% higher on ${betterPeriod} (${betterRate.toFixed(0)}%) compared to ${worsePeriod} (${worseRate.toFixed(0)}%).`,
      confidence,
      dataSupport: dataPoints,
      actionable: true,
      recommendation: `Focus extra attention on ${worsePeriod} by setting additional reminders or adjusting your routine.`
    }
  }
  
  /**
   * Detect early-day completion correlation
   * Generates insights when early completions correlate with higher success
   */
  detectEarlyDayCorrelation(
    completions: CheckIn[]
  ): Insight | null {
    // Filter to only completed check-ins with timestamps
    const completedWithTime = completions.filter(c => {
      const isCompleted = c.isCompleted !== undefined 
        ? c.isCompleted 
        : (!c.status || c.status === 'done')
      return isCompleted && c.completedAt
    })
    
    if (completedWithTime.length < 14) {
      return null
    }
    
    // Count early completions (before noon)
    const earlyCompletions = completedWithTime.filter(c => {
      const timestamp = c.completedAt instanceof Date 
        ? c.completedAt 
        : (c.completedAt as any).toDate?.() || new Date(c.completedAt as any)
      const hour = dayjs(timestamp).hour()
      return hour < 12
    })
    
    const earlyPercentage = (earlyCompletions.length / completedWithTime.length) * 100
    
    // Only generate insight if >60% of completions are early
    if (earlyPercentage <= 60) {
      return null
    }
    
    const confidence = this.calculateConfidenceLevel(completedWithTime.length, earlyPercentage)
    
    return {
      id: `timing-impact-${Date.now()}`,
      type: 'timing-impact',
      message: `You complete this habit ${earlyPercentage.toFixed(0)}% of the time before noon, suggesting morning completion works best for you.`,
      confidence,
      dataSupport: completedWithTime.length,
      actionable: true,
      recommendation: `Try to complete this habit in the morning when you're most likely to succeed.`
    }
  }
  
  /**
   * Calculate confidence level based on data points and pattern strength
   */
  calculateConfidenceLevel(
    dataPoints: number,
    patternStrength: number
  ): ConfidenceLevel {
    // High confidence: lots of data + strong pattern
    if (dataPoints >= 56 && patternStrength >= 30) {
      return 'high'
    }
    
    // Medium confidence: moderate data or moderate pattern
    if (dataPoints >= 28 && patternStrength >= 20) {
      return 'medium'
    }
    
    // Low confidence: limited data or weak pattern
    return 'low'
  }
  
  /**
   * Helper: Capitalize day name
   */
  private capitalizeDay(day: DayOfWeek): string {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }
  
  /**
   * Helper: Format hour as readable time
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM'
    if (hour === 12) return '12:00 PM'
    if (hour < 12) return `${hour}:00 AM`
    return `${hour - 12}:00 PM`
  }
}

// Export singleton instance
export const insightGenerator = new InsightGenerator()
