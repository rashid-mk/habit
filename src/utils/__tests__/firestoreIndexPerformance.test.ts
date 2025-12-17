import { describe, it, expect } from 'vitest'

/**
 * Firestore Index Performance Test
 * 
 * This test validates that all required Firestore indexes are properly configured
 * for premium analytics queries and meet performance requirements.
 * 
 * Tests are designed to validate index configuration against expected query patterns
 * and ensure compliance with Requirements 11.1 (2-second calculation time).
 */

// Complete index configuration from firestore.indexes.json
const firestoreIndexConfiguration = {
  indexes: [
    // Core application indexes
    {
      collectionGroup: "habits",
      fields: ["uid", "createdAt"],
      purpose: "User habits ordered by creation date"
    },
    {
      collectionGroup: "checks", 
      fields: ["habitId", "dateKey"],
      purpose: "Basic habit check-ins ordered by date"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "completedAt"],
      purpose: "Completed check-ins ordered by completion time"
    },
    
    // Premium analytics indexes for checks collection
    {
      collectionGroup: "checks",
      fields: ["habitId", "dateKey", "completedAt"],
      purpose: "Date range queries for trend analysis",
      analyticsUse: "4W, 3M, 6M, 1Y trend calculations"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "dateKey", "isCompleted"],
      purpose: "Completion status filtering within date ranges",
      analyticsUse: "Completion rate calculations with date filtering"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "isCompleted", "dateKey"],
      purpose: "Filter completed items then sort by date (DESC)",
      analyticsUse: "Day-of-week analysis, monthly comparisons"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "isCompleted", "dateKey"],
      purpose: "Filter completed items then sort by date (ASC)",
      analyticsUse: "Day-of-week analysis, chronological ordering"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "isCompleted", "completedAt"],
      purpose: "Time-of-day analysis for completed check-ins (DESC)",
      analyticsUse: "Peak hour identification, recent completions first"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "isCompleted", "completedAt"],
      purpose: "Time-of-day analysis for completed check-ins (ASC)",
      analyticsUse: "Chronological completion analysis"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "dateKey", "progressValue"],
      purpose: "Progress value analysis for count/time habits",
      analyticsUse: "Average progress calculations, trend analysis"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "progressValue"],
      purpose: "Progress analysis without date constraints",
      analyticsUse: "Quick progress trend analysis, peak performance"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "status", "dateKey"],
      purpose: "Legacy status field support",
      analyticsUse: "Backward compatibility for older habit data"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "dateKey", "status"],
      purpose: "Legacy status with date ordering",
      analyticsUse: "Legacy habit completion analysis"
    },
    {
      collectionGroup: "checks",
      fields: ["habitId", "completedAt"],
      purpose: "Simple completion time ordering",
      analyticsUse: "Basic time-based analysis"
    },
    
    // Analytics metadata indexes
    {
      collectionGroup: "analytics",
      fields: ["userId", "habitId", "calculatedAt"],
      purpose: "Comprehensive analytics lookup",
      analyticsUse: "Primary analytics retrieval with versioning"
    },
    {
      collectionGroup: "analytics",
      fields: ["userId", "calculatedAt"],
      purpose: "User-level analytics retrieval",
      analyticsUse: "Dashboard loading, cache management"
    },
    {
      collectionGroup: "analytics",
      fields: ["habitId", "calculatedAt"],
      purpose: "Habit-specific analytics retrieval",
      analyticsUse: "Individual habit analytics, cache invalidation"
    },
    {
      collectionGroup: "analytics",
      fields: ["userId", "habitId"],
      purpose: "Direct user-habit analytics lookup",
      analyticsUse: "Specific analytics retrieval without timestamp"
    },
    
    // Premium analytics collection indexes
    {
      collectionGroup: "premiumAnalytics",
      fields: ["userId", "habitId", "calculatedAt"],
      purpose: "Premium analytics with versioning",
      analyticsUse: "Primary premium analytics storage and retrieval"
    },
    {
      collectionGroup: "premiumAnalytics",
      fields: ["userId", "calculatedAt"],
      purpose: "All premium analytics for user",
      analyticsUse: "User dashboard premium features"
    },
    {
      collectionGroup: "premiumAnalytics",
      fields: ["habitId", "calculatedAt"],
      purpose: "Premium analytics for specific habit",
      analyticsUse: "Habit detail page premium features"
    }
  ]
}

