import { Timestamp } from 'firebase/firestore'

// Time period types
export type TimePeriod = '4W' | '3M' | '6M' | '1Y'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type TrendDirection = 'up' | 'down' | 'stable'
export type InsightType = 
  | 'day-of-week-pattern'
  | 'time-of-day-pattern'
  | 'weekend-behavior'
  | 'timing-impact'
  | 'streak-correlation'

// Data point for trend visualization
export interface DataPoint {
  date: string // YYYY-MM-DD
  value: number
}

// Trend data structure
export interface TrendData {
  period: TimePeriod
  completionRate: number
  averageProgress?: number // For count/time habits
  percentageChange: number
  direction: TrendDirection
  dataPoints: DataPoint[]
}

// Day of week statistics
export interface DayStats {
  completionRate: number
  totalCompletions: number
  totalScheduled: number
}

export interface DayOfWeekStats {
  monday: DayStats
  tuesday: DayStats
  wednesday: DayStats
  thursday: DayStats
  friday: DayStats
  saturday: DayStats
  sunday: DayStats
  bestDay: DayOfWeek
  worstDay: DayOfWeek
}

// Time of day distribution
export interface TimeDistribution {
  hourlyDistribution: Record<number, number> // hour (0-23) -> completion count
  peakHours: number[]
  optimalReminderTimes: number[]
}

// Month comparison
export interface MonthComparison {
  currentMonth: {
    completionRate: number
    totalCompletions: number
    totalScheduled: number
  }
  previousMonth: {
    completionRate: number
    totalCompletions: number
    totalScheduled: number
  }
  percentageChange: number
  isSignificant: boolean // true if change > 20%
}

// Insight structure
export interface Insight {
  id: string
  type: InsightType
  message: string
  confidence: ConfidenceLevel
  dataSupport: number // Number of data points supporting insight
  actionable: boolean
  recommendation?: string
}

// Main analytics data structure
export interface AnalyticsData {
  habitId: string
  userId: string
  calculatedAt: Timestamp
  
  // Trend data
  trends: {
    fourWeeks: TrendData
    threeMonths: TrendData
    sixMonths: TrendData
    oneYear: TrendData
  }
  
  // Day of week statistics
  dayOfWeekStats: DayOfWeekStats
  
  // Time of day distribution
  timeOfDayDistribution: TimeDistribution
  
  // Monthly comparison
  monthComparison: MonthComparison
  
  // Generated insights
  insights: Insight[]
  
  // Metadata
  dataPointCount: number
  oldestDataPoint: Timestamp
  newestDataPoint: Timestamp
}

// Export data structures
export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export interface ExportData {
  format: ExportFormat
  dateRange: DateRange
  habits: any[] // Will use Habit type from useHabits
  completions: any[] // Will use CheckIn type from useHabits
  analytics: AnalyticsData[]
  generatedAt: Timestamp
}

// Subscription and access control
export interface SubscriptionStatus {
  isPremium: boolean
  expiresAt?: Timestamp
  plan?: string
}

export type PremiumFeature = 
  | 'advanced-analytics'
  | 'data-export'
  | 'insights'
  | 'charts'
  | 'multi-device-sync'
