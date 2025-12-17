# Premium Analytics Design Document

## Overview

The Premium Analytics feature provides advanced insights and visualizations for habit tracking data, available exclusively to premium subscribers. The system analyzes historical completion data to generate trends, patterns, predictions, and actionable insights. The architecture emphasizes performance, real-time synchronization, and an intuitive user experience that justifies premium pricing.

### Key Design Goals

- **Performance**: Analytics calculations complete within 2 seconds for up to 1 year of data
- **Accuracy**: All calculations are mathematically correct and verifiable
- **Scalability**: System handles growing datasets without performance degradation
- **User Experience**: Complex data presented in digestible, actionable formats
- **Premium Value**: Features clearly demonstrate value proposition for paid subscriptions

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Analytics    │  │ Chart        │  │ Export       │      │
│  │ Dashboard    │  │ Components   │  │ Interface    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Analytics    │  │ Insight      │  │ Access       │      │
│  │ Calculator   │  │ Generator    │  │ Control      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Firestore    │  │ Cache        │  │ Sync         │      │
│  │ Repository   │  │ Manager      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Presentation Layer**
- Analytics Dashboard: Main container for all analytics sections
- Chart Components: Reusable visualization components (line, bar, pie, heatmap)
- Export Interface: UI for data export functionality

**Business Logic Layer**
- Analytics Calculator: Core calculation engine for all metrics
- Insight Generator: Pattern detection and recommendation engine
- Access Control: Premium subscription verification

**Data Layer**
- Firestore Repository: Database operations for habit and analytics data
- Cache Manager: In-memory caching for performance optimization
- Sync Service: Real-time multi-device synchronization

## Components and Interfaces

### 1. Analytics Calculator

**Purpose**: Performs all statistical calculations for analytics metrics

**Interface**:
```typescript
interface AnalyticsCalculator {
  calculateCompletionRate(
    completions: Completion[],
    startDate: Date,
    endDate: Date
  ): number;
  
  calculateTrend(
    completions: Completion[],
    period: TimePeriod
  ): TrendData;
  
  calculateDayOfWeekStats(
    completions: Completion[]
  ): DayOfWeekStats;
  
  calculateTimeOfDayDistribution(
    completions: Completion[]
  ): TimeDistribution;
  
  calculateMonthComparison(
    currentMonth: Completion[],
    previousMonth: Completion[]
  ): MonthComparison;
}
```

**Key Methods**:
- `calculateCompletionRate`: Returns percentage of completed vs scheduled occurrences
- `calculateTrend`: Analyzes completion patterns over specified time period
- `calculateDayOfWeekStats`: Groups completions by day and calculates rates
- `calculateTimeOfDayDistribution`: Analyzes completion times by hour
- `calculateMonthComparison`: Compares two months and calculates percentage change

### 2. Insight Generator

**Purpose**: Detects patterns and generates actionable recommendations

**Interface**:
```typescript
interface InsightGenerator {
  generateInsights(
    completions: Completion[],
    habit: Habit
  ): Insight[];
  
  detectDayOfWeekPattern(
    stats: DayOfWeekStats
  ): DayPattern | null;
  
  detectTimeOfDayPattern(
    distribution: TimeDistribution
  ): TimePattern | null;
  
  calculateConfidenceLevel(
    dataPoints: number,
    patternStrength: number
  ): ConfidenceLevel;
}
```

**Insight Types**:
- Day-of-week likelihood predictions
- Optimal timing recommendations
- Weekend vs weekday behavior patterns
- Early-day completion correlations

### 3. Chart Components

**Purpose**: Render interactive, responsive data visualizations

**Components**:
- `TrendLineChart`: Line graph with gradient fills for trend analysis
- `DayOfWeekBarChart`: Horizontal bar chart for day performance
- `TimeOfDayHeatmap`: 24-hour heatmap for completion times
- `CompletionPieChart`: Pie chart for completion distribution
- `CalendarHeatmap`: Calendar-style heatmap for long-term patterns
- `ProgressChart`: Line/area chart for count/time habit progress

**Common Interface**:
```typescript
interface ChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  interactive?: boolean;
  responsive?: boolean;
  theme?: ChartTheme;
}
```

### 4. Export Service

**Purpose**: Generate and deliver data exports in multiple formats

