/**
 * Web Worker for heavy analytics calculations
 * Offloads computation from main thread for better performance
 */

// Import dayjs for date calculations (using CDN in worker)
importScripts('https://unpkg.com/dayjs@1.11.10/dayjs.min.js')

self.onmessage = function(e) {
  const { type, data, id } = e.data

  try {
    let result
    
    switch (type) {
      case 'CALCULATE_COMPLETION_RATE':
        result = calculateCompletionRate(data.completions, data.startDate, data.endDate)
        break
      
      case 'CALCULATE_DAY_OF_WEEK_STATS':
        result = calculateDayOfWeekStats(data.completions)
        break
      
      case 'CALCULATE_TIME_DISTRIBUTION':
        result = calculateTimeOfDayDistribution(data.completions)
        break
      
      case 'CALCULATE_TREND':
        result = calculateTrend(data.completions, data.period)
        break
      
      default:
        throw new Error(`Unknown calculation type: ${type}`)
    }

    // Send result back to main thread
    self.postMessage({
      id,
      type: 'SUCCESS',
      result
    })
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      type: 'ERROR',
      error: error.message
    })
  }
}

function calculateCompletionRate(completions, startDate, endDate) {
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  const totalDays = end.diff(start, 'day') + 1
  
  if (totalDays <= 0) return 0
  
  const completedDays = completions.filter(c => {
    const checkDate = dayjs(c.dateKey)
    const isInRange = (checkDate.isSame(start, 'day') || checkDate.isAfter(start, 'day')) &&
                      (checkDate.isSame(end, 'day') || checkDate.isBefore(end, 'day'))
    
    if (!isInRange) return false
    
    if (c.isCompleted !== undefined) {
      return c.isCompleted
    } else {
      return !c.status || c.status === 'done'
    }
  }).length
  
  const rate = (completedDays / totalDays) * 100
  return Math.max(0, Math.min(100, rate))
}

function calculateDayOfWeekStats(completions) {
  const dayStats = {
    sunday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    monday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    tuesday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    wednesday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    thursday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    friday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 },
    saturday: { completionRate: 0, totalCompletions: 0, totalScheduled: 0 }
  }
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Group completions by day of week
  completions.forEach(completion => {
    const date = dayjs(completion.dateKey)
    const dayIndex = date.day()
    const dayName = dayNames[dayIndex]
    
    dayStats[dayName].totalScheduled++
    
    const isCompleted = completion.isCompleted !== undefined 
      ? completion.isCompleted 
      : (!completion.status || completion.status === 'done')
    
    if (isCompleted) {
      dayStats[dayName].totalCompletions++
    }
  })
  
  // Calculate completion rates
  dayNames.forEach(day => {
    const stats = dayStats[day]
    stats.completionRate = stats.totalScheduled > 0 
      ? (stats.totalCompletions / stats.totalScheduled) * 100 
      : 0
  })
  
  // Find best and worst days
  let bestDay = 'monday'
  let worstDay = 'monday'
  let bestRate = -1
  let worstRate = 101
  
  dayNames.forEach(day => {
    const rate = dayStats[day].completionRate
    if (rate > bestRate) {
      bestRate = rate
      bestDay = day
    }
    if (rate < worstRate) {
      worstRate = rate
      bestDay = day
    }
  })
  
  return {
    ...dayStats,
    bestDay,
    worstDay
  }
}

function calculateTimeOfDayDistribution(completions) {
  const hourlyDistribution = {}
  
  // Initialize all hours to 0
  for (let hour = 0; hour < 24; hour++) {
    hourlyDistribution[hour] = 0
  }
  
  // Count completions by hour
  completions.forEach(completion => {
    if (completion.timestamp || completion.completedAt) {
      const timestamp = completion.timestamp || completion.completedAt.toDate()
      const hour = dayjs(timestamp).hour()
      
      const isCompleted = completion.isCompleted !== undefined 
        ? completion.isCompleted 
        : (!completion.status || completion.status === 'done')
      
      if (isCompleted) {
        hourlyDistribution[hour]++
      }
    }
  })
  
  // Find peak hours (top 3)
  const hourCounts = Object.entries(hourlyDistribution)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
  
  const peakHours = hourCounts
    .filter(h => h.count > 0)
    .slice(0, 3)
    .map(h => h.hour)
  
  // Generate optimal reminder times (1 hour before peak hours)
  const optimalReminderTimes = peakHours.map(hour => (hour - 1 + 24) % 24)
  
  return {
    hourlyDistribution,
    peakHours,
    optimalReminderTimes
  }
}

function calculateTrend(completions, period) {
  const now = dayjs()
  let startDate, previousStartDate
  
  switch (period) {
    case '4W':
      startDate = now.subtract(4, 'week')
      previousStartDate = now.subtract(8, 'week')
      break
    case '3M':
      startDate = now.subtract(3, 'month')
      previousStartDate = now.subtract(6, 'month')
      break
    case '6M':
      startDate = now.subtract(6, 'month')
      previousStartDate = now.subtract(12, 'month')
      break
    case '1Y':
      startDate = now.subtract(1, 'year')
      previousStartDate = now.subtract(2, 'year')
      break
    default:
      throw new Error(`Invalid period: ${period}`)
  }
  
  const previousEndDate = startDate.subtract(1, 'day')
  
  // Calculate current period rate
  const currentCompletions = completions.filter(c => {
    const date = dayjs(c.dateKey)
    return date.isAfter(startDate) || date.isSame(startDate, 'day')
  })
  
  const currentRate = calculateCompletionRate(currentCompletions, startDate.toDate(), now.toDate())
  
  // Calculate previous period rate
  const previousCompletions = completions.filter(c => {
    const date = dayjs(c.dateKey)
    return (date.isAfter(previousStartDate) || date.isSame(previousStartDate, 'day')) &&
           (date.isBefore(previousEndDate) || date.isSame(previousEndDate, 'day'))
  })
  
  const previousRate = calculateCompletionRate(previousCompletions, previousStartDate.toDate(), previousEndDate.toDate())
  
  // Calculate percentage change
  let percentageChange = 0
  if (previousRate === 0) {
    percentageChange = currentRate > 0 ? 100 : 0
  } else {
    percentageChange = ((currentRate - previousRate) / previousRate) * 100
  }
  
  // Determine direction
  let direction = 'stable'
  if (percentageChange > 5) {
    direction = 'up'
  } else if (percentageChange < -5) {
    direction = 'down'
  }
  
  return {
    completionRate: currentRate,
    percentageChange,
    direction,
    dataPoints: currentCompletions.map(c => ({
      date: c.dateKey,
      value: c.progressValue || (c.isCompleted ? 1 : 0)
    }))
  }
}