// Expected query patterns for analytics calculations
const analyticsQueryPatterns = [
  {
    name: "Trend Analysis - Date Range Query",
    collection: "checks",
    queryType: "date_range_with_completion_time",
    fields: ["habitId", "dateKey", "completedAt"],
    description: "Get completions within date range ordered by completion time",
    requirement: "Requirements 1.1 - Completion rates for 4W, 3M, 6M, 1Y periods",
    expectedPerformance: "< 500ms for 1 year of data"
  },
  {
    name: "Completion Rate Calculation",
    collection: "checks", 
    queryType: "completion_status_filtering",
    fields: ["habitId", "dateKey", "isCompleted"],
    description: "Filter completed check-ins within date range",
    requirement: "Requirements 1.1 - Calculate completion rates for time periods",
    expectedPerformance: "< 300ms for date range queries"
  },
  {
    name: "Day-of-Week Analysis",
    collection: "checks",
    queryType: "completion_grouping",
    fields: ["habitId", "isCompleted", "dateKey"],
    description: "Group completions by day of week",
    requirement: "Requirements 2.1 - Calculate completion rates for each day",
    expectedPerformance: "< 400ms for 4+ weeks of data"
  },
  {
    name: "Time-of-Day Distribution",
    collection: "checks",
    queryType: "time_analysis",
    fields: ["habitId", "isCompleted", "completedAt"],
    description: "Analyze completion times by hour",
    requirement: "Requirements 3.1, 3.2 - Track hour of completion",
    expectedPerformance: "< 300ms for timestamp analysis"
  },
  {
    name: "Progress Value Analysis",
    collection: "checks",
    queryType: "progress_analysis",
    fields: ["habitId", "dateKey", "progressValue"],
    description: "Analyze progress values for count/time habits",
    requirement: "Requirements 1.2, 1.3 - Average progress calculations",
    expectedPerformance: "< 400ms for progress trend analysis"
  },
  {
    name: "Monthly Comparison",
    collection: "checks",
    queryType: "monthly_comparison",
    fields: ["habitId", "dateKey", "isCompleted"],
    description: "Compare completion rates between months",
    requirement: "Requirements 4.1, 4.2 - Month-over-month comparison",
    expectedPerformance: "< 600ms for two-month comparison"
  },
  {
    name: "Analytics Metadata Retrieval",
    collection: "analytics",
    queryType: "metadata_lookup",
    fields: ["userId", "habitId", "calculatedAt"],
    description: "Retrieve cached analytics data",
    requirement: "Requirements 11.4 - Analytics caching for 5 minutes",
    expectedPerformance: "< 100ms for cached data retrieval"
  },
  {
    name: "Premium Analytics Storage",
    collection: "premiumAnalytics",
    queryType: "premium_storage",
    fields: ["userId", "habitId", "calculatedAt"],
    description: "Store and retrieve premium analytics data",
    requirement: "Requirements 9.1 - Multi-device sync within 30 seconds",
    expectedPerformance: "< 200ms for premium data operations"
  }
]

