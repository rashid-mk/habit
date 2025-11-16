# Monitoring and Alerts Guide

This guide covers monitoring and alerting for the Habit Experiment Tracker.

## Overview

The application uses Firebase's built-in monitoring tools:
- **Firebase Performance Monitoring**: Track page load times and custom traces
- **Cloud Functions Logs**: Monitor function execution and errors with structured logging
- **Firestore Usage**: Track read/write operations and quota
- **Firebase Cloud Messaging**: Monitor notification delivery
- **Health Check Endpoint**: Monitor system availability
- **Custom Log-Based Metrics**: Track error rates, latency, and delivery rates

## Quick Start

### Setup Monitoring

Run the monitoring setup script to configure log-based metrics and alerts:

```bash
# Linux/Mac
./scripts/setup-monitoring.sh

# Windows
.\scripts\setup-monitoring.ps1
```

### View Metrics and Logs

Use the metrics viewer script for quick access to logs:

```bash
# Linux/Mac
./scripts/view-metrics.sh

# Windows
.\scripts\view-metrics.ps1
```

### Health Check

Test the health check endpoint:

```bash
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/healthCheck
```

## Firebase Performance Monitoring

### Setup

Performance monitoring is already integrated in the application via `src/utils/performanceMonitoring.ts`.

### Automatic Traces

Firebase automatically tracks:
- Page load times
- Network requests
- App startup time

### Custom Traces

The app includes custom traces for key operations:

```typescript
// Check-in latency
const trace = await startTrace('check_in_latency');
// ... perform check-in
await trace.stop();

// Analytics update
const trace = await startTrace('analytics_update');
// ... update analytics
await trace.stop();
```

### View Performance Data

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Performance** in the left sidebar
4. View metrics:
   - Page load times
   - Network request latency
   - Custom trace durations

### Performance Thresholds

Monitor these metrics:
- **Page Load Time**: Should be < 1.5 seconds
- **Check-in Latency**: Should be < 100ms (optimistic UI)
- **Analytics Update**: Should be < 2 seconds
- **Cloud Function Execution**: Should be < 800ms

## Cloud Functions Monitoring

### View Logs

#### Real-time Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only createHabit

# Follow logs in real-time
firebase functions:log --follow
```

#### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Functions** in the left sidebar
4. Click on a function to view:
   - Invocations count
   - Execution time
   - Memory usage
   - Error rate
   - Logs

### Function Metrics

Monitor these metrics for each function:

#### createHabit
- **Invocations**: Track habit creation rate
- **Execution Time**: Should be < 2 seconds
- **Error Rate**: Should be < 1%
- **Memory Usage**: Monitor for memory leaks

#### onCheckWrite
- **Invocations**: Should match check-in count
- **Execution Time**: Should be < 800ms
- **Error Rate**: Should be < 0.5%
- **Analytics Accuracy**: Verify streak calculations

#### sendReminder
- **Invocations**: Should run hourly
- **Execution Time**: Should be < 5 seconds
- **Error Rate**: Should be < 2%
- **Notification Delivery**: Track FCM success rate

### Error Tracking

All Cloud Functions include structured error logging in JSON format:

```typescript
try {
  // Function logic
} catch (error) {
  console.error(JSON.stringify({
    level: 'error',
    function: 'createHabit',
    userId: uid,
    executionTime: duration,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  }));
  throw error;
}
```

View errors in Firebase Console or via CLI:
```bash
firebase functions:log --only createHabit | grep ERROR

