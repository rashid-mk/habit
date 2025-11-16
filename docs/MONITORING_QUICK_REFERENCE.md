# Monitoring Quick Reference

Quick reference for common monitoring tasks.

## Quick Commands

### View Logs
```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only createHabit

# Follow in real-time
firebase functions:log --follow

# Last 100 lines
firebase functions:log --limit 100

# Filter errors
firebase functions:log | grep ERROR
```

### View Metrics
```bash
# Interactive metrics viewer
./scripts/view-metrics.sh          # Linux/Mac
.\scripts\view-metrics.ps1         # Windows
```

### Check Health
```bash
# Test health endpoint
curl https://REGION-PROJECT_ID.cloudfunctions.net/healthCheck

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "firestore": "operational",
    "auth": "operational",
    "functions": "operational"
  }
}
```

### Verify Deployment
```bash
./scripts/verify-deployment.sh     # Linux/Mac
.\scripts\verify-deployment.ps1    # Windows
```

## Console URLs

Replace `PROJECT_ID` with your Firebase project ID:

### Firebase Console
- **Overview:** `https://console.firebase.google.com/project/PROJECT_ID`
- **Functions:** `https://console.firebase.google.com/project/PROJECT_ID/functions`
- **Firestore:** `https://console.firebase.google.com/project/PROJECT_ID/firestore`
- **Performance:** `https://console.firebase.google.com/project/PROJECT_ID/performance`
- **Cloud Messaging:** `https://console.firebase.google.com/project/PROJECT_ID/notification`

### Google Cloud Console
- **Logs Explorer:** `https://console.cloud.google.com/logs/query?project=PROJECT_ID`
- **Monitoring:** `https://console.cloud.google.com/monitoring?project=PROJECT_ID`
- **Alerting:** `https://console.cloud.google.com/monitoring/alerting?project=PROJECT_ID`
- **Metrics Explorer:** `https://console.cloud.google.com/monitoring/metrics-explorer?project=PROJECT_ID`

## Log Queries

Use these in Cloud Logging Logs Explorer:

### All Errors
```
resource.type="cloud_function"
severity>=ERROR
```

### Slow Functions (>2s)
```
resource.type="cloud_function"
jsonPayload.executionTime>2000
```

### Specific User Activity
```
jsonPayload.userId="USER_ID"
```

### Failed Notifications
```
jsonPayload.function="sendNotification"
jsonPayload.success=false
```

### High Streaks
```
jsonPayload.function="onCheckWrite"
jsonPayload.currentStreak>=30
```

### Recent Errors (Last Hour)
```
resource.type="cloud_function"
severity>=ERROR
timestamp>="2025-11-16T11:00:00Z"
```

## Key Metrics

### Function Performance
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Investigate logs, check recent deployments |
| Execution Time | > 2s | Optimize queries, increase memory |
| Invocations | Spike > 1000/min | Check for abuse, verify rate limiting |
| Memory Usage | > 200MB | Check for memory leaks |

### Firestore Usage
| Metric | Free Tier Limit | Warning Threshold |
|--------|-----------------|-------------------|
| Reads | 50,000/day | 40,000/day (80%) |
| Writes | 20,000/day | 16,000/day (80%) |
| Deletes | 20,000/day | 16,000/day (80%) |
| Storage | 1 GB | 800 MB (80%) |

### FCM Notifications
| Metric | Threshold | Action |
|--------|-----------|--------|
| Delivery Rate | < 90% | Check tokens, verify permissions |
| Error Rate | > 10% | Review error codes in logs |

## Alert Response

### High Error Rate
1. ✅ Check recent deployments
2. ✅ Review function logs
3. ✅ Verify Firestore rules
4. ✅ Check external services
5. ✅ Roll back if needed

### High Latency
1. ✅ Check Firestore queries
2. ✅ Review memory allocation
3. ✅ Look for N+1 patterns
4. ✅ Check cold starts
5. ✅ Increase resources

### Quota Exceeded
1. ✅ Identify excessive operations
2. ✅ Check for loops/retries
3. ✅ Implement rate limiting
4. ✅ Optimize queries
5. ✅ Consider upgrade

## Structured Log Format

All logs use this JSON structure:

```json
{
  "level": "info|warn|error",
  "function": "functionName",
  "userId": "user123",
  "habitId": "habit456",
  "executionTime": 150,
  "message": "Description",
  "timestamp": "2025-11-16T12:00:00.000Z"
}
```

## Performance Targets

### Frontend
- **Page Load:** < 1.5s
- **Check-in UI:** < 100ms (optimistic)
- **Analytics Display:** < 2s

### Backend
- **createHabit:** < 2s
- **onCheckWrite:** < 800ms
- **sendReminder:** < 5s per batch

### Database
- **Query Response:** < 500ms
- **Write Latency:** < 200ms

## Common Issues

### Function Not Found
```bash
# Redeploy functions
firebase deploy --only functions
```

### Logs Not Showing
```bash
# Check if logged in
firebase login

# Check project
firebase use
```

### Health Check Fails
```bash
# Check function deployment
firebase functions:list

# Check function logs
firebase functions:log --only healthCheck
```

### High Costs
```bash
# Check billing
gcloud billing accounts list

# View cost breakdown
# Go to: console.cloud.google.com/billing
```

## Setup Checklist

- [ ] Run `./scripts/setup-monitoring.sh`
- [ ] Configure alert policies (see [Alert Configuration Guide](ALERT_CONFIGURATION.md))
- [ ] Set up notification channels (email, Slack, SMS)
- [ ] Create monitoring dashboard
- [ ] Set up budget alerts
- [ ] Configure external uptime monitoring
- [ ] Test alert delivery
- [ ] Document runbooks

## Resources

- [Full Monitoring Guide](../MONITORING.md)
- [Alert Configuration Guide](ALERT_CONFIGURATION.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Monitoring](https://cloud.google.com/monitoring/docs)
