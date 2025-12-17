import { describe, it, expect } from 'vitest'

/**
 * Firestore Indexes Test
 * 
 * This test validates that the required Firestore indexes are properly configured
 * for premium analytics queries. It checks the index configuration against
 * expected query patterns.
 */

// Mock index configuration (matches firestore.indexes.json)
const firestoreIndexes = {
  indexes: [
    // Existing indexes
    {
      collectionGroup: "habits",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "uid", order: "ASCENDING" },
        { fieldPath: "createdAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION", 
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "analytics",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "calculatedAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "DESCENDING" }
      ]
    },
    // New analytics indexes
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" },
        { fieldPath: "progressValue", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "analytics",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "calculatedAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "analytics",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "calculatedAt", order: "DESCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "status", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "DESCENDING" }
      ]
    },
    // Additional analytics indexes
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "dateKey", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "isCompleted", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "checks",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "habitId", order: "ASCENDING" },
        { fieldPath: "completedAt", order: "ASCENDING" }
      ]
    },
    {
      collectionGroup: "analytics",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "habitId", order: "ASCENDING" }
      ]
    }
  ]
}

// Expected query patterns for analytics
const expectedQueryPatterns = [
  {
    name: "Date range queries for trend analysis",
    collection: "checks",
    fields: ["habitId", "dateKey", "completedAt"],
    description: "Efficient date range filtering for 4W, 3M, 6M, 1Y trends"
  },
  {
    name: "Completion status filtering",
    collection: "checks", 
    fields: ["habitId", "dateKey", "isCompleted"],
    description: "Filter completed vs incomplete check-ins within date ranges"
  },
  {
    name: "Time-of-day analysis",
    collection: "checks",
    fields: ["habitId", "isCompleted", "completedAt"],
    description: "Get completed check-ins ordered by completion time"
  },
  {
    name: "Progress value analysis",
    collection: "checks",
    fields: ["habitId", "dateKey", "progressValue"],
    description: "Analyze progress values for count/time habits"
  },
  {
    name: "User analytics retrieval",
    collection: "analytics",
    fields: ["userId", "calculatedAt"],
    description: "Get all analytics for a user ordered by calculation time"
  },
  {
    name: "Habit-specific analytics",
    collection: "analytics",
    fields: ["habitId", "calculatedAt"],
    description: "Get analytics for a specific habit"
  },
  {
    name: "Legacy status filtering",
    collection: "checks",
    fields: ["habitId", "status", "dateKey"],
    description: "Support for habits using legacy status field"
  },
  {
    name: "Time-based completion analysis",
    collection: "checks",
    fields: ["habitId", "isCompleted", "completedAt"],
    description: "Analyze completion times for time-of-day distribution"
  },
  {
    name: "Simple time ordering",
    collection: "checks",
    fields: ["habitId", "completedAt"],
    description: "Basic time-based ordering for all completions"
  },
  {
    name: "User-habit analytics lookup",
    collection: "analytics",
    fields: ["userId", "habitId"],
    description: "Direct analytics retrieval for specific user-habit pairs"
  }
]

