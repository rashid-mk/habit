import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  delay?: number
  disabled?: boolean
  className?: string
  variant?: 'default' | 'dark' | 'light' | 'info' | 'success' | 'warning' | 'error'
  showArrow?: boolean
  maxWidth?: string
}

export function Tooltip({ 
  content, 
  children, 
  placement = 'auto', 
  delay = 500,
  disabled = false,
  className = '',
  variant = 'default',
  showArrow = true,
  maxWidth = '200px'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = 0
    let y = 0
    let finalPlacement = placement

    // Auto placement logic
    if (placement === 'auto') {
      const spaceTop = triggerRect.top
      const spaceBottom = viewport.height - triggerRect.bottom
      const spaceLeft = triggerRect.left
      const spaceRight = viewport.width - triggerRect.right

      if (spaceTop >= tooltipRect.height + 16) {
        finalPlacement = 'top'
      } else if (spaceBottom >= tooltipRect.height + 16) {
        finalPlacement = 'bottom'
      } else if (spaceRight >= tooltipRect.width + 16) {
        finalPlacement = 'right'
      } else if (spaceLeft >= tooltipRect.width + 16) {
        finalPlacement = 'left'
      } else {
        finalPlacement = 'top' // fallback
      }
    }

    switch (finalPlacement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.top - tooltipRect.height - 12
        break
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.bottom + 12
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - 12
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = triggerRect.right + 12
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
    }

    // Adjust for viewport boundaries with padding
    const padding = 16
    if (x < padding) x = padding
    if (x + tooltipRect.width > viewport.width - padding) {
      x = viewport.width - tooltipRect.width - padding
    }
    if (y < padding) y = padding
    if (y + tooltipRect.height > viewport.height - padding) {
      y = viewport.height - tooltipRect.height - padding
    }

    setPosition({ x, y })
  }

  const showTooltip = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Calculate position after tooltip is rendered
      setTimeout(calculatePosition, 0)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const handleMouseEnter = () => showTooltip()
  const handleMouseLeave = () => hideTooltip()
  const handleFocus = () => showTooltip()
  const handleBlur = () => hideTooltip()

  // Clone the child element and add event handlers
  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-describedby': isVisible ? 'tooltip' : undefined
  })

  const getVariantClasses = () => {
    switch (variant) {
      case 'dark':
        return 'bg-gray-900 dark:bg-gray-800 text-white border-gray-700'
      case 'light':
        return 'bg-white dark:bg-gray-100 text-gray-900 border-gray-200 shadow-xl'
      case 'info':
        return 'bg-blue-600 text-white border-blue-500'
      case 'success':
        return 'bg-green-600 text-white border-green-500'
      case 'warning':
        return 'bg-yellow-600 text-white border-yellow-500'
      case 'error':
        return 'bg-red-600 text-white border-red-500'
      default:
        return 'bg-gray-900 dark:bg-gray-700 text-white border-gray-600'
    }
  }

  const getArrowClasses = () => {
    const baseColor = variant === 'light' 
      ? 'bg-white dark:bg-gray-100' 
      : variant === 'info' ? 'bg-blue-600'
      : variant === 'success' ? 'bg-green-600'
      : variant === 'warning' ? 'bg-yellow-600'
      : variant === 'error' ? 'bg-red-600'
      : 'bg-gray-900 dark:bg-gray-700'
    
    return baseColor
  }

  const tooltipElement = isVisible ? (
    <div
      ref={tooltipRef}
      id="tooltip"
      role="tooltip"
      className={`fixed z-[1000] px-4 py-3 text-sm rounded-xl shadow-2xl pointer-events-none animate-slideUpFade border backdrop-blur-sm ${getVariantClasses()} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        maxWidth: maxWidth
      }}
    >
      <div className="font-medium leading-relaxed">{content}</div>
      {/* Arrow */}
      {showArrow && (
        <div
          className={`absolute w-3 h-3 transform rotate-45 ${getArrowClasses()} ${
            placement === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
            placement === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
            placement === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
            'left-[-6px] top-1/2 -translate-y-1/2'
          }`}
        />
      )}
    </div>
  ) : null

  return (
    <>
      {trigger}
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  )
}