**Interface**:
```typescript
interface ExportService {
  exportToCSV(
    habits: Habit[],
    completions: Completion[],
    dateRange: DateRange
  ): Promise<Blob>;
  
  exportToJSON(
    habits: Habit[],
    completions: Completion[],
    dateRange: DateRange
  ): Promise<Blob>;
  
  exportToPDF(
    analytics: AnalyticsData,
    charts: ChartImage[],
    insights: Insight[]
  ): Promise<Blob>;
  
  sendViaEmail(
    file: Blob,
    format: ExportFormat,
    email: string
  ): Promise<void>;
}
```

### 5. Access Control Service

**Purpose**: Verify premium subscription status and gate features

**Interface**:
```typescript
interface AccessControlService {
  isPremiumUser(userId: string): Promise<boolean>;
  
  checkFeatureAccess(
    userId: string,
    feature: PremiumFeature
  ): Promise<boolean>;
  
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>;
  
  handleSubscriptionExpiry(userId: string): Promise<void>;
}
```

### 6. Sync Service

**Purpose**: Synchronize analytics data across multiple devices

**Interface**:
```typescript
interface SyncService {
  syncAnalytics(
    userId: string,
    habitId: string,
    analytics: AnalyticsData
  ): Promise<void>;
  
  subscribeToAnalyticsUpdates(
    userId: string,
    callback: (analytics: AnalyticsData) => void
  ): Unsubscribe;
  
  resolveConflict(
    local: AnalyticsData,
    remote: AnalyticsData
  ): AnalyticsData;
  
  cacheAnalyticsOffline(
    userId: string,
    analytics: AnalyticsData
  ): void;
}
```

## Data Models

### Analytics Data

```typescript
interface AnalyticsData {
  habitId: string;
  userId: string;
  calculatedAt: Timestamp;
  
  // Trend data
  trends: {
    fourWeeks: TrendData;
    threeMonths: TrendData;
    sixMonths: TrendData;
    oneYear: TrendData;
  };
  
  // Day of week statistics
  dayOfWeekStats: DayOfWeekStats;
  
  // Time of day distribution
  timeOfDayDistribution: TimeDistribution;
  
  // Monthly comparison
  monthComparison: MonthComparison;
  
  // Generated insights
  insights: Insight[];
  
  // Metadata
  dataPointCount: number;
  oldestDataPoint: Timestamp;
  newestDataPoint: Timestamp;
}
```

### Trend Data

```typescript
interface TrendData {
  period: TimePeriod;
  completionRate: number;
  averageProgress?: number; // For count/time habits
  percentageChange: number;
  direction: 'up' | 'down' | 'stable';
  dataPoints: DataPoint[];
}
```

### Day of Week Stats

```typescript
interface DayOfWeekStats {
  monday: DayStats;
  tuesday: DayStats;
  wednesday: DayStats;
  thursday: DayStats;
  friday: DayStats;
  saturday: DayStats;
  sunday: DayStats;
  bestDay: DayOfWeek;
  worstDay: DayOfWeek;
}

interface DayStats {
  completionRate: number;
  totalCompletions: number;
  totalScheduled: number;
}
```

### Time Distribution

```typescript
interface TimeDistribution {
  hourlyDistribution: Map<number, number>; // hour (0-23) -> completion count
  peakHours: number[];
  optimalReminderTimes: number[];
}
```

### Insight

```typescript
interface Insight {
  id: string;
  type: InsightType;
  message: string;
  confidence: 'high' | 'medium' | 'low';
  dataSupport: number; // Number of data points supporting insight
  actionable: boolean;
  recommendation?: string;
}

type InsightType = 
  | 'day-of-week-pattern'
  | 'time-of-day-pattern'
  | 'weekend-behavior'
  | 'timing-impact'
  | 'streak-correlation';
```

### Export Data

