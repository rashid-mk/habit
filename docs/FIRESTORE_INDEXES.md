# Firestore Indexes Documentation

This document explains the Firestore indexes required for optimal performance of the premium analytics feature.

## Index Categories

### 1. Core Application Indexes

#### Habits Collection
- **Index**: `uid (ASC) + createdAt (DESC)`
- **Purpose**: Fetch user's habits ordered by creation date
- **Query Pattern**: `habits.where('uid', '==', userId).orderBy('createdAt', 'desc')`

#### Basic Checks Queries
- **Index**: `habitId (ASC) + dateKey (DESC)`
- **Purpose**: Get check-ins for a habit ordered by date
- **Query Pattern**: `checks.where('habitId', '==', habitId).orderBy('dateKey', 'desc')`

- **Index**: `habitId (ASC) + completedAt (DESC)`
- **Purpose**: Get completed check-ins ordered by completion time
- **Query Pattern**: `checks.where('habitId', '==', habitId).orderBy('completedAt', 'desc')`

### 2. Premium Analytics Indexes

#### Date Range Queries for Analytics Calculations
- **Index**: `habitId (ASC) + dateKey (ASC) + completedAt (ASC)`
- **Purpose**: Efficient date range filtering for trend analysis
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('dateKey', '>=', startDate).where('dateKey', '<=', endDate).orderBy('completedAt')`
- **Analytics Use**: Time period calculations (4W, 3M, 6M, 1Y trends)

#### Enhanced Date Range Queries
- **Index**: `habitId (ASC) + dateKey (ASC) + isCompleted (ASC)`
- **Purpose**: Filter by completion status within date ranges
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('dateKey', '>=', startDate).where('dateKey', '<=', endDate).where('isCompleted', '==', true)`
- **Analytics Use**: Completion rate calculations with date filtering

- **Index**: `habitId (ASC) + isCompleted (ASC) + dateKey (ASC)`
- **Purpose**: Filter completed items then sort by date
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('isCompleted', '==', true).orderBy('dateKey')`
- **Analytics Use**: Day-of-week analysis, monthly comparisons

#### Completion Status Filtering
- **Index**: `habitId (ASC) + dateKey (ASC) + isCompleted (ASC)`
- **Purpose**: Filter completed vs incomplete check-ins within date ranges
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('dateKey', '>=', startDate).where('isCompleted', '==', true)`
- **Analytics Use**: Completion rate calculations, day-of-week analysis

- **Index**: `habitId (ASC) + isCompleted (ASC) + completedAt (DESC)`
- **Purpose**: Get completed check-ins ordered by completion time
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('isCompleted', '==', true).orderBy('completedAt', 'desc')`
- **Analytics Use**: Time-of-day distribution analysis

- **Index**: `habitId (ASC) + status (ASC) + dateKey (DESC)`
- **Purpose**: Filter by legacy status field for backward compatibility
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('status', '==', 'done').orderBy('dateKey', 'desc')`
- **Analytics Use**: Support for habits using legacy status field

#### Progress Value Queries
- **Index**: `habitId (ASC) + dateKey (ASC) + progressValue (DESC)`
- **Purpose**: Analyze progress values for count/time habits
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('dateKey', '>=', startDate).orderBy('progressValue', 'desc')`
- **Analytics Use**: Average progress calculations, trend analysis for count/time habits

#### Analytics Metadata Queries
- **Index**: `userId (ASC) + calculatedAt (DESC)`
- **Purpose**: Get all analytics for a user ordered by calculation time
- **Query Pattern**: `analytics.where('userId', '==', userId).orderBy('calculatedAt', 'desc')`
- **Analytics Use**: Fetch all user analytics, cache management

- **Index**: `habitId (ASC) + calculatedAt (DESC)`
- **Purpose**: Get analytics for a specific habit ordered by calculation time
- **Query Pattern**: `analytics.where('habitId', '==', habitId).orderBy('calculatedAt', 'desc')`
- **Analytics Use**: Habit-specific analytics retrieval

- **Index**: `userId (ASC) + habitId (ASC)`
- **Purpose**: Efficient lookup of analytics by user and habit combination
- **Query Pattern**: `analytics.where('userId', '==', userId).where('habitId', '==', habitId)`
- **Analytics Use**: Direct analytics retrieval for specific user-habit pairs

#### Premium Analytics Collection Indexes
- **Index**: `userId (ASC) + habitId (ASC) + calculatedAt (DESC)`
- **Purpose**: Comprehensive analytics lookup with timestamp ordering
- **Query Pattern**: `premiumAnalytics.where('userId', '==', userId).where('habitId', '==', habitId).orderBy('calculatedAt', 'desc')`
- **Analytics Use**: Primary analytics data retrieval with versioning support

- **Index**: `userId (ASC) + calculatedAt (DESC)`
- **Purpose**: Get all premium analytics for a user
- **Query Pattern**: `premiumAnalytics.where('userId', '==', userId).orderBy('calculatedAt', 'desc')`
- **Analytics Use**: User-level analytics dashboard loading

- **Index**: `habitId (ASC) + calculatedAt (DESC)`
- **Purpose**: Get premium analytics for a specific habit
- **Query Pattern**: `premiumAnalytics.where('habitId', '==', habitId).orderBy('calculatedAt', 'desc')`
- **Analytics Use**: Habit-specific analytics with cache invalidation

#### Enhanced Progress Analysis
- **Index**: `habitId (ASC) + progressValue (DESC)`
- **Purpose**: Analyze progress values without date constraints
- **Query Pattern**: `checks.where('habitId', '==', habitId).orderBy('progressValue', 'desc')`
- **Analytics Use**: Quick progress trend analysis, finding peak performance values

- **Index**: `habitId (ASC) + dateKey (ASC) + status (ASC)`
- **Purpose**: Legacy status field support with date ordering
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('status', '==', 'done').orderBy('dateKey')`
- **Analytics Use**: Backward compatibility for older habit data

