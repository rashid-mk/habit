import { Timestamp } from 'firebase/firestore'
import { Habit, CheckIn } from '../hooks/useHabits'
import { DateRange, ExportFormat, AnalyticsData, Insight } from '../types/analytics'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Export Service
 * Handles data export functionality in multiple formats (CSV, JSON, PDF)
 */
export class ExportService {
  /**
   * Export habit data to CSV format
   * @param habits - Array of habits to export
   * @param completions - Array of check-ins/completions
   * @param dateRange - Optional date range filter
   * @returns CSV file as Blob
   */
  async exportToCSV(
    habits: Habit[],
    completions: CheckIn[],
    dateRange?: DateRange
  ): Promise<Blob> {
    // Filter completions by date range if provided
    const filteredCompletions = dateRange
      ? this.filterCompletionsByDateRange(completions, dateRange)
      : completions

    // Create CSV header
    const headers = ['date', 'habit_name', 'completion_status', 'progress_value', 'streak_count']
    const csvRows: string[] = [headers.join(',')]

    // Create a map of habitId to habit for quick lookup
    const habitMap = new Map(habits.map(h => [h.id, h]))

    // Sort completions by date
    const sortedCompletions = [...filteredCompletions].sort((a, b) => 
      a.dateKey.localeCompare(b.dateKey)
    )

    // Calculate streaks for each habit
    const streakMap = this.calculateStreaksForExport(sortedCompletions, habits)

    // Generate CSV rows
    for (const completion of sortedCompletions) {
      const habit = habitMap.get(completion.habitId)
      if (!habit) continue

      const date = completion.dateKey
      const habitName = this.escapeCsvValue(habit.habitName)
      const completionStatus = completion.status === 'done' ? 'completed' : 
                              completion.status === 'not_done' ? 'not_completed' : 
                              'skipped'
      const progressValue = completion.progressValue?.toString() || ''
      const streakCount = streakMap.get(`${completion.habitId}-${date}`)?.toString() || '0'

      csvRows.push([date, habitName, completionStatus, progressValue, streakCount].join(','))
    }

    // Convert to Blob
    const csvContent = csvRows.join('\n')
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  /**
   * Export habit data to JSON format
   * @param habits - Array of habits to export
   * @param completions - Array of check-ins/completions
   * @param dateRange - Optional date range filter
   * @returns JSON file as Blob
   */
  async exportToJSON(
    habits: Habit[],
    completions: CheckIn[],
    dateRange?: DateRange
  ): Promise<Blob> {
    // Filter completions by date range if provided
    const filteredCompletions = dateRange
      ? this.filterCompletionsByDateRange(completions, dateRange)
      : completions

    // Create a set of valid habit IDs
    const habitIds = new Set(habits.map(h => h.id))
    
    // Filter out completions for non-existent habits
    const validCompletions = filteredCompletions.filter(c => habitIds.has(c.habitId))

    // Create export data structure
    const exportData = {
      exportedAt: new Date().toISOString(),
      dateRange: dateRange || null,
      habits: habits.map(h => this.serializeHabit(h)),
      completions: validCompletions.map(c => this.serializeCompletion(c)),
    }

    // Convert to JSON string
    const jsonContent = JSON.stringify(exportData, null, 2)
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  }

  /**
   * Export habit data to PDF format
   * @param habits - Array of habits to export
   * @param completions - Array of check-ins/completions
   * @param analytics - Optional analytics data to include
   * @param insights - Optional insights to include
   * @param chartElements - Optional chart HTML elements to capture
   * @param dateRange - Optional date range filter
   * @returns PDF file as Blob
   */
  async exportToPDF(
    habits: Habit[],
    completions: CheckIn[],
    analytics?: AnalyticsData[],
    insights?: Insight[],
    chartElements?: HTMLElement[],
    dateRange?: DateRange
  ): Promise<Blob> {
    // Filter completions by date range if provided
    const filteredCompletions = dateRange
      ? this.filterCompletionsByDateRange(completions, dateRange)
      : completions

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Add title and branding
    doc.setFontSize(24)
    doc.setTextColor(99, 102, 241) // Indigo color
    doc.text('Habit Tracker Report', margin, yPosition)
    yPosition += 10

    // Add generation date
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128) // Gray color
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition)
    yPosition += 5