# Or use the metrics viewer script
./scripts/view-metrics.sh  # Select option 2 for errors
```

### Structured Logging Format

All logs follow a consistent JSON structure:

```json
{
  "level": "info|warn|error",
  "function": "functionName",
  "userId": "user123",
  "habitId": "habit456",
  "executionTime": 150,
  "message": "Operation completed successfully",
  "timestamp": "2025-11-16T12:00:00.000Z"
}
```

This enables:
- Easy parsing and filtering in Cloud Logging
- Creation of log-based metrics
- Automated alerting based on log patterns
- Better debugging with structured context

## Firestore Monitoring

### Usage Metrics

Monitor Firestore usage to avoid quota limits:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **Usage** tab

Track:
- **Document Reads**: Monitor for excessive reads
- **Document Writes**: Track write patterns
- **Document Deletes**: Monitor cleanup operations
- **Storage**: Track database size growth

### Quota Limits (Spark Plan - Free Tier)

- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day
- **Storage**: 1 GB

### Optimization Tips

1. **Use Offline Persistence**: Reduces network reads
2. **Cache Analytics**: Store computed values instead of recalculating
3. **Batch Operations**: Use batch writes when possible
4. **Limit Queries**: Use pagination and limits
5. **Index Efficiently**: Only create necessary indexes

## Firebase Cloud Messaging (FCM)

### Monitor Notification Delivery

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Cloud Messaging**
4. View metrics:
   - Messages sent
   - Delivery rate
   - Open rate
   - Error rate

### Notification Metrics

Track in Cloud Function logs:

```typescript
// In sendReminder function
console.log('Notification sent:', {
  habitId,
  userId,
  success: true,
  timestamp: new Date().toISOString()
});
```

### Common FCM Errors

- **Invalid Token**: User uninstalled app or revoked permissions
- **Not Registered**: Token expired or invalid
- **Message Too Large**: Payload exceeds 4KB limit

## Setting Up Alerts

### Google Cloud Console Alerts

For production deployments, set up alerts in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **Monitoring** > **Alerting**
4. Click **Create Policy**

### Log-Based Metrics

The setup script creates the following log-based metrics:

#### 1. function_error_rate
Tracks Cloud Function errors across all functions.

**Filter:**
```
resource.type="cloud_function"
severity>=ERROR
```

**Use:** Create alerts when error rate exceeds threshold

#### 2. function_high_latency
Tracks functions with execution time > 2 seconds.

**Filter:**
```
resource.type="cloud_function"
jsonPayload.executionTime>2000
```

**Use:** Identify performance degradation

#### 3. fcm_delivery_failures
Tracks FCM notification delivery failures.

**Filter:**
```
resource.type="cloud_function"
jsonPayload.function="sendNotification"
jsonPayload.success=false
```

**Use:** Monitor notification delivery health

### Querying Logs

Use Cloud Logging to query structured logs:

```
# All errors in the last hour
resource.type="cloud_function"
severity>=ERROR
timestamp>="2025-11-16T11:00:00Z"

# Slow function executions
resource.type="cloud_function"
jsonPayload.executionTime>1000

# Specific user's activity
jsonPayload.userId="user123"

# Failed notifications
jsonPayload.function="sendNotification"
jsonPayload.success=false

# High streak achievements
jsonPayload.function="onCheckWrite"
jsonPayload.currentStreak>=30
```

### Recommended Alerts

The following alerts should be configured in Google Cloud Console. See [Alert Configuration Guide](docs/ALERT_CONFIGURATION.md) for detailed setup instructions.

#### 1. High Error Rate Alert
- **Threshold:** > 5% of function executions
- **Duration:** 5 minutes
- **Severity:** Critical
- **Channels:** Email, SMS, Slack

#### 2. High Latency Alert
- **Threshold:** > 2 seconds (95th percentile)
- **Duration:** 10 minutes
- **Severity:** Warning
- **Channels:** Email, Slack

#### 3. Firestore Quota Alert
- **Threshold:** > 40,000 reads/day (80% of free tier)
- **Duration:** 1 hour
- **Severity:** Warning
- **Channels:** Email, Slack

#### 4. FCM Delivery Failure Alert
- **Threshold:** > 10% failure rate
- **Duration:** 1 hour
- **Severity:** Warning
- **Channels:** Email, Slack

#### 5. Function Invocation Spike
- **Threshold:** > 1,000 invocations/minute
- **Duration:** 5 minutes
- **Severity:** Warning
- **Channels:** Email, Slack

#### 6. Memory Usage Alert
- **Threshold:** > 200MB (95th percentile)
- **Duration:** 10 minutes
- **Severity:** Warning
- **Channels:** Email

### Alert Notification Channels

Configure notification channels in Google Cloud Console:
- **Email**: Team email or distribution list
- **SMS**: For critical alerts (may incur charges)
- **Slack**: Team Slack channel integration
- **Webhook**: PagerDuty, Opsgenie, or custom integrations

**See [Alert Configuration Guide](docs/ALERT_CONFIGURATION.md) for step-by-step setup instructions.**

## Custom Monitoring Dashboard

### Create a Monitoring Dashboard

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Monitoring** > **Dashboards**
3. Click **Create Dashboard**
4. Add charts for:
   - Function invocations over time
   - Error rate by function
   - Execution time percentiles
   - Firestore read/write operations
   - Active users (from Analytics)

### Example Dashboard Widgets

#### Function Invocations
```
Chart Type: Line chart
Resource: Cloud Function
Metric: executions/count
Group By: function_name
```

#### Error Rate
```
Chart Type: Stacked area chart
Resource: Cloud Function
Metric: executions/count
Filter: status = "error"
Group By: function_name
```

#### Execution Time
```
Chart Type: Heatmap
Resource: Cloud Function
Metric: execution_times
Aggregation: 95th percentile
```

## Log Analysis

### Structured Logging

All Cloud Functions use structured logging:

```typescript
console.log(JSON.stringify({
  level: 'info',
  function: 'createHabit',
  userId: context.auth.uid,
  habitId: habitId,
  timestamp: new Date().toISOString(),
  message: 'Habit created successfully'
}));
```

### Query Logs

Use Cloud Logging to query logs:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Logging** > **Logs Explorer**
3. Use filters:

```
# All errors
severity >= ERROR