```typescript
interface ExportData {
  format: 'csv' | 'json' | 'pdf';
  dateRange: DateRange;
  habits: Habit[];
  completions: Completion[];
  analytics: AnalyticsData[];
  generatedAt: Timestamp;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Completion Rate Calculation Accuracy

*For any* set of habit completions and a time period, the calculated completion rate should equal the number of completions divided by the number of scheduled occurrences, expressed as a percentage between 0 and 100.

**Validates: Requirements 1.1**

### Property 2: Average Progress Calculation for Count Habits

*For any* count-based habit with progress values, the calculated average daily progress should equal the sum of all progress values divided by the number of days in the period.

**Validates: Requirements 1.2**

### Property 3: Average Duration Calculation for Time Habits

*For any* time-based habit with duration values, the calculated average daily duration should equal the sum of all durations divided by the number of days in the period.

**Validates: Requirements 1.3**

### Property 4: Percentage Change Calculation

*For any* two time periods with completion rates, the calculated percentage change should equal ((current - previous) / previous) × 100.

**Validates: Requirements 1.4**

### Property 5: Positive Trend Indicator

*For any* trend comparison where the current period completion rate exceeds the previous period rate, the system should display a positive indicator.

**Validates: Requirements 1.5**

### Property 6: Negative Trend Indicator

*For any* trend comparison where the current period completion rate is less than the previous period rate, the system should display a negative indicator.

**Validates: Requirements 1.6**

### Property 7: Day-of-Week Completion Rate Calculation

*For any* set of completions, the completion rate for each day of the week should be calculated independently and correctly for all seven days.

**Validates: Requirements 2.1**

### Property 8: Best Day Identification

*For any* day-of-week statistics, the identified best day should have the highest completion rate among all seven days.

**Validates: Requirements 2.2**

### Property 9: Worst Day Identification

*For any* day-of-week statistics, the identified worst day should have the lowest completion rate among all seven days.

**Validates: Requirements 2.3**

### Property 10: Day Comparison Insight Generation

*For any* dataset with at least 4 weeks of data, comparative insights showing percentage differences between days should be generated.

**Validates: Requirements 2.4**

### Property 11: Hour Tracking Accuracy

*For any* habit completion with a timestamp, the recorded hour of day should match the hour component of the completion timestamp.

**Validates: Requirements 3.1**

### Property 12: Time Distribution Calculation

*For any* set of completions with timestamps, the distribution across 24-hour periods should correctly count completions for each hour (0-23).

**Validates: Requirements 3.2**

### Property 13: Peak Hour Identification

*For any* time distribution with at least 2 weeks of data, the identified peak hours should be the hour(s) with the highest completion counts.

**Validates: Requirements 3.3**

### Property 14: Optimal Reminder Time Recommendation

*For any* identified peak performance hours, the generated reminder time recommendations should align with those peak hours.

**Validates: Requirements 3.4**

### Property 15: Monthly Comparison Calculation

*For any* two complete months of data, the completion rates for both the current and previous month should be calculated correctly.

**Validates: Requirements 4.1**

### Property 16: Month-over-Month Percentage Change

*For any* two months with completion rates, the displayed percentage change should accurately reflect the difference between months.

**Validates: Requirements 4.2**

### Property 17: Significant Change Highlighting

*For any* month-over-month comparison where the absolute percentage change exceeds 20%, the change should be highlighted as significant.

**Validates: Requirements 4.3**

### Property 18: Insufficient Data Message

*For any* dataset with fewer than 2 complete months of data, the system should display an insufficient data message instead of monthly comparison.

**Validates: Requirements 4.5**

### Property 19: Insight Generation Threshold

*For any* habit with at least 4 weeks of historical data, predictive insights should be generated based on detected patterns.

**Validates: Requirements 5.1**

### Property 20: Day-of-Week Insight Generation

*For any* dataset where day-of-week patterns are detected (completion rate variance > 15% between days), insights about likelihood of completion on specific days should be generated.

**Validates: Requirements 5.2**

### Property 21: Time-of-Day Insight Generation

*For any* dataset where time-of-day patterns are detected (clear peak hours), insights about optimal completion times should be generated.

**Validates: Requirements 5.3**

### Property 22: Weekend Behavior Insight

*For any* dataset where weekend completion rates differ from weekday rates by more than 15%, insights about weekend behavior should be generated.

**Validates: Requirements 5.4**

### Property 23: CSV Export Column Completeness

*For any* habit data export to CSV format, the output should contain columns for date, habit name, completion status, progress value, and streak count.

**Validates: Requirements 7.2**

### Property 24: JSON Export Completeness

*For any* habit data export to JSON format, the output should include all habit metadata and historical completion records.

**Validates: Requirements 7.3**

### Property 25: PDF Export Content Completeness

*For any* habit data export to PDF format, the generated report should include charts, statistics, and insights.

**Validates: Requirements 7.4**

### Property 26: Date Range Export Filtering

*For any* custom date range selection, the exported data should only include completions within the specified start and end dates.

**Validates: Requirements 7.6**

### Property 27: Chart Interactivity

*For any* rendered chart, hovering over data points should display tooltips with detailed information about that data point.

**Validates: Requirements 8.6**

### Property 28: Chart Responsiveness

*For any* chart component, changing the viewport size should cause the chart to adapt its dimensions and layout appropriately.

**Validates: Requirements 8.7**

### Property 29: Sync Timing

*For any* analytics calculation on one device, the data should be synchronized to all other user devices within 30 seconds.

**Validates: Requirements 9.1**

### Property 30: Offline Caching and Sync

*For any* analytics data accessed while offline, the data should be cached locally and synchronized when connectivity is restored.

**Validates: Requirements 9.2**

### Property 31: Conflict Resolution by Timestamp

*For any* simultaneous updates on multiple devices, the conflict should be resolved by selecting the update with the most recent timestamp.

**Validates: Requirements 9.3**

### Property 32: Sync Status Display

*For any* sync operation, the sync status indicator should accurately reflect whether analytics are up to date, syncing, or failed.

**Validates: Requirements 9.4**

### Property 33: Sync Retry and Error Handling

*For any* failed sync operation, the system should retry automatically and display an error message only after retries are exhausted.

**Validates: Requirements 9.5**

### Property 34: Free User Content Blur

*For any* free user viewing analytics sections, the preview content should be displayed with a blur overlay.

**Validates: Requirements 10.1**

### Property 35: Free User Upgrade Prompt

*For any* free user attempting to access premium features, an upgrade prompt with feature descriptions should be displayed.

**Validates: Requirements 10.2**

### Property 36: Premium User Full Access

*For any* premium user viewing analytics sections, all content should be displayed without restrictions or overlays.

**Validates: Requirements 10.3**

### Property 37: Subscription Expiry Access Reversion

*For any* premium subscription that expires, the user's access should revert to free user level within 24 hours.

**Validates: Requirements 10.4**

### Property 38: Subscription Status Check

*For any* page load that renders premium content, the subscription status should be checked before rendering.

**Validates: Requirements 10.5**

### Property 39: Calculation Performance

*For any* analytics request with up to 1 year of data, all calculations should complete within 2 seconds.

**Validates: Requirements 11.1**

### Property 40: Pagination for Large Datasets

*For any* dataset exceeding a defined size threshold, pagination should be implemented to maintain performance.

**Validates: Requirements 11.2**

### Property 41: Progressive Chart Loading

*For any* complex chart rendering, basic content should be displayed before detailed elements are fully loaded.

**Validates: Requirements 11.3**

### Property 42: Analytics Caching

*For any* analytics calculation, the result should be cached for 5 minutes, and repeated requests within that time should use the cached data.

**Validates: Requirements 11.4**

### Property 43: Loading Indicator Display

*For any* analytics loading operation, skeleton screens or loading indicators should be displayed until data is ready.

**Validates: Requirements 11.5**

## Error Handling

### Calculation Errors

**Scenario**: Insufficient or invalid data for calculations
- **Handling**: Display user-friendly message indicating minimum data requirements
- **Example**: "Need at least 2 weeks of data for time-of-day analysis"

**Scenario**: Division by zero in percentage calculations
- **Handling**: Return 0 or null with appropriate messaging
- **Example**: "No scheduled occurrences in this period"

### Sync Errors

**Scenario**: Network connectivity loss during sync
- **Handling**: Cache data locally, retry when connection restored
- **User Feedback**: "Syncing when online" indicator

**Scenario**: Firestore write conflicts
- **Handling**: Use timestamp-based conflict resolution
- **Fallback**: Merge non-conflicting fields, prefer most recent for conflicts

### Export Errors

**Scenario**: PDF generation fails due to large dataset
- **Handling**: Implement chunking or reduce chart resolution
- **User Feedback**: "Generating large report, this may take a moment"

**Scenario**: Email delivery fails
- **Handling**: Provide download link as fallback
- **User Feedback**: "Email failed, download your export here"

### Access Control Errors

**Scenario**: Subscription status check fails
- **Handling**: Fail closed (deny access) and log error
- **User Feedback**: "Unable to verify subscription, please try again"

**Scenario**: Subscription expired but grace period active
- **Handling**: Allow access with expiration warning
- **User Feedback**: "Subscription expired, renew to continue access"

## Testing Strategy

### Unit Testing

**Focus Areas**:
- Analytics calculation functions (completion rates, averages, percentages)
- Insight generation logic
- Date range filtering
- Export format generation
- Access control checks

**Testing Approach**:
- Test calculation functions with known inputs and expected outputs
- Test edge cases (empty datasets, single data points, boundary dates)
- Test error conditions (invalid dates, null values)
- Mock external dependencies (Firestore, email service)

### Property-Based Testing

**Testing Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Test Requirements**:
- Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document
- Tag format: `// Feature: premium-analytics, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Key Properties to Test**:
1. Completion rate calculations always return values between 0 and 100
2. Average calculations correctly handle various dataset sizes
3. Percentage change calculations are mathematically correct
4. Day-of-week grouping correctly assigns completions to days
5. Time-of-day distribution correctly counts completions by hour
6. Export formats contain all required fields
7. Sync conflict resolution consistently prefers most recent timestamp
8. Access control correctly identifies premium vs free users