    // Add date range if provided
    if (dateRange) {
      doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, margin, yPosition)
      yPosition += 10
    } else {
      yPosition += 5
    }

    // Add separator line
    doc.setDrawColor(229, 231, 235) // Gray border
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Add summary statistics section
    doc.setFontSize(16)
    doc.setTextColor(31, 41, 55) // Dark gray
    doc.text('Summary Statistics', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    
    // Calculate summary stats
    const totalHabits = habits.length
    const activeHabits = habits.filter(h => h.isActive).length
    const totalCompletions = filteredCompletions.filter(c => c.status === 'done').length
    const completionRate = filteredCompletions.length > 0 
      ? Math.round((totalCompletions / filteredCompletions.length) * 100) 
      : 0

    doc.text(`Total Habits: ${totalHabits}`, margin, yPosition)
    yPosition += 6
    doc.text(`Active Habits: ${activeHabits}`, margin, yPosition)
    yPosition += 6
    doc.text(`Total Completions: ${totalCompletions}`, margin, yPosition)
    yPosition += 6
    doc.text(`Overall Completion Rate: ${completionRate}%`, margin, yPosition)
    yPosition += 10

    // Add charts if provided
    if (chartElements && chartElements.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text('Charts & Visualizations', margin, yPosition)
      yPosition += 10

      for (const chartElement of chartElements) {
        try {
          // Capture chart as image
          const canvas = await html2canvas(chartElement)
          
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = pageWidth - (2 * margin)
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - margin) {
            doc.addPage()
            yPosition = margin
          }

          doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10
        } catch (error) {
          console.error('Error capturing chart:', error)
        }
      }
    }

    // Add analytics data if provided
    if (analytics && analytics.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text('Analytics Overview', margin, yPosition)
      yPosition += 10

      for (const analyticsData of analytics) {
        const habit = habits.find(h => h.id === analyticsData.habitId)
        if (!habit) continue

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.text(habit.habitName, margin, yPosition)
        yPosition += 7

        doc.setFontSize(10)
        doc.setTextColor(75, 85, 99)

        // Add trend data
        const fourWeekTrend = analyticsData.trends.fourWeeks
        doc.text(`4-Week Completion Rate: ${fourWeekTrend.completionRate.toFixed(1)}%`, margin + 5, yPosition)
        yPosition += 5
        doc.text(`Trend: ${fourWeekTrend.direction} (${fourWeekTrend.percentageChange > 0 ? '+' : ''}${fourWeekTrend.percentageChange.toFixed(1)}%)`, margin + 5, yPosition)
        yPosition += 5

        // Add day of week stats
        const bestDay = analyticsData.dayOfWeekStats.bestDay
        const worstDay = analyticsData.dayOfWeekStats.worstDay
        doc.text(`Best Day: ${bestDay.charAt(0).toUpperCase() + bestDay.slice(1)}`, margin + 5, yPosition)
        yPosition += 5
        doc.text(`Worst Day: ${worstDay.charAt(0).toUpperCase() + worstDay.slice(1)}`, margin + 5, yPosition)
        yPosition += 8
      }
    }

    // Add insights if provided
    if (insights && insights.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text('Insights & Recommendations', margin, yPosition)
      yPosition += 10

      for (const insight of insights) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(10)
        doc.setTextColor(75, 85, 99)
        
        // Add insight message
        const lines = doc.splitTextToSize(insight.message, pageWidth - (2 * margin) - 10)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * 5

        // Add recommendation if available
        if (insight.recommendation) {
          doc.setTextColor(99, 102, 241)
          const recLines = doc.splitTextToSize(`→ ${insight.recommendation}`, pageWidth - (2 * margin) - 10)
          doc.text(recLines, margin + 5, yPosition)
          yPosition += recLines.length * 5
        }

        yPosition += 3
      }
    }

    // Add habits list
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(16)
    doc.setTextColor(31, 41, 55)
    doc.text('Habits List', margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)

    for (const habit of habits) {
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = margin
      }

      doc.text(`• ${habit.habitName}`, margin, yPosition)
      yPosition += 5
      
      const details: string[] = []
      if (habit.trackingType) {
        details.push(`Type: ${habit.trackingType}`)
      }
      if (habit.targetValue && habit.targetUnit) {
        details.push(`Target: ${habit.targetValue} ${habit.targetUnit}`)
      }
      details.push(`Status: ${habit.isActive ? 'Active' : 'Inactive'}`)
      
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.text(details.join(' | '), margin + 5, yPosition)
      yPosition += 7
      
      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99)
    }

    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // Convert to Blob
    return doc.output('blob')
  }

  /**
   * Send export file via email
   * @param file - Export file blob
   * @param format - Export format
   * @param email - Recipient email address
   */
  async sendViaEmail(
    file: Blob,
    format: ExportFormat,
    email: string
  ): Promise<void> {
    // Import Firebase functions
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const { auth } = await import('../config/firebase')
    
    // Get current user
    const user = auth.currentUser
    if (!user) {
      throw new Error('User must be authenticated to send export emails')
    }

    try {
      // Convert blob to base64
      const fileData = await this.blobToBase64(file)
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const fileName = `habit-export-${timestamp}.${format}`

      // Call Cloud Function
      const functions = getFunctions()
      const sendExportEmail = httpsCallable(functions, 'sendExportEmail')
      
      const result = await sendExportEmail({
        fileData: fileData.split(',')[1], // Remove data:mime/type;base64, prefix
        fileName: fileName,
        format: format,
        recipientEmail: email,
        userId: user.uid
      })

      const response = result.data as { success: boolean; downloadUrl?: string; error?: string }
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send email')
      }

      console.log('Export email sent successfully:', response.downloadUrl)
      
    } catch (error) {
      console.error('Error sending export email:', error)
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('unauthenticated')) {
          throw new Error('Please sign in to send export emails')
        } else if (error.message.includes('invalid-argument')) {
          throw new Error('Invalid email address or export data')
        } else if (error.message.includes('permission-denied')) {
          throw new Error('You can only send exports for your own data')
        } else {
          throw new Error(`Failed to send email: ${error.message}`)
        }
      } else {
        throw new Error('Failed to send export email. Please try again.')
      }
    }
  }

  /**
   * Filter completions by date range
   */
  private filterCompletionsByDateRange(
    completions: CheckIn[],
    dateRange: DateRange
  ): CheckIn[] {
    return completions.filter(c => 
      c.dateKey >= dateRange.startDate && c.dateKey <= dateRange.endDate
    )
  }

  /**
   * Calculate streaks for each completion for export
   */
  private calculateStreaksForExport(
    completions: CheckIn[],
    _habits: Habit[]
  ): Map<string, number> {
    const streakMap = new Map<string, number>()

    // Group completions by habit
    const completionsByHabit = new Map<string, CheckIn[]>()
    for (const completion of completions) {
      if (!completionsByHabit.has(completion.habitId)) {
        completionsByHabit.set(completion.habitId, [])
      }
      completionsByHabit.get(completion.habitId)!.push(completion)
    }

    // Calculate streaks for each habit
    for (const [habitId, habitCompletions] of completionsByHabit) {
      const sorted = [...habitCompletions].sort((a, b) => 
        a.dateKey.localeCompare(b.dateKey)
      )

      let currentStreak = 0
      for (let i = 0; i < sorted.length; i++) {
        const completion = sorted[i]
        
        if (completion.status === 'done') {
          // Check if this continues a streak
          if (i > 0) {
            const prevDate = dayjs(sorted[i - 1].dateKey)
            const currDate = dayjs(completion.dateKey)
            const daysDiff = currDate.diff(prevDate, 'day')
            
            if (daysDiff === 1 && sorted[i - 1].status === 'done') {
              currentStreak++
            } else {
              currentStreak = 1
            }
          } else {
            currentStreak = 1
          }
        } else {
          currentStreak = 0
        }

        streakMap.set(`${habitId}-${completion.dateKey}`, currentStreak)
      }
    }

    return streakMap
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Serialize Habit for JSON export (convert Timestamps to ISO strings)
   */
  private serializeHabit(habit: Habit): any {
    return {
      ...habit,
      startDate: habit.startDate instanceof Timestamp 
        ? habit.startDate.toDate().toISOString() 
        : habit.startDate,
      createdAt: habit.createdAt instanceof Timestamp 
        ? habit.createdAt.toDate().toISOString() 
        : habit.createdAt,
    }
  }

  /**
   * Serialize CheckIn for JSON export (convert Timestamps to ISO strings)
   */
  private serializeCompletion(completion: CheckIn): any {
    const serialized: any = {
      ...completion,
      completedAt: completion.completedAt instanceof Timestamp 
        ? completion.completedAt.toDate().toISOString() 
        : completion.completedAt,
    }
    
    // Handle timestamps array - preserve null/undefined but convert Timestamps
    if (completion.timestamps !== undefined) {
      serialized.timestamps = completion.timestamps === null 
        ? null 
        : completion.timestamps.map(t => 
            t instanceof Timestamp ? t.toDate().toISOString() : t
          )
    }
    
    return serialized
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read blob'))
      reader.readAsDataURL(blob)
    })
  }
}

// Export singleton instance
export const exportService = new ExportService()
