import { useState, useEffect } from 'react'
import { Habit, CheckIn } from '../hooks/useHabits'
import { ExportFormat, DateRange, AnalyticsData, Insight } from '../types/analytics'
import { exportService } from '../services/ExportService'

interface ExportModalProps {
  isOpen: boolean
  habits: Habit[]
  completions: CheckIn[]
  analytics?: AnalyticsData[]
  insights?: Insight[]
  onClose: () => void
  isMobileBottomSheet?: boolean
}

export function ExportModal({ 
  isOpen, 
  habits, 
  completions, 
  analytics, 
  insights, 
  onClose,
  isMobileBottomSheet = false
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  })
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<string>('')
  const [email, setEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download')

  // Initialize date range with reasonable defaults
  useEffect(() => {
    if (isOpen && completions.length > 0) {
      const sortedCompletions = [...completions].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      const oldestDate = sortedCompletions[0]?.dateKey || new Date().toISOString().split('T')[0]
      const newestDate = sortedCompletions[sortedCompletions.length - 1]?.dateKey || new Date().toISOString().split('T')[0]
      
      setDateRange({
        startDate: oldestDate,
        endDate: newestDate
      })
    }
  }, [isOpen, completions])

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen || isMobileBottomSheet) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isExporting, onClose, isMobileBottomSheet])

  if (!isOpen && !isMobileBottomSheet) return null

  const getFilteredData = () => {
    const effectiveRange = useCustomRange ? dateRange : undefined
    const filteredCompletions = effectiveRange
      ? completions.filter(c => 
          c.dateKey >= effectiveRange.startDate && c.dateKey <= effectiveRange.endDate
        )
      : completions

    return {
      habits,
      completions: filteredCompletions,
      analytics: analytics || [],
      insights: insights || []
    }
  }

  const generatePreview = async () => {
    try {
      setShowPreview(true)
      const data = getFilteredData()
      
      if (selectedFormat === 'csv') {
        const blob = await exportService.exportToCSV(
          data.habits,
          data.completions,
          useCustomRange ? dateRange : undefined
        )
        const text = await blob.text()
        const lines = text.split('\n')
        setPreviewData(lines.slice(0, 10).join('\n') + (lines.length > 10 ? '\n...' : ''))
      } else if (selectedFormat === 'json') {
        const blob = await exportService.exportToJSON(
          data.habits,
          data.completions,
          useCustomRange ? dateRange : undefined
        )
        const text = await blob.text()
        const parsed = JSON.parse(text)
        setPreviewData(JSON.stringify(parsed, null, 2).slice(0, 500) + '...')
      } else {
        setPreviewData('PDF preview not available - will include charts, statistics, and insights')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      setPreviewData('Error generating preview')
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)
      
      const data = getFilteredData()
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      let blob: Blob
      let filename: string

      if (selectedFormat === 'csv') {
        blob = await exportService.exportToCSV(
          data.habits,
          data.completions,
          useCustomRange ? dateRange : undefined
        )
        filename = `habit-data-${new Date().toISOString().split('T')[0]}.csv`
      } else if (selectedFormat === 'json') {
        blob = await exportService.exportToJSON(
          data.habits,
          data.completions,
          useCustomRange ? dateRange : undefined
        )
        filename = `habit-data-${new Date().toISOString().split('T')[0]}.json`
      } else {
        // For PDF, we'll capture any chart elements on the page
        const chartElements = Array.from(document.querySelectorAll('[data-chart]')) as HTMLElement[]
        blob = await exportService.exportToPDF(
          data.habits,
          data.completions,
          data.analytics,
          data.insights,
          chartElements,
          useCustomRange ? dateRange : undefined
        )
        filename = `habit-report-${new Date().toISOString().split('T')[0]}.pdf`
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      if (deliveryMethod === 'download') {
        // Download the file
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Send via email (placeholder for now)
        try {
          await exportService.sendViaEmail(blob, selectedFormat, email)
        } catch (error) {
          // Fallback to download if email fails
          console.warn('Email delivery failed, falling back to download:', error)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }

      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        onClose()
      }, 1000)

    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const formatOptions: { value: ExportFormat; label: string; description: string; icon: string }[] = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Spreadsheet format with completion data',
      icon: '📊'
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'Complete data with all metadata',
      icon: '📄'
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Formatted report with charts and insights',
      icon: '📋'
    }
  ]

  const getDataStats = () => {
    const data = getFilteredData()
    return {
      habits: data.habits.length,
      completions: data.completions.length,
      dateRange: useCustomRange ? `${dateRange.startDate} to ${dateRange.endDate}` : 'All time'
    }
  }

  const stats = getDataStats()

  // Content component for both mobile and desktop
  const ExportContent = () => (
    <div className="space-y-6">
      {/* Format Selection */}
      <fieldset>
        <legend className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Export Format
        </legend>
        <div className={`grid gap-3 ${isMobileBottomSheet ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`} role="radiogroup" aria-labelledby="format-selection">
          {formatOptions.map((format) => (
            <button
              key={format.value}
              onClick={() => setSelectedFormat(format.value)}
              disabled={isExporting}
              role="radio"
              aria-checked={selectedFormat === format.value}
              aria-describedby={`format-${format.value}-description`}
              className={`p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation ${isMobileBottomSheet ? 'min-h-[60px]' : ''} ${
                selectedFormat === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`${isMobileBottomSheet ? 'flex items-center gap-3' : 'text-2xl mb-2'}`}>
                <div className={`${isMobileBottomSheet ? 'text-xl' : 'text-2xl mb-2'}`} aria-hidden="true">{format.icon}</div>
                <div className={isMobileBottomSheet ? 'flex-1' : ''}>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {format.label}
                  </div>
                  <div id={`format-${format.value}-description`} className="text-sm text-gray-600 dark:text-gray-400">
                    {format.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Date Range Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Date Range
          </label>
          <button
            onClick={() => setUseCustomRange(!useCustomRange)}
            disabled={isExporting}
            className={`text-sm font-medium transition-colors touch-manipulation ${
              useCustomRange 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {useCustomRange ? 'Use All Data' : 'Custom Range'}
          </button>
        </div>

        {useCustomRange && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={isExporting}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={isExporting}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Export Summary
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Habits</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {stats.habits}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Completions</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {stats.completions}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Period</div>
            <div className="font-semibold text-gray-900 dark:text-white text-xs">
              {stats.dateRange}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Preview
          </label>
          <button
            onClick={generatePreview}
            disabled={isExporting}
            className={`text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors touch-manipulation ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Generate Preview
          </button>
        </div>

        {showPreview && (
          <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 border">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {previewData}
            </pre>
          </div>
        )}
      </div>

      {/* Delivery Method */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Delivery Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryMethod('download')}
            disabled={isExporting}
            className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation ${
              deliveryMethod === 'download'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Download</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Save to device</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setDeliveryMethod('email')}
            disabled={isExporting}
            className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation ${
              deliveryMethod === 'email'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Email</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Send via email</div>
              </div>
            </div>
          </button>
        </div>

        {deliveryMethod === 'email' && (
          <div className="mt-3">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {exportProgress < 30 ? 'Preparing data...' : 
                 exportProgress < 60 ? 'Generating export...' :
                 exportProgress < 90 ? 'Finalizing...' : 'Almost done...'}
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {exportProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            {selectedFormat === 'pdf' ? 'Capturing charts and generating PDF...' :
             selectedFormat === 'csv' ? 'Processing completion data...' :
             'Formatting JSON data...'}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-colors touch-manipulation min-h-[44px] ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || (deliveryMethod === 'email' && !email.trim())}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-colors shadow-lg touch-manipulation min-h-[44px] ${
              isExporting || (deliveryMethod === 'email' && !email.trim()) 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            {isExporting ? 'Exporting...' : `Export ${selectedFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )

  // If used in mobile bottom sheet, return content only
  if (isMobileBottomSheet) {
    return <ExportContent />
  }

  // Regular modal for desktop
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 dark:bg-black/85 z-[80] backdrop-blur-md animate-modal-backdrop"
        onClick={!isExporting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          aria-describedby="export-modal-description"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="export-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                  Export Data
                </h2>
                <p id="export-modal-description" className="text-gray-600 dark:text-gray-400 mt-1">
                  Download your habit data in your preferred format
                </p>
              </div>
              {!isExporting && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                  aria-label="Close export dialog"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <ExportContent />
          </div>
        </div>
      </div>
    </>
  )
}