**Generator Strategies**:
- Generate random completion datasets with varying sizes
- Generate random timestamps across different time zones
- Generate random habit types (boolean, count, time)
- Generate random subscription statuses and expiry dates

### Integration Testing

**Focus Areas**:
- End-to-end analytics calculation and display flow
- Export generation and download flow
- Multi-device sync scenarios
- Premium access control flow

**Testing Approach**:
- Test complete user journeys from data entry to analytics viewing
- Test export generation with real chart rendering
- Test sync with multiple simulated devices
- Test subscription status changes and access updates

### Performance Testing

**Focus Areas**:
- Analytics calculation time with large datasets
- Chart rendering performance
- Export generation time
- Sync latency

**Performance Targets**:
- Analytics calculations: < 2 seconds for 1 year of data
- Chart rendering: < 500ms for initial display
- Export generation: < 30 seconds for full year PDF
- Sync latency: < 30 seconds across devices

**Testing Approach**:
- Generate large test datasets (1000+ completions)
- Measure calculation times with performance.now()
- Use Chrome DevTools for rendering performance
- Simulate network conditions for sync testing

## Implementation Notes

### Technology Stack

**Frontend**:
- React with TypeScript for type safety
- Chart.js or Recharts for data visualization
- date-fns for date manipulation
- React Query for data fetching and caching