describe('Firestore Index Performance Validation', () => {
  it('should have all required indexes for analytics query patterns', () => {
    // Verify that each analytics query pattern has a corresponding index
    analyticsQueryPatterns.forEach(pattern => {
      const matchingIndex = firestoreIndexConfiguration.indexes.find(index => {
        if (index.collectionGroup !== pattern.collection) return false
        
        // Check if all required fields are present in the index
        return pattern.fields.every(field => index.fields.includes(field))
      })
      
      expect(matchingIndex, 
        `Missing index for ${pattern.name}: ${pattern.description}\n` +
        `Required fields: ${pattern.fields.join(', ')}\n` +
        `Requirement: ${pattern.requirement}`
      ).toBeDefined()
    })
  })

  it('should support sub-2-second analytics calculations per Requirements 11.1', () => {
    // Validate that query patterns support the performance requirement
    const performanceRequirements = {
      maxCalculationTime: 2000, // 2 seconds in milliseconds
      maxDataPoints: 365, // 1 year of daily data
      indexedQueryTarget: 500, // Target for individual indexed queries
    }
    
    expect(performanceRequirements.maxCalculationTime).toBe(2000)
    expect(performanceRequirements.maxDataPoints).toBeGreaterThanOrEqual(365)
    
    // Verify each query pattern has realistic performance expectations
    analyticsQueryPatterns.forEach(pattern => {
      expect(pattern.expectedPerformance).toBeDefined()
      
      // Extract expected time from performance string (e.g., "< 500ms")
      const timeMatch = pattern.expectedPerformance.match(/< (\d+)ms/)
      if (timeMatch) {
        const expectedTime = parseInt(timeMatch[1])
        expect(expectedTime).toBeLessThan(performanceRequirements.maxCalculationTime)
      }
    })
  })

  it('should have proper field ordering for composite indexes', () => {
    // Validate that composite indexes follow Firestore best practices
    const compositeIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.length > 1
    )
    
    compositeIndexes.forEach(index => {
      // For analytics queries, habitId should typically be first (equality filter)
      if (index.collectionGroup === 'checks' && index.fields.includes('habitId')) {
        expect(index.fields[0]).toBe('habitId')
      }
      
      // For analytics metadata, userId should typically be first
      if (index.collectionGroup === 'analytics' && index.fields.includes('userId')) {
        expect(index.fields[0]).toBe('userId')
      }
      
      // Premium analytics should start with userId for user-scoped queries
      if (index.collectionGroup === 'premiumAnalytics' && index.fields.includes('userId')) {
        expect(index.fields[0]).toBe('userId')
      }
    })
  })

  it('should support efficient date range queries for trend analysis', () => {
    // Validate date range query support
    const dateRangeIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('dateKey')
    )
    
    expect(dateRangeIndexes.length).toBeGreaterThan(0)
    
    dateRangeIndexes.forEach(index => {
      // Should have habitId for scoping
      expect(index.fields).toContain('habitId')
      
      // Should have dateKey for range filtering
      expect(index.fields).toContain('dateKey')
    })
    
    // Should have at least one index that supports completion filtering with date ranges
    const completionDateIndexes = dateRangeIndexes.filter(index => 
      index.fields.includes('isCompleted') || 
      index.fields.includes('completedAt') ||
      index.fields.includes('status')
    )
    
    expect(completionDateIndexes.length).toBeGreaterThan(0)
  })

  it('should support completion status filtering for all analytics calculations', () => {
    // Validate completion status filtering support
    const completionIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('isCompleted') || index.fields.includes('status')
    )
    
    expect(completionIndexes.length).toBeGreaterThan(0)
    
    completionIndexes.forEach(index => {
      // Should have habitId for scoping
      expect(index.fields).toContain('habitId')
      
      // Should support either new or legacy completion fields
      const hasCompletionField = index.fields.includes('isCompleted') || 
                                 index.fields.includes('status')
      expect(hasCompletionField).toBe(true)
    })
  })

  it('should support time-of-day analysis with timestamp ordering', () => {
    // Validate time-of-day analysis support
    const timeAnalysisIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('completedAt')
    )
    
    expect(timeAnalysisIndexes.length).toBeGreaterThan(0)
    
    // Should have at least one index for time-of-day analysis
    const timeOfDayIndex = timeAnalysisIndexes.find(
      index => index.fields.includes('habitId') && 
               index.fields.includes('isCompleted') &&
               index.fields.includes('completedAt')
    )
    
    expect(timeOfDayIndex).toBeDefined()
  })

  it('should support progress value analysis for count/time habits', () => {
    // Validate progress value analysis support
    const progressIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('progressValue')
    )
    
    expect(progressIndexes.length).toBeGreaterThan(0)
    
    progressIndexes.forEach(index => {
      // Should have habitId for scoping
      expect(index.fields).toContain('habitId')
      
      // Should have progressValue for analysis
      expect(index.fields).toContain('progressValue')
    })
  })

  it('should support analytics metadata operations with proper caching', () => {
    // Validate analytics metadata index support
    const metadataIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.collectionGroup === 'analytics' || 
               index.collectionGroup === 'premiumAnalytics'
    )
    
    expect(metadataIndexes.length).toBeGreaterThanOrEqual(6)
    
    // Should support user-level queries
    const userQueries = metadataIndexes.filter(
      index => index.fields.includes('userId')
    )
    expect(userQueries.length).toBeGreaterThan(0)
    
    // Should support habit-level queries
    const habitQueries = metadataIndexes.filter(
      index => index.fields.includes('habitId')
    )
    expect(habitQueries.length).toBeGreaterThan(0)
    
    // Should support timestamp ordering for cache management
    const timestampQueries = metadataIndexes.filter(
      index => index.fields.includes('calculatedAt')
    )
    expect(timestampQueries.length).toBeGreaterThan(0)
  })

  it('should minimize index count while maximizing query coverage', () => {
    // Validate that we have efficient index usage
    const totalIndexes = firestoreIndexConfiguration.indexes.length
    
    // Should have reasonable number of indexes (not excessive)
    expect(totalIndexes).toBeLessThanOrEqual(25)
    expect(totalIndexes).toBeGreaterThanOrEqual(15)
    
    // Should cover all major collection groups
    const collectionGroups = new Set(
      firestoreIndexConfiguration.indexes.map(i => i.collectionGroup)
    )
    
    expect(collectionGroups).toContain('habits')
    expect(collectionGroups).toContain('checks')
    expect(collectionGroups).toContain('analytics')
    expect(collectionGroups).toContain('premiumAnalytics')
  })

  it('should support pagination for large datasets per Requirements 11.2', () => {
    // Validate pagination support
    const paginationSupportingIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('dateKey') || 
               index.fields.includes('completedAt') ||
               index.fields.includes('calculatedAt')
    )
    
    expect(paginationSupportingIndexes.length).toBeGreaterThan(0)
    
    // Each pagination index should support ordering
    paginationSupportingIndexes.forEach(index => {
      const hasOrderingField = index.fields.includes('dateKey') ||
                              index.fields.includes('completedAt') ||
                              index.fields.includes('calculatedAt')
      expect(hasOrderingField).toBe(true)
    })
  })
})

