# Alert Configuration Guide

This guide provides step-by-step instructions for setting up monitoring alerts in Google Cloud Console.

## Prerequisites

1. Firebase project deployed with Cloud Functions
2. Access to Google Cloud Console
3. Monitoring setup script executed (`./scripts/setup-monitoring.sh`)

## Alert Policies

### 1. High Error Rate Alert

**Purpose:** Detect when Cloud Functions are experiencing elevated error rates

**Steps:**
1. Go to [Google Cloud Console > Monitoring > Alerting](https://console.cloud.google.com/monitoring/alerting)
2. Click **Create Policy**
3. Click **Select a metric**
4. Filter by:
   - Resource type: `Cloud Function`
   - Metric: `executions/count`
5. Add filter: `status = error`
6. Set aggregation: `sum`
7. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `5` (5% of total executions)
   - For: `5 minutes`
8. Configure notifications (email, Slack, SMS)
9. Name: `High Error Rate - Cloud Functions`
10. Click **Create Policy**

### 2. High Latency Alert

**Purpose:** Detect slow function executions

**Steps:**
1. Click **Create Policy**
2. Click **Select a metric**
3. Filter by:
   - Resource type: `Cloud Function`
   - Metric: `execution_times`
4. Set aggregation: `95th percentile`
5. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `2000` (2 seconds in milliseconds)
   - For: `10 minutes`
6. Configure notifications
7. Name: `High Latency - Cloud Functions`
8. Click **Create Policy**

### 3. Firestore Quota Alert

**Purpose:** Alert when approaching daily read/write quota limits

**Steps:**
1. Click **Create Policy**
2. Click **Select a metric**
3. Filter by:
   - Resource type: `Firestore Database`
   - Metric: `document/read_count`
4. Set aggregation: `sum`
5. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `40000` (80% of free tier 50k limit)
   - For: `1 hour`
6. Configure notifications
7. Name: `Firestore Quota Warning - Reads`
8. Click **Create Policy**
9. Repeat for `document/write_count` with threshold `16000` (80% of 20k limit)

### 4. FCM Delivery Failure Alert

**Purpose:** Monitor notification delivery health

**Steps:**
1. Click **Create Policy**
2. Click **Select a metric**
3. Filter by:
   - Resource type: `Cloud Function`
   - Metric: `User-defined metric` > `fcm_delivery_failures`
4. Set aggregation: `rate`
5. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `10` (10% failure rate)
   - For: `1 hour`
6. Configure notifications
7. Name: `FCM Delivery Failures`
8. Click **Create Policy**

### 5. Function Invocation Spike Alert

**Purpose:** Detect unusual traffic patterns or potential abuse

**Steps:**
1. Click **Create Policy**
2. Click **Select a metric**
3. Filter by:
   - Resource type: `Cloud Function`
   - Metric: `executions/count`
4. Set aggregation: `rate`
5. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `1000` (1000 invocations per minute)
   - For: `5 minutes`
6. Configure notifications
7. Name: `Function Invocation Spike`
8. Click **Create Policy**

### 6. Memory Usage Alert

**Purpose:** Detect memory leaks or excessive memory usage

**Steps:**
1. Click **Create Policy**
2. Click **Select a metric**
3. Filter by:
   - Resource type: `Cloud Function`
   - Metric: `user_memory_bytes`
4. Set aggregation: `95th percentile`
5. Set condition:
   - Condition type: `Threshold`
   - Threshold position: `Above threshold`
   - Threshold value: `200000000` (200MB)
   - For: `10 minutes`
6. Configure notifications
7. Name: `High Memory Usage - Cloud Functions`
8. Click **Create Policy**

## Notification Channels

### Email Notifications

1. Go to **Monitoring > Alerting > Notification Channels**
2. Click **Add New** > **Email**
3. Enter email address
4. Click **Save**

### Slack Integration

1. Go to **Monitoring > Alerting > Notification Channels**
2. Click **Add New** > **Slack**
3. Follow OAuth flow to connect Slack workspace
4. Select channel for notifications
5. Click **Save**

### SMS Notifications

1. Go to **Monitoring > Alerting > Notification Channels**
2. Click **Add New** > **SMS**
3. Enter phone number with country code
4. Verify phone number
5. Click **Save**

**Note:** SMS notifications may incur charges

### Webhook Integration

For custom integrations (PagerDuty, Opsgenie, etc.):

1. Go to **Monitoring > Alerting > Notification Channels**
2. Click **Add New** > **Webhook**
3. Enter webhook URL
4. Configure authentication if required
5. Click **Save**

## Alert Severity Levels

Configure different notification channels based on severity:

### Critical Alerts (Immediate Response)
- High error rate (>10%)
- Service unavailable
- Firestore quota exceeded
- **Channels:** SMS, PagerDuty, Slack

### Warning Alerts (Monitor Closely)
- Elevated error rate (5-10%)
- High latency (>2s)
- Approaching quota limits (>80%)
- **Channels:** Email, Slack

### Info Alerts (Awareness)
- Function invocation spikes
- Memory usage trends
- Performance degradation
- **Channels:** Email

## Testing Alerts

### Test Error Alert

Trigger an error in a Cloud Function:

```typescript
// Temporarily add to a function
throw new Error('Test alert - please ignore');
```

Deploy and invoke the function to trigger the alert.

### Test Latency Alert

Add artificial delay:

```typescript
// Temporarily add to a function
await new Promise(resolve => setTimeout(resolve, 3000));
```

### Test Quota Alert

Run a script to generate reads:

```bash
# Use with caution - will consume quota
for i in {1..1000}; do
  curl -X POST https://YOUR-FUNCTION-URL
done
```

## Alert Best Practices

1. **Start Conservative:** Begin with higher thresholds and adjust based on actual patterns
2. **Avoid Alert Fatigue:** Don't create too many alerts that fire frequently
3. **Group Related Alerts:** Use alert groups for related conditions
4. **Document Runbooks:** Create response procedures for each alert
5. **Regular Review:** Review and adjust alert thresholds monthly
6. **Test Regularly:** Test alert delivery quarterly
7. **On-Call Rotation:** Set up on-call schedules for critical alerts

## Alert Response Procedures

### High Error Rate

1. Check recent deployments
2. Review function logs for error patterns
3. Check Firestore rules and quotas
4. Verify external service availability
5. Roll back if recent deployment caused issue

### High Latency

1. Check Firestore query performance
2. Review function memory allocation
3. Look for N+1 query patterns
4. Check for cold start issues
5. Consider increasing function resources

### Quota Exceeded

1. Identify source of excessive operations
2. Check for infinite loops or retry storms
3. Implement rate limiting if needed
4. Optimize queries to reduce reads
5. Consider upgrading Firebase plan

### FCM Delivery Failures

1. Check FCM token validity
2. Review notification payload size
3. Verify user permissions
4. Check FCM service status
5. Review error codes in logs

## Monitoring Dashboard

Create a custom dashboard to visualize all metrics:

1. Go to **Monitoring > Dashboards**
2. Click **Create Dashboard**
3. Add charts for:
   - Function invocations (line chart)
   - Error rate (stacked area chart)
   - Execution time percentiles (heatmap)
   - Firestore operations (line chart)
   - FCM delivery rate (gauge)
   - Active users (number)

## Cost Monitoring

Set up budget alerts to avoid unexpected costs:

1. Go to **Billing > Budgets & alerts**
2. Click **Create Budget**
3. Set budget amount (e.g., $50/month)
4. Set alert thresholds:
   - 50% of budget
   - 90% of budget
   - 100% of budget
5. Configure email notifications
6. Click **Finish**

## Resources

- [Google Cloud Monitoring Documentation](https://cloud.google.com/monitoring/docs)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Cloud Functions Monitoring](https://firebase.google.com/docs/functions/monitoring)
- [Firestore Monitoring](https://firebase.google.com/docs/firestore/monitor-usage)
- [Alert Policy Reference](https://cloud.google.com/monitoring/alerts)

## Support

For issues with monitoring setup:
1. Check Firebase Console for service status
2. Review Cloud Logging for detailed error messages
3. Consult Firebase documentation
4. Contact Firebase support if needed
