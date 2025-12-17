import { useState } from 'react'
import { useToast } from './SuccessToast'

interface JourneyStep {
  id: string
  title: string
  description: string
  selector: string
  action: 'click' | 'hover' | 'scroll' | 'wait' | 'check'
  expectedResult?: string
  timeout?: number
}

const premiumAnalyticsJourney: JourneyStep[] = [
  {
    id: 'navigate-to-analytics',
    title: 'Navigate to Analytics',
    description: 'Click on a habit card to access analytics',
    selector: '[data-habit-card]',
    action: 'click',
    expectedResult: 'Analytics dashboard should load'
  },
  {
    id: 'check-premium-status',
    title: 'Verify Premium Status',
    description: 'Check if premium badge is visible',
    selector: '[data-analytics-dashboard]',
    action: 'check',
    expectedResult: 'Premium badge should be visible for premium users'
  },
  {
    id: 'test-trend-section',
    title: 'Test Trend Analysis',
    description: 'Click on trends section',
    selector: '[data-section="trends"]',
    action: 'click',
    expectedResult: 'Trend analysis should load with charts'
  },
  {
    id: 'test-performance-section',
    title: 'Test Performance Analysis',
    description: 'Click on performance section',
    selector: '[data-section="performance"]',
    action: 'click',
    expectedResult: 'Day-of-week and time analysis should load'
  },
  {
    id: 'test-insights-section',
    title: 'Test AI Insights',
    description: 'Click on insights section',
    selector: '[data-section="insights"]',
    action: 'click',
    expectedResult: 'AI-powered insights should be displayed'
  },
  {
    id: 'test-breakdown-section',
    title: 'Test Detailed Breakdowns',
    description: 'Click on breakdown section',
    selector: '[data-section="breakdown"]',
    action: 'click',
    expectedResult: 'Detailed time period views should load'
  },
  {
    id: 'test-export-section',
    title: 'Test Export Options',
    description: 'Click on export section',
    selector: '[data-section="export"]',
    action: 'click',
    expectedResult: 'Export options should be displayed'
  },
  {
    id: 'test-export-modal',
    title: 'Test Export Modal',
    description: 'Click on export button',
    selector: '[data-export-trigger]',
    action: 'click',
    expectedResult: 'Export modal should open'
  },
  {
    id: 'test-onboarding-tour',
    title: 'Test Onboarding Tour',
    description: 'Start onboarding tour if available',
    selector: '[aria-label="Start analytics tour"]',
    action: 'click',
    expectedResult: 'Onboarding tour should start'
  }
]

interface UserJourneyTestProps {
  isVisible: boolean
  onClose: () => void
}

export function UserJourneyTest({ isVisible, onClose }: UserJourneyTestProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{ [key: string]: 'pass' | 'fail' | 'pending' }>({})
  const [logs, setLogs] = useState<string[]>([])
  const { showSuccess, showError, showInfo, Toast } = useToast()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const executeStep = async (step: JourneyStep): Promise<boolean> => {
    addLog(`Executing: ${step.title}`)
    
    try {
      const element = document.querySelector(step.selector)
      
      if (!element) {
        addLog(`❌ Element not found: ${step.selector}`)
        return false
      }

      switch (step.action) {
        case 'click':
          (element as HTMLElement).click()
          addLog(`✅ Clicked: ${step.selector}`)
          break
          
        case 'hover':
          const hoverEvent = new MouseEvent('mouseenter', { bubbles: true })
          element.dispatchEvent(hoverEvent)
          addLog(`✅ Hovered: ${step.selector}`)
          break
          
        case 'scroll':
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          addLog(`✅ Scrolled to: ${step.selector}`)
          break
          
        case 'check':
          const isVisible = (element as HTMLElement).offsetParent !== null
          addLog(`✅ Checked visibility: ${step.selector} - ${isVisible ? 'visible' : 'hidden'}`)
          return isVisible
          
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.timeout || 1000))
          addLog(`✅ Waited: ${step.timeout || 1000}ms`)
          break
      }

      // Wait for any animations or state changes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return true
    } catch (error) {
      addLog(`❌ Error in step: ${error}`)
      return false
    }
  }

  const runJourney = async () => {
    setIsRunning(true)
    setResults({})
    setLogs([])
    setCurrentStep(0)
    
    addLog('🚀 Starting Premium Analytics User Journey Test')
    showInfo('Starting user journey test...', '🧪')

    for (let i = 0; i < premiumAnalyticsJourney.length; i++) {
      const step = premiumAnalyticsJourney[i]
      setCurrentStep(i)
      
      const success = await executeStep(step)
      setResults(prev => ({ ...prev, [step.id]: success ? 'pass' : 'fail' }))
      
      if (!success) {
        addLog(`❌ Step failed: ${step.title}`)
        showError(`Step failed: ${step.title}`, '❌')
        break
      } else {
        addLog(`✅ Step passed: ${step.title}`)
      }
      
      // Brief pause between steps
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const passedSteps = Object.values(results).filter(r => r === 'pass').length
    const totalSteps = premiumAnalyticsJourney.length
    
    addLog(`🏁 Journey completed: ${passedSteps}/${totalSteps} steps passed`)
    
    if (passedSteps === totalSteps) {
      showSuccess('All tests passed! 🎉', '✅')
    } else {
      showError(`${totalSteps - passedSteps} tests failed`, '❌')
    }
    
    setIsRunning(false)
  }

  const resetJourney = () => {
    setCurrentStep(0)
    setResults({})
    setLogs([])
    setIsRunning(false)
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] animate-modal-backdrop backdrop-blur-sm" />
      
      <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-modal-content">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🧪 Premium Analytics User Journey Test
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Automated testing of the complete premium analytics user experience
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible-ring"
                aria-label="Close test panel"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Test Steps */}
            <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Test Steps
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={runJourney}
                    disabled={isRunning}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Running...
                      </>
                    ) : (
                      '▶️ Run Test'
                    )}
                  </button>
                  <button
                    onClick={resetJourney}
                    disabled={isRunning}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {premiumAnalyticsJourney.map((step, index) => {
                  const status = results[step.id]
                  const isCurrent = currentStep === index && isRunning
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 animate-pulseGlow'
                          : status === 'pass'
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                          : status === 'fail'
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Step {index + 1}
                            </span>
                            {status === 'pass' && <span className="text-green-600">✅</span>}
                            {status === 'fail' && <span className="text-red-600">❌</span>}
                            {isCurrent && <span className="text-blue-600 animate-pulse">⏳</span>}
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {step.description}
                          </p>
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {step.selector}
                          </code>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Logs */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Logs
              </h3>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-4 font-mono text-sm text-green-400 h-full overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic">
                    No logs yet. Click "Run Test" to start the journey.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1 leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Object.keys(results).length > 0 && (
                  <>
                    Passed: {Object.values(results).filter(r => r === 'pass').length} / {premiumAnalyticsJourney.length}
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast />
    </>
  )
}