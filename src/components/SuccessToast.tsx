import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SuccessToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
  icon?: string
  variant?: 'success' | 'info' | 'warning' | 'error'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function SuccessToast({ 
  message, 
  isVisible, 
  onClose, 
  duration = 3000,
  icon = '✅',
  variant = 'success',
  position = 'top-right'
}: SuccessToastProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!shouldRender) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  const variantClasses = {
    success: 'bg-green-600 text-white border-green-500',
    info: 'bg-blue-600 text-white border-blue-500',
    warning: 'bg-yellow-600 text-white border-yellow-500',
    error: 'bg-red-600 text-white border-red-500'
  }

  const variantIconColors = {
    success: 'text-green-200',
    info: 'text-blue-200',
    warning: 'text-yellow-200',
    error: 'text-red-200'
  }

  const getDefaultIcon = (variant: string) => {
    switch (variant) {
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '✅'
    }
  }

  const displayIcon = icon || getDefaultIcon(variant)

  const toast = (
    <div className={`fixed ${positionClasses[position]} z-[1000] pointer-events-none`}>
      <div
        className={`${variantClasses[variant]} px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm backdrop-blur-sm border transition-all duration-300 transform touch-manipulation ${
          isVisible 
            ? 'opacity-100 translate-x-0 scale-100 animate-slideInRight' 
            : 'opacity-0 translate-x-full scale-95'
        }`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-xl animate-gentleBounce flex-shrink-0" role="img" aria-label={variant}>
          {displayIcon}
        </span>
        <span className="font-medium leading-relaxed flex-1">{message}</span>
        <button
          onClick={onClose}
          className={`ml-2 ${variantIconColors[variant]} hover:text-white transition-colors pointer-events-auto focus-visible-ring rounded-full p-2 hover:bg-white/10 touch-target`}
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )

  return createPortal(toast, document.body)
}

// Hook for managing toasts
export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    isVisible: boolean
    icon?: string
    variant?: 'success' | 'info' | 'warning' | 'error'
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    duration?: number
  }>({
    message: '',
    isVisible: false,
    variant: 'success',
    position: 'top-right',
    duration: 3000
  })

  const showToast = (
    message: string, 
    options?: {
      icon?: string
      variant?: 'success' | 'info' | 'warning' | 'error'
      position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
      duration?: number
    }
  ) => {
    setToast({ 
      message, 
      isVisible: true, 
      icon: options?.icon,
      variant: options?.variant || 'success',
      position: options?.position || 'top-right',
      duration: options?.duration || 3000
    })
  }

  const showSuccess = (message: string, icon?: string) => {
    showToast(message, { variant: 'success', icon })
  }

  const showError = (message: string, icon?: string) => {
    showToast(message, { variant: 'error', icon })
  }

  const showInfo = (message: string, icon?: string) => {
    showToast(message, { variant: 'info', icon })
  }

  const showWarning = (message: string, icon?: string) => {
    showToast(message, { variant: 'warning', icon })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  const ToastComponent = () => (
    <SuccessToast
      message={toast.message}
      isVisible={toast.isVisible}
      onClose={hideToast}
      icon={toast.icon}
      variant={toast.variant}
      position={toast.position}
      duration={toast.duration}
    />
  )

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
    Toast: ToastComponent
  }
}

// Backward compatibility
export const useSuccessToast = useToast