#### Time-Based Analysis Queries
- **Index**: `habitId (ASC) + isCompleted (ASC) + completedAt (ASC)`
- **Purpose**: Analyze completion times for time-of-day distribution
- **Query Pattern**: `checks.where('habitId', '==', habitId).where('isCompleted', '==', true).orderBy('completedAt')`
- **Analytics Use**: Time-of-day analysis, peak hour identification

- **Index**: `habitId (ASC) + completedAt (ASC)`
- **Purpose**: Simple time-based ordering for all completions
- **Query Pattern**: `checks.where('habitId', '==', habitId).orderBy('completedAt')`
- **Analytics Use**: Timeline analysis, chronological data processing

## Performance Considerations

### Query Optimization
1. **Composite Indexes**: All analytics queries use composite indexes to avoid full collection scans
2. **Date Range Efficiency**: Date range queries are optimized with proper field ordering
3. **Completion Filtering**: Separate indexes for different completion status fields (isCompleted vs status)
4. **Progress Analysis**: Dedicated index for progress value queries on count/time habits

### Index Size Management
- Indexes are designed to be minimal while covering all query patterns
- No redundant indexes that would increase storage costs
- Proper field ordering to maximize index reuse

### Cache Strategy
- Analytics calculations cache results for 5 minutes (per requirements 11.4)
- Indexes support efficient cache invalidation queries
- Offline fallback supported through local caching

## Query Examples

### Trend Analysis Query
```javascript
// Get completions for 4-week trend analysis
const fourWeeksAgo = dayjs().subtract(4, 'week').format('YYYY-MM-DD')
const today = dayjs().format('YYYY-MM-DD')

const query = db.collection('users')
  .doc(userId)
  .collection('habits')
  .doc(habitId)
  .collection('checks')
  .where('dateKey', '>=', fourWeeksAgo)
  .where('dateKey', '<=', today)
  .orderBy('dateKey', 'asc')
```
**Uses Index**: `habitId + dateKey (ASC) + completedAt (ASC)`

### Completion Rate Query
```javascript
// Get completed check-ins for completion rate calculation
const query = db.collection('users')
  .doc(userId)
  .collection('habits')
  .doc(habitId)
  .collection('checks')
  .where('dateKey', '>=', startDate)
  .where('dateKey', '<=', endDate)
  .where('isCompleted', '==', true)
```
**Uses Index**: `habitId + dateKey (ASC) + isCompleted (ASC)`

### Time-of-Day Analysis Query
```javascript
// Get completed check-ins with timestamps for time analysis
const query = db.collection('users')
  .doc(userId)
  .collection('habits')
  .doc(habitId)
  .collection('checks')
  .where('isCompleted', '==', true)
  .orderBy('completedAt', 'desc')
  .limit(100)
```
**Uses Index**: `habitId + isCompleted (ASC) + completedAt (DESC)`

## Deployment Notes

### Index Creation
- Indexes are automatically created when deploying Firestore rules
- Use `firebase deploy --only firestore:indexes` to deploy only indexes
- Monitor index creation progress in Firebase Console

### Performance Monitoring
- Monitor query performance in Firebase Console
- Set up alerts for slow queries (>1 second)
- Review index usage statistics monthly

### Cost Optimization
- Indexes consume storage space and write operations
- Monitor index size and usage in Firebase Console
- Remove unused indexes during maintenance windows

## Troubleshooting

### Common Issues
1. **Missing Index Error**: Add the required composite index to firestore.indexes.json
2. **Slow Queries**: Check if queries are using the correct indexes
3. **Index Build Failures**: Ensure field names match exactly between code and index definition

### Performance Targets
- Analytics calculations: < 2 seconds for 1 year of data (Requirement 11.1)
- Query response time: < 500ms for indexed queries
- Index build time: < 5 minutes for new indexes

## Maintenance

### Regular Tasks
1. Review query performance monthly
2. Monitor index usage and remove unused indexes
3. Update indexes when adding new query patterns
4. Test index performance with production data volumes

### Capacity Planning
- Plan for 1000+ check-ins per habit for performance testing
- Consider index size growth with user base expansion
- Monitor Firestore quotas and limits