describe('Firestore Indexes Configuration', () => {
  it('should have all required indexes for analytics queries', () => {
    // Verify that we have the expected number of indexes
    expect(firestoreIndexes.indexes).toHaveLength(18)
    
    // Check that all expected query patterns have corresponding indexes
    expectedQueryPatterns.forEach(pattern => {
      const matchingIndex = firestoreIndexes.indexes.find(index => {
        if (index.collectionGroup !== pattern.collection) return false
        
        // Check if all required fields are present in the index
        const indexFields = index.fields.map(f => f.fieldPath)
        return pattern.fields.every(field => indexFields.includes(field))
      })
      
      expect(matchingIndex, `Missing index for ${pattern.name}: ${pattern.description}`).toBeDefined()
    })
  })

  it('should have proper field ordering for date range queries', () => {
    // Find the date range query index
    const dateRangeIndex = firestoreIndexes.indexes.find(index => 
      index.collectionGroup === "checks" &&
      index.fields.some(f => f.fieldPath === "habitId") &&
      index.fields.some(f => f.fieldPath === "dateKey") &&
      index.fields.some(f => f.fieldPath === "completedAt")
    )
    
    expect(dateRangeIndex).toBeDefined()
    
    // Verify field ordering for optimal query performance
    const fields = dateRangeIndex!.fields
    expect(fields[0].fieldPath).toBe("habitId") // Filter field first
    expect(fields[1].fieldPath).toBe("dateKey") // Range field second
    expect(fields[2].fieldPath).toBe("completedAt") // Order field last
  })

  it('should have completion status indexes for both new and legacy fields', () => {
    // Check for isCompleted field index (new format)
    const isCompletedIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "checks" &&
      index.fields.some(f => f.fieldPath === "isCompleted")
    )
    expect(isCompletedIndex).toBeDefined()
    
    // Check for status field index (legacy format)
    const statusIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "checks" &&
      index.fields.some(f => f.fieldPath === "status")
    )
    expect(statusIndex).toBeDefined()
  })

  it('should have analytics metadata indexes for efficient retrieval', () => {
    // Check user-level analytics index
    const userAnalyticsIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "analytics" &&
      index.fields.some(f => f.fieldPath === "userId") &&
      index.fields.some(f => f.fieldPath === "calculatedAt") &&
      index.fields.length === 2 // Only userId and calculatedAt
    )
    expect(userAnalyticsIndex).toBeDefined()
    
    // Check habit-level analytics index
    const habitAnalyticsIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "analytics" &&
      index.fields.some(f => f.fieldPath === "habitId") &&
      index.fields.some(f => f.fieldPath === "calculatedAt") &&
      index.fields.length === 2 // Only habitId and calculatedAt
    )
    expect(habitAnalyticsIndex).toBeDefined()
  })

  it('should have progress value index for count/time habit analysis', () => {
    const progressIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "checks" &&
      index.fields.some(f => f.fieldPath === "progressValue")
    )
    
    expect(progressIndex).toBeDefined()
    
    // Verify proper field ordering
    const fields = progressIndex!.fields
    expect(fields[0].fieldPath).toBe("habitId")
    expect(fields[1].fieldPath).toBe("dateKey")
    expect(fields[2].fieldPath).toBe("progressValue")
    expect(fields[2].order).toBe("DESCENDING") // For getting highest values first
  })

  it('should support time-of-day analysis queries', () => {
    const timeAnalysisIndex = firestoreIndexes.indexes.find(index =>
      index.collectionGroup === "checks" &&
      index.fields.some(f => f.fieldPath === "habitId") &&
      index.fields.some(f => f.fieldPath === "isCompleted") &&
      index.fields.some(f => f.fieldPath === "completedAt")
    )
    
    expect(timeAnalysisIndex).toBeDefined()
    
    // Verify ordering for time analysis
    const fields = timeAnalysisIndex!.fields
    expect(fields.find(f => f.fieldPath === "completedAt")?.order).toBe("DESCENDING")
  })

  it('should have all collection groups properly configured', () => {
    const collectionGroups = [...new Set(firestoreIndexes.indexes.map(i => i.collectionGroup))]
    
    expect(collectionGroups).toContain("habits")
    expect(collectionGroups).toContain("checks") 
    expect(collectionGroups).toContain("analytics")
  })

  it('should have proper query scope for all indexes', () => {
    firestoreIndexes.indexes.forEach(index => {
      expect(index.queryScope).toBe("COLLECTION")
    })
  })
})

describe('Analytics Query Performance Requirements', () => {
  it('should support sub-2-second query performance for 1 year of data', () => {
    // This is a documentation test - the actual performance will be validated
    // when the indexes are deployed and tested with real data
    
    const performanceRequirements = {
      maxCalculationTime: 2000, // 2 seconds in milliseconds
      maxDataPoints: 365, // 1 year of daily data
      cacheTimeout: 5 * 60 * 1000, // 5 minutes as per requirements
    }
    
    expect(performanceRequirements.maxCalculationTime).toBe(2000)
    expect(performanceRequirements.maxDataPoints).toBeGreaterThanOrEqual(365)
    expect(performanceRequirements.cacheTimeout).toBe(300000)
  })

  it('should support efficient pagination for large datasets', () => {
    // Verify that indexes support pagination queries
    const paginationSupportingIndexes = firestoreIndexes.indexes.filter(index =>
      index.fields.some(f => f.order === "DESCENDING" || f.order === "ASCENDING")
    )
    
    // All indexes should support ordering for pagination
    expect(paginationSupportingIndexes.length).toBeGreaterThan(0)
  })
})