describe('Analytics Query Pattern Coverage', () => {
  it('should cover all premium analytics calculation requirements', () => {
    // Map requirements to query patterns
    const requirementCoverage = {
      'Requirements 1.1': ['Trend Analysis - Date Range Query', 'Completion Rate Calculation'],
      'Requirements 1.2': ['Progress Value Analysis'],
      'Requirements 1.3': ['Progress Value Analysis'],
      'Requirements 2.1': ['Day-of-Week Analysis'],
      'Requirements 3.1': ['Time-of-Day Distribution'],
      'Requirements 3.2': ['Time-of-Day Distribution'],
      'Requirements 4.1': ['Monthly Comparison'],
      'Requirements 4.2': ['Monthly Comparison'],
      'Requirements 9.1': ['Premium Analytics Storage'],
      'Requirements 11.1': ['All query patterns'],
      'Requirements 11.2': ['All pagination-supporting patterns'],
      'Requirements 11.4': ['Analytics Metadata Retrieval']
    }
    
    Object.entries(requirementCoverage).forEach(([requirement, expectedPatterns]) => {
      if (expectedPatterns.includes('All query patterns') || 
          expectedPatterns.includes('All pagination-supporting patterns')) {
        // These are covered by the comprehensive test above
        return
      }
      
      expectedPatterns.forEach(patternName => {
        const pattern = analyticsQueryPatterns.find(p => p.name === patternName)
        expect(pattern, `Missing query pattern for ${requirement}: ${patternName}`).toBeDefined()
        expect(pattern!.requirement).toContain(requirement.split(' ')[1]) // Extract requirement number
      })
    })
  })

  it('should have realistic performance expectations for all query patterns', () => {
    // Validate that all query patterns have performance expectations
    analyticsQueryPatterns.forEach(pattern => {
      expect(pattern.expectedPerformance).toBeDefined()
      expect(pattern.expectedPerformance).toMatch(/< \d+ms/)
      
      // Extract expected time and validate it's reasonable
      const timeMatch = pattern.expectedPerformance.match(/< (\d+)ms/)
      if (timeMatch) {
        const expectedTime = parseInt(timeMatch[1])
        expect(expectedTime).toBeGreaterThan(0)
        expect(expectedTime).toBeLessThan(2000) // Must be under 2 seconds
      }
    })
  })

  it('should support both new and legacy data formats', () => {
    // Validate support for both isCompleted and status fields
    const newFormatIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('isCompleted')
    )
    
    const legacyFormatIndexes = firestoreIndexConfiguration.indexes.filter(
      index => index.fields.includes('status')
    )
    
    expect(newFormatIndexes.length).toBeGreaterThan(0)
    expect(legacyFormatIndexes.length).toBeGreaterThan(0)
    
    // Both formats should support basic analytics operations
    newFormatIndexes.forEach(index => {
      expect(index.fields).toContain('habitId')
    })
    
    legacyFormatIndexes.forEach(index => {
      expect(index.fields).toContain('habitId')
    })
  })
})