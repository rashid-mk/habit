#!/bin/bash

# Monitoring Setup Script for Habit Experiment Tracker
# This script helps configure monitoring and alerts for the Firebase project

set -e

echo "=========================================="
echo "Habit Tracker - Monitoring Setup"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "Error: Not logged in to Firebase."
    echo "Run: firebase login"
    exit 1
fi

# Get current project
PROJECT_ID=$(firebase use | grep "active project" | awk '{print $NF}' | tr -d '()')

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Firebase project selected."
    echo "Run: firebase use <project-id>"
    exit 1
fi

echo "Setting up monitoring for project: $PROJECT_ID"
echo ""

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo "Warning: gcloud CLI is not installed."
        echo "Some monitoring features require gcloud CLI."
        echo "Install from: https://cloud.google.com/sdk/docs/install"
        return 1
    fi
    return 0
}

# Enable required APIs
echo "Step 1: Enabling required APIs..."
if check_gcloud; then
    gcloud services enable monitoring.googleapis.com --project=$PROJECT_ID 2>/dev/null || echo "  Monitoring API already enabled or requires manual setup"
    gcloud services enable logging.googleapis.com --project=$PROJECT_ID 2>/dev/null || echo "  Logging API already enabled or requires manual setup"
    gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID 2>/dev/null || echo "  Cloud Scheduler API already enabled or requires manual setup"
    echo "  ✓ APIs enabled"
else
    echo "  ⚠ Skipping API enablement (requires gcloud CLI)"
    echo "  Enable manually at: https://console.cloud.google.com/apis/library"
fi
echo ""

# Create log-based metrics
echo "Step 2: Creating log-based metrics..."
if check_gcloud; then
    # Error rate metric
    gcloud logging metrics create function_error_rate \
        --description="Cloud Function error rate" \
        --log-filter='resource.type="cloud_function"
severity>=ERROR' \
        --project=$PROJECT_ID 2>/dev/null || echo "  Metric 'function_error_rate' already exists"
    
    # High latency metric
    gcloud logging metrics create function_high_latency \
        --description="Cloud Functions with execution time > 2s" \
        --log-filter='resource.type="cloud_function"
jsonPayload.executionTime>2000' \
        --project=$PROJECT_ID 2>/dev/null || echo "  Metric 'function_high_latency' already exists"
    
    # FCM delivery failures
    gcloud logging metrics create fcm_delivery_failures \
        --description="FCM notification delivery failures" \
        --log-filter='resource.type="cloud_function"
jsonPayload.function="sendNotification"
jsonPayload.success=false' \
        --project=$PROJECT_ID 2>/dev/null || echo "  Metric 'fcm_delivery_failures' already exists"
    
    echo "  ✓ Log-based metrics created"
else
    echo "  ⚠ Skipping log-based metrics (requires gcloud CLI)"
fi
echo ""

# Display monitoring URLs
echo "=========================================="
echo "Monitoring Dashboard URLs"
echo "=========================================="
echo ""
echo "Firebase Console:"
echo "  Performance: https://console.firebase.google.com/project/$PROJECT_ID/performance"
echo "  Functions: https://console.firebase.google.com/project/$PROJECT_ID/functions"
echo "  Firestore: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo "  Cloud Messaging: https://console.firebase.google.com/project/$PROJECT_ID/notification"
echo ""
echo "Google Cloud Console:"
echo "  Logs Explorer: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo "  Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo "  Alerting: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo ""

# Display next steps
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Set up alert policies in Google Cloud Console:"
echo "   https://console.cloud.google.com/monitoring/alerting/policies/create?project=$PROJECT_ID"
echo ""
echo "2. Recommended alerts to create:"
echo "   - High error rate (>5% of function executions)"
echo "   - High latency (>2s execution time)"
echo "   - Low FCM delivery rate (<90%)"
echo "   - Firestore quota approaching limit"
echo ""
echo "3. Configure notification channels:"
echo "   - Email notifications"
echo "   - Slack integration"
echo "   - SMS for critical alerts"
echo ""
echo "4. View the MONITORING.md file for detailed instructions"
echo ""
echo "5. Test monitoring by triggering some functions:"
echo "   - Create a habit"
echo "   - Complete a check-in"
echo "   - View analytics"
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
