# Premium Analytics Chart Components

This document describes the chart components implemented for the premium analytics feature.

## Chart Library

We use **Recharts** - a composable charting library built on React components. It provides:
- Responsive charts that adapt to viewport changes
- Interactive tooltips on hover
- Smooth animations
- TypeScript support
- Accessibility features

## Components

### 1. TrendLineChart
**Location**: `src/components/TrendLineChart.tsx`

Displays completion trends over time using an area chart with gradient fill.

**Props**:
- `dataPoints`: Array of `{ date: string, value: number }` objects
- `height`: Optional chart height (default: 300px)
- `onDataPointClick`: Optional callback for drill-down functionality
- `enableZoom`: Enable zoom and pan functionality (default: true)

**Features**:
- Gradient fill under the line
- Interactive tooltips showing date and completion status
- Responsive to viewport changes
- Grid lines for better readability
- **Zoom & Pan**: Drag to select a region to zoom, use brush control to pan
- **Click interactions**: Click on data points for drill-down
- **Touch support**: Full touch gesture support for mobile devices

### 2. CompletionPieChart
**Location**: `src/components/CompletionPieChart.tsx`

Shows the distribution of completed vs missed days as a pie chart.

**Props**:
- `completed`: Number of completed days
- `missed`: Number of missed days
- `height`: Optional chart height (default: 300px)
- `onSegmentClick`: Optional callback when a segment is clicked

**Features**:
- Color-coded segments (green for completed, red for missed)
- Percentage labels on segments
- Interactive tooltips with detailed counts
- Legend showing percentages
- **Active segment highlighting**: Hover/tap to expand segment with details
- **Click interactions**: Click segments for drill-down functionality
- **Touch support**: Tap segments on mobile devices

### 3. ProgressChart
**Location**: `src/components/ProgressChart.tsx`

Displays progress over time for count or time-based habits.

**Props**:
- `data`: Array of `{ date: string, value: number }` objects
- `habitType`: Either 'count' or 'time'
- `targetValue`: Optional target line to display
- `height`: Optional chart height (default: 300px)
- `onDataPointClick`: Optional callback for drill-down functionality
- `enableZoom`: Enable zoom and pan functionality (default: true)

**Features**:
- Area chart with gradient fill
- Optional target line (dashed)
- Formatted Y-axis based on habit type
- Interactive tooltips with date and value
- **Zoom & Pan**: Drag to select a region to zoom, use brush control to pan
- **Click interactions**: Click on data points for drill-down
- **Touch support**: Full touch gesture support for mobile devices

### 4. CalendarHeatmap
**Location**: `src/components/CalendarHeatmap.tsx`

Shows long-term completion patterns in a calendar-style heatmap.

**Props**:
- `completions`: Array of `{ date: string, value: number }` objects
- `startDate`: Start date for the calendar
- `endDate`: End date for the calendar
- `onDateClick`: Optional callback when a date cell is clicked

**Features**:
- Color intensity based on completion frequency
- Tooltips on hover showing date and count
- Week-based layout (Sunday to Saturday)
- Legend showing color scale
- **Click interactions**: Click on date cells for drill-down
- **Selected state**: Visual highlight for selected dates
- **Touch support**: Tap cells on mobile with floating tooltips
- **Keyboard navigation**: Full keyboard accessibility

### 5. DayOfWeekBarChart
**Location**: `src/components/DayOfWeekBarChart.tsx`

Displays completion rates for each day of the week as horizontal bars.

**Props**:
- `stats`: DayOfWeekStats object with completion data for each day
- `onDayClick`: Optional callback when a day is clicked

**Features**:
- Color-coded bars (green for best, red for worst)
- Percentage labels
- Completion counts displayed on bars
- Highlights best and worst performing days
- **Click interactions**: Click on days for expanded details
- **Hover effects**: Visual feedback on hover/touch
- **Keyboard navigation**: Full keyboard accessibility

### 6. TimeOfDayHeatmap
**Location**: `src/components/TimeOfDayHeatmap.tsx`

Displays completion distribution across 24 hours.

