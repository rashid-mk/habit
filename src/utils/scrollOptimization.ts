/**
 * Scroll performance optimization utilities
 */

let isScrolling = false
let scrollTimer: NodeJS.Timeout | null = null

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

/**
 * Disable animations during scroll for better performance
 */
export function initScrollOptimization() {
  const handleScrollStart = throttle(() => {
    if (!isScrolling) {
      isScrolling = true
      document.body.classList.add('scrolling')
    }
    
    if (scrollTimer) clearTimeout(scrollTimer)
    
    scrollTimer = setTimeout(() => {
      isScrolling = false
      document.body.classList.remove('scrolling')
    }, 150) // Remove class 150ms after scroll stops
  }, 16) // ~60fps throttling
  
  // Add passive listeners for better performance
  window.addEventListener('scroll', handleScrollStart, { passive: true })
  window.addEventListener('touchmove', handleScrollStart, { passive: true })
  
  return () => {
    window.removeEventListener('scroll', handleScrollStart)
    window.removeEventListener('touchmove', handleScrollStart)
    if (scrollTimer) clearTimeout(scrollTimer)
  }
}

/**
 * Optimize touch handlers for mobile performance
 */
export function createOptimizedTouchHandler(
  onTouchStart?: (e: TouchEvent) => void,
  onTouchMove?: (e: TouchEvent) => void,
  onTouchEnd?: (e: TouchEvent) => void
) {
  const throttledMove = onTouchMove ? throttle(onTouchMove, 16) : undefined
  
  return {
    onTouchStart: onTouchStart,
    onTouchMove: throttledMove,
    onTouchEnd: onTouchEnd
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get optimized animation duration based on device and user preferences
 */
export function getOptimizedAnimationDuration(defaultDuration: number): number {
  if (prefersReducedMotion()) return 0
  
  // Reduce animations on mobile for better performance
  const isMobile = window.innerWidth < 768
  return isMobile ? Math.min(defaultDuration * 0.5, 200) : defaultDuration
}