**Backend**:
- Firebase Cloud Functions for complex calculations
- Firestore for data storage
- Firebase Cloud Storage for export file storage

**Export Libraries**:
- papaparse for CSV generation
- jsPDF for PDF generation
- html2canvas for chart image capture

### Performance Optimizations

1. **Calculation Caching**: Cache analytics results for 5 minutes using React Query
2. **Lazy Loading**: Load analytics sections as user scrolls
3. **Virtual Scrolling**: For large data tables in detailed breakdowns
4. **Web Workers**: Offload heavy calculations to background threads
5. **Incremental Calculation**: Update analytics incrementally as new data arrives

### Security Considerations

1. **Subscription Verification**: Always verify on server-side before returning premium data
2. **Rate Limiting**: Limit export requests to prevent abuse
3. **Data Privacy**: Ensure analytics data is scoped to authenticated user
4. **Secure Exports**: Generate temporary signed URLs for export downloads

### Accessibility

1. **Chart Alternatives**: Provide data tables as alternatives to charts
2. **Color Contrast**: Ensure chart colors meet WCAG AA standards
3. **Keyboard Navigation**: All interactive elements keyboard accessible
4. **Screen Reader Support**: Proper ARIA labels for charts and insights
5. **Focus Management**: Logical focus order through analytics sections

### Mobile Considerations

1. **Touch Interactions**: Tap instead of hover for chart interactions
2. **Simplified Charts**: Reduce complexity on small screens
3. **Swipe Navigation**: Swipe between time period views
4. **Bottom Sheets**: Use bottom sheets for export options
5. **Responsive Typography**: Scale text appropriately for mobile

## Future Enhancements

1. **AI-Powered Recommendations**: Use machine learning for more sophisticated insights
2. **Social Comparison**: Anonymous benchmarking against other users
3. **Health App Integration**: Correlate habit data with health metrics
4. **Custom Dashboards**: Allow users to create personalized analytics views
5. **Advanced Filtering**: Filter analytics by habit categories, tags, or custom criteria
6. **Goal Tracking**: Set analytics-based goals and track progress
7. **Automated Reports**: Schedule weekly/monthly analytics reports via email