**Props**:
- `distribution`: TimeDistribution object with hourly data
- `onHourClick`: Optional callback when an hour cell is clicked

**Features**:
- 24-hour grid with color intensity
- Peak hour highlighting
- Tooltips showing completion counts
- **Click interactions**: Click on hours for expanded details
- **Touch support**: Tap cells on mobile devices
- **Keyboard navigation**: Full keyboard accessibility

## Common Theme

**Location**: `src/config/chartTheme.ts`

Centralized theme configuration for consistent styling across all charts:
- Color palette (primary, success, danger, warning, gray)
- Chart margins and spacing
- Tooltip styling
- Grid styling
- Heatmap color scales

## Interactivity Features

All charts support the following interactive features:

### Hover Tooltips
- Detailed information displayed on hover
- Pointer-events disabled to prevent tooltip interference
- Consistent styling across all charts

### Click Interactions
- Optional drill-down callbacks for all charts
- Visual feedback on click (selection state)
- Expanded details panel for selected items

### Touch Support
- Full touch gesture support for mobile devices
- Touch-friendly hit targets
- Floating tooltips for touch interactions
- Swipe/pan gestures for timeline charts

### Zoom & Pan (Timeline Charts)
- Drag-to-zoom selection on TrendLineChart and ProgressChart
- Brush control for panning through data
- Reset zoom button
- Works with both mouse and touch

### Keyboard Navigation
- All interactive elements are focusable
- Enter/Space to activate
- ARIA labels for screen readers

## Testing

All chart components have property-based tests that verify:
- **Interactivity** (Property 27): Charts display tooltips on hover
- **Responsiveness** (Property 28): Charts adapt to different viewport sizes

Test files:
- `src/components/__tests__/ChartInteractivity.test.tsx`
- `src/components/__tests__/ChartResponsiveness.test.tsx`

## Usage Example

```tsx
import { TrendLineChart } from './components/TrendLineChart'
import { CompletionPieChart } from './components/CompletionPieChart'
import { ProgressChart } from './components/ProgressChart'
import { CalendarHeatmap } from './components/CalendarHeatmap'
import { DayOfWeekBarChart } from './components/DayOfWeekBarChart'
import { TimeOfDayHeatmap } from './components/TimeOfDayHeatmap'

// Trend analysis with zoom and click
<TrendLineChart 
  dataPoints={[
    { date: '2024-01-01', value: 1 },
    { date: '2024-01-02', value: 0 },
  ]}
  onDataPointClick={(point) => console.log('Clicked:', point)}
  enableZoom={true}
/>

// Completion distribution with click
<CompletionPieChart 
  completed={25} 
  missed={5}
  onSegmentClick={(segment) => console.log('Segment:', segment)}
/>

// Progress tracking with zoom
<ProgressChart 
  data={[
    { date: '2024-01-01', value: 10 },
    { date: '2024-01-02', value: 15 },
  ]}
  habitType="count"
  targetValue={20}
  onDataPointClick={(point) => console.log('Clicked:', point)}
/>

// Calendar heatmap with click
<CalendarHeatmap
  completions={[
    { date: '2024-01-01', value: 1 },
    { date: '2024-01-05', value: 2 },
  ]}
  startDate={new Date('2024-01-01')}
  endDate={new Date('2024-01-31')}
  onDateClick={(date, value) => console.log('Date:', date, value)}
/>

// Day of week analysis with click
<DayOfWeekBarChart 
  stats={dayOfWeekStats}
  onDayClick={(day, stats) => console.log('Day:', day, stats)}
/>

// Time of day heatmap with click
<TimeOfDayHeatmap
  distribution={timeDistribution}
  onHourClick={(hour, count) => console.log('Hour:', hour, count)}
/>
```

## Accessibility

All charts include:
- Proper ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Tooltip information for screen readers
- High contrast colors meeting WCAG AA standards
- Focus indicators for keyboard users

## Performance

Charts are optimized for performance:
- Responsive containers that adapt to parent size
- Efficient rendering with React hooks
- Smooth animations (300ms duration)
- Lazy loading support
- Touch event optimization for mobile