# Specific function
resource.labels.function_name="createHabit"

# Time range
timestamp >= "2025-11-15T00:00:00Z"

# User-specific logs
jsonPayload.userId="user123"
```

### Export Logs

Export logs for long-term analysis:

1. Go to **Logging** > **Log Router**
2. Create a sink to:
   - BigQuery (for analysis)
   - Cloud Storage (for archival)
   - Pub/Sub (for real-time processing)

## Performance Optimization Monitoring

### Frontend Performance

Monitor in Firebase Performance:
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Backend Performance

Monitor in Cloud Functions:
- **Cold Start Time**: < 2s
- **Warm Execution Time**: < 500ms
- **Memory Usage**: < 256MB
- **Timeout Rate**: < 0.1%

## Cost Monitoring

### Set Up Budget Alerts

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Billing** > **Budgets & alerts**
3. Create budget:
   - Set monthly budget amount
   - Set alert thresholds (50%, 90%, 100%)
   - Configure notification emails

### Monitor Costs

Track costs by service:
- **Cloud Functions**: Invocations and compute time
- **Firestore**: Reads, writes, storage
- **Hosting**: Bandwidth and storage
- **Cloud Storage**: Storage and operations

### Cost Optimization Tips

1. **Optimize Function Memory**: Use minimum required memory
2. **Reduce Cold Starts**: Use min instances for critical functions
3. **Cache Aggressively**: Reduce Firestore reads
4. **Compress Assets**: Reduce hosting bandwidth
5. **Clean Up Old Data**: Archive or delete unused data

## Health Check Endpoint

The application includes a health check endpoint at `/healthCheck` that verifies:
- Firestore connectivity
- System availability
- Response time

### Usage

```bash
# Test health check
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/healthCheck

# Response
{
  "status": "healthy",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "firestore": "operational",
    "auth": "operational",
    "functions": "operational"
  },
  "metrics": {
    "responseTime": "45ms",
    "uptime": 3600
  }
}
```

### External Monitoring

Monitor this endpoint with external services:
- **UptimeRobot**: Free tier includes 50 monitors
- **Pingdom**: Comprehensive uptime monitoring
- **StatusCake**: Free tier with basic monitoring
- **Better Uptime**: Modern uptime monitoring

Configure these services to:
- Check the endpoint every 5 minutes
- Alert if response time > 2 seconds
- Alert if status code is not 200
- Alert after 2 consecutive failures

### System Metrics Endpoint

The `/getMetrics` endpoint provides system-wide metrics (requires authentication):

```bash
# Get system metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getMetrics

# Response
{
  "timestamp": "2025-11-16T12:00:00.000Z",
  "users": {
    "total": 150
  },
  "habits": {
    "total": 320,
    "active": 280
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": {...}
  }
}
```

## Incident Response

### When an Alert Fires

1. **Acknowledge**: Acknowledge the alert in your monitoring system
2. **Assess**: Check Firebase Console and logs to understand the issue
3. **Mitigate**: Take immediate action to reduce impact
4. **Resolve**: Fix the root cause
5. **Document**: Record the incident and resolution
6. **Review**: Conduct post-mortem to prevent recurrence

### Common Issues and Solutions

#### High Error Rate
- Check recent deployments
- Review Cloud Function logs
- Verify Firestore rules
- Check for API quota limits

#### High Latency
- Check Firestore query performance
- Review function memory allocation
- Look for N+1 query patterns
- Check for cold starts

#### Quota Exceeded
- Identify source of excessive operations
- Implement rate limiting
- Optimize queries
- Consider upgrading plan

## Monitoring Scripts

The project includes several scripts to help with monitoring:

### Setup Monitoring
```bash
# Linux/Mac
./scripts/setup-monitoring.sh

# Windows
.\scripts\setup-monitoring.ps1
```

Creates log-based metrics and provides setup instructions.

### View Metrics
```bash
# Linux/Mac
./scripts/view-metrics.sh

# Windows
.\scripts\view-metrics.ps1
```

Interactive menu to view logs and metrics.

### Verify Deployment
```bash
# Linux/Mac
./scripts/verify-deployment.sh

# Windows
.\scripts\verify-deployment.ps1
```

Verifies deployment and checks system health.

## Resources

- [Alert Configuration Guide](docs/ALERT_CONFIGURATION.md) - Step-by-step alert setup
- [Firebase Performance Monitoring Docs](https://firebase.google.com/docs/perf-mon)
- [Cloud Functions Monitoring](https://firebase.google.com/docs/functions/monitoring)
- [Firestore Usage and Limits](https://firebase.google.com/docs/firestore/quotas)
- [Google Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [Firebase Cloud Messaging Monitoring](https://firebase.google.com/docs/cloud-messaging/monitoring)
