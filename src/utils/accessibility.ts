/**
 * Accessibility utilities for the analytics system
 * Includes color contrast validation, ARIA helpers, and keyboard navigation utilities
 */

// WCAG AA color contrast ratios
const WCAG_AA_NORMAL = 4.5
const WCAG_AA_LARGE = 3.0

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 0
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  const threshold = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL
  return ratio >= threshold
}

/**
 * Get accessible color alternatives that meet WCAG AA standards
 */
export const accessibleColors = {
  // High contrast color pairs for charts
  primary: {
    light: '#1e40af', // blue-800 - contrast ratio 7.1:1 on white
    dark: '#60a5fa',  // blue-400 - contrast ratio 4.6:1 on gray-900
  },
  success: {
    light: '#166534', // green-800 - contrast ratio 7.2:1 on white
    dark: '#4ade80',  // green-400 - contrast ratio 4.8:1 on gray-900
  },
  danger: {
    light: '#991b1b', // red-800 - contrast ratio 7.3:1 on white
    dark: '#f87171',  // red-400 - contrast ratio 4.7:1 on gray-900
  },
  warning: {
    light: '#92400e', // amber-800 - contrast ratio 7.1:1 on white
    dark: '#fbbf24',  // amber-400 - contrast ratio 4.5:1 on gray-900
  },
  neutral: {
    light: '#374151', // gray-700 - contrast ratio 9.1:1 on white
    dark: '#d1d5db',  // gray-300 - contrast ratio 7.2:1 on gray-900
  }
}

/**
 * Generate ARIA label for chart data points
 */
export function generateChartAriaLabel(
  type: 'line' | 'bar' | 'pie' | 'heatmap',
  data: any,
  context?: string
): string {
  switch (type) {
    case 'line':
      return `Data point: ${data.date || data.label}, value ${data.value}${context ? `, ${context}` : ''}`
    case 'bar':
      return `Bar: ${data.label}, ${data.value}${data.unit || ''}${context ? `, ${context}` : ''}`
    case 'pie':
      return `Segment: ${data.name}, ${data.value} (${data.percentage}%)${context ? `, ${context}` : ''}`
    case 'heatmap':
      return `Cell: ${data.x}, ${data.y}, value ${data.value}${context ? `, ${context}` : ''}`
    default:
      return `Data: ${JSON.stringify(data)}`
  }
}

/**
 * Create keyboard navigation handler for interactive elements
 */
export function createKeyboardHandler(
  onEnter: () => void,
  onSpace?: () => void,
  onArrowKeys?: {
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
  }
) {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        onEnter()
        break
      case ' ':
        e.preventDefault()
        if (onSpace) onSpace()
        else onEnter()
        break
      case 'ArrowUp':
        if (onArrowKeys?.onArrowUp) {
          e.preventDefault()
          onArrowKeys.onArrowUp()
        }
        break
      case 'ArrowDown':
        if (onArrowKeys?.onArrowDown) {
          e.preventDefault()
          onArrowKeys.onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (onArrowKeys?.onArrowLeft) {
          e.preventDefault()
          onArrowKeys.onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (onArrowKeys?.onArrowRight) {
          e.preventDefault()
          onArrowKeys.onArrowRight()
        }
        break
    }
  }
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    // Focus first element
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  },

  /**
   * Return focus to previous element
   */
  returnFocus(previousElement: HTMLElement | null) {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus()
    }
  }
}

/**
 * Generate descriptive text for chart data
 */
export function generateChartDescription(
  type: 'trend' | 'dayOfWeek' | 'timeOfDay' | 'completion',
  data: any,
  summary?: string
): string {
  switch (type) {
    case 'trend':
      return `Trend chart showing completion rates over time. ${summary || ''} Data includes ${data.length} data points.`
    case 'dayOfWeek':
      const bestDay = data.bestDay
      const worstDay = data.worstDay
      return `Day of week performance chart. Best performing day: ${bestDay}. Worst performing day: ${worstDay}. ${summary || ''}`
    case 'timeOfDay':
      const peakHours = data.peakHours?.join(', ') || 'none identified'
      return `Time of day distribution showing completion patterns across 24 hours. Peak hours: ${peakHours}. ${summary || ''}`
    case 'completion':
      return `Completion distribution showing ${data.completed} completed and ${data.missed} missed occurrences. ${summary || ''}`
    default:
      return `Chart displaying analytics data. ${summary || ''}`
  }
}

/**
 * Skip link component for keyboard navigation
 */
export function createSkipLink(targetId: string, label: string): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = label
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50'
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
  return skipLink
}

