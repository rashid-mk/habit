import React, { useState, useEffect, useRef, useMemo } from 'react'

interface VirtualScrollListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

/**
 * Virtual scrolling component for large datasets
 * Only renders visible items to maintain performance
 */
export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(items.length - 1, visibleEnd + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Get visible items
  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i]
      })
    }
    return result
  }, [items, visibleRange])

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Total height of all items
  const totalHeight = items.length * itemHeight

  // Offset for visible items
  const offsetY = visibleRange.start * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for virtual scrolling with dynamic item heights
 * More complex but handles variable item sizes
 */
export function useVirtualScroll<T>({
  items,
  estimatedItemHeight = 50,
  containerHeight,
  overscan = 5
}: {
  items: T[]
  estimatedItemHeight?: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<number[]>([])
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())

  // Update item heights when items change
  useEffect(() => {
    const heights = new Array(items.length).fill(estimatedItemHeight)
    setItemHeights(heights)
  }, [items.length, estimatedItemHeight])

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions = []
    let totalHeight = 0
    
    for (let i = 0; i < items.length; i++) {
      positions.push(totalHeight)
      totalHeight += itemHeights[i] || estimatedItemHeight
    }
    
    return { positions, totalHeight }
  }, [itemHeights, items.length, estimatedItemHeight])

  // Find visible range
  const visibleRange = useMemo(() => {
    const { positions } = itemPositions
    
    let start = 0
    let end = items.length - 1
    
    // Binary search for start
    let left = 0
    let right = items.length - 1
    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (positions[mid] < scrollTop) {
        start = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
    
    // Find end
    const viewportBottom = scrollTop + containerHeight
    for (let i = start; i < items.length; i++) {
      if (positions[i] > viewportBottom) {
        end = i - 1
        break
      }
    }
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    }
  }, [scrollTop, containerHeight, itemPositions, items.length, overscan])

  // Measure item height
  const measureItem = (index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height
    setItemHeights(prev => {
      const newHeights = [...prev]
      newHeights[index] = height
      return newHeights
    })
  }

  // Get item ref callback
  const getItemRef = (index: number) => (element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(index, element)
      measureItem(index, element)
    } else {
      itemRefs.current.delete(index)
    }
  }

  return {
    visibleRange,
    totalHeight: itemPositions.totalHeight,
    offsetY: itemPositions.positions[visibleRange.start] || 0,
    setScrollTop,
    getItemRef
  }
}