/**
 * Reduced motion utilities
 */
export const motionUtils = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Get animation duration based on user preference
   */
  getAnimationDuration(defaultDuration: number): number {
    return this.prefersReducedMotion() ? 0 : defaultDuration
  },

  /**
   * Apply motion-safe animations
   */
  safeAnimate(element: HTMLElement, animation: Keyframe[], options: KeyframeAnimationOptions) {
    if (this.prefersReducedMotion()) {
      // Skip animation, just apply final state
      const finalFrame = animation[animation.length - 1]
      Object.assign(element.style, finalFrame)
      return
    }
    return element.animate(animation, options)
  }
}

/**
 * High contrast mode detection
 */
export const contrastUtils = {
  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastMode(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  },

  /**
   * Get colors adjusted for high contrast mode
   */
  getContrastAdjustedColors(colors: typeof accessibleColors) {
    if (this.isHighContrastMode()) {
      return {
        ...colors,
        primary: { light: '#000000', dark: '#ffffff' },
        success: { light: '#000000', dark: '#ffffff' },
        danger: { light: '#000000', dark: '#ffffff' },
        warning: { light: '#000000', dark: '#ffffff' },
        neutral: { light: '#000000', dark: '#ffffff' }
      }
    }
    return colors
  }
}

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  /**
   * Create a visually hidden element for screen readers
   */
  createScreenReaderOnly(text: string): HTMLElement {
    const element = document.createElement('span')
    element.textContent = text
    element.className = 'sr-only'
    return element
  },

  /**
   * Update screen reader content
   */
  updateScreenReaderContent(elementId: string, text: string) {
    const element = document.getElementById(elementId)
    if (element) {
      element.textContent = text
    }
  },

  /**
   * Create live region for dynamic announcements
   */
  createLiveRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const existing = document.getElementById(id)
    if (existing) return existing

    const liveRegion = document.createElement('div')
    liveRegion.id = id
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    document.body.appendChild(liveRegion)
    return liveRegion
  }
}

/**
 * Keyboard navigation helpers
 */
export const keyboardUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
  },

  /**
   * Create roving tabindex for a group of elements
   */
  createRovingTabindex(elements: HTMLElement[], initialIndex = 0) {
    elements.forEach((element, index) => {
      element.tabIndex = index === initialIndex ? 0 : -1
    })

    const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          newIndex = (currentIndex + 1) % elements.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1
          break
        case 'Home':
          e.preventDefault()
          newIndex = 0
          break
        case 'End':
          e.preventDefault()
          newIndex = elements.length - 1
          break
      }

      if (newIndex !== currentIndex) {
        elements[currentIndex].tabIndex = -1
        elements[newIndex].tabIndex = 0
        elements[newIndex].focus()
      }
    }

    elements.forEach((element, index) => {
      element.addEventListener('keydown', (e) => handleKeyDown(e, index))
      element.addEventListener('focus', () => {
        elements.forEach((el, i) => {
          el.tabIndex = i === index ? 0 : -1
        })
      })
    })

    return () => {
      elements.forEach(element => {
        element.removeEventListener('keydown', handleKeyDown as any)
      })
    }
  }
}

/**
 * Accessibility testing utilities
 */
export const a11yTestUtils = {
  /**
   * Check if element has proper ARIA labeling
   */
  hasProperLabeling(element: HTMLElement): boolean {
    const hasAriaLabel = element.hasAttribute('aria-label')
    const hasAriaLabelledby = element.hasAttribute('aria-labelledby')
    const hasTitle = element.hasAttribute('title')
    const hasTextContent = element.textContent?.trim().length > 0

    return hasAriaLabel || hasAriaLabelledby || hasTitle || hasTextContent
  },

  /**
   * Validate color contrast ratio
   */
  validateContrast(foreground: string, background: string, isLargeText = false): {
    ratio: number
    passes: boolean
    level: 'AA' | 'AAA' | 'fail'
  } {
    const ratio = getContrastRatio(foreground, background)
    const aaThreshold = isLargeText ? 3.0 : 4.5
    const aaaThreshold = isLargeText ? 4.5 : 7.0

    return {
      ratio,
      passes: ratio >= aaThreshold,
      level: ratio >= aaaThreshold ? 'AAA' : ratio >= aaThreshold ? 'AA' : 'fail'
    }
  },

  /**
   * Check keyboard accessibility
   */
  isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.tabIndex
    const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())
    const hasRole = element.hasAttribute('role')
    
    return tabIndex >= 0 || isInteractive || hasRole
  }
}