# Monitoring Setup Script for Habit Experiment Tracker
# This script helps configure monitoring and alerts for the Firebase project

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Habit Tracker - Monitoring Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version
} catch {
    Write-Host "Error: Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools"
    exit 1
}

# Check if user is logged in
try {
    $null = firebase projects:list 2>&1
} catch {
    Write-Host "Error: Not logged in to Firebase." -ForegroundColor Red
    Write-Host "Run: firebase login"
    exit 1
}

# Get current project
$projectOutput = firebase use 2>&1 | Out-String
if ($projectOutput -match "active project.*\(([^)]+)\)") {
    $PROJECT_ID = $matches[1]
} else {
    Write-Host "Error: No Firebase project selected." -ForegroundColor Red
    Write-Host "Run: firebase use <project-id>"
    exit 1
}

Write-Host "Setting up monitoring for project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Function to check if gcloud is installed
function Test-GcloudInstalled {
    try {
        $null = gcloud --version 2>&1
        return $true
    } catch {
        return $false
    }
}

# Enable required APIs
Write-Host "Step 1: Enabling required APIs..." -ForegroundColor Yellow
if (Test-GcloudInstalled) {
    try {
        gcloud services enable monitoring.googleapis.com --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Monitoring API enabled" -ForegroundColor Gray
    } catch {
        Write-Host "  Monitoring API already enabled or requires manual setup" -ForegroundColor Gray
    }
    
    try {
        gcloud services enable logging.googleapis.com --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Logging API enabled" -ForegroundColor Gray
    } catch {
        Write-Host "  Logging API already enabled or requires manual setup" -ForegroundColor Gray
    }
    
    try {
        gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Cloud Scheduler API enabled" -ForegroundColor Gray
    } catch {
        Write-Host "  Cloud Scheduler API already enabled or requires manual setup" -ForegroundColor Gray
    }
    
    Write-Host "  ✓ APIs enabled" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Skipping API enablement (requires gcloud CLI)" -ForegroundColor Yellow
    Write-Host "  Enable manually at: https://console.cloud.google.com/apis/library" -ForegroundColor Gray
}
Write-Host ""

# Create log-based metrics
Write-Host "Step 2: Creating log-based metrics..." -ForegroundColor Yellow
if (Test-GcloudInstalled) {
    # Error rate metric
    try {
        gcloud logging metrics create function_error_rate `
            --description="Cloud Function error rate" `
            --log-filter='resource.type="cloud_function" severity>=ERROR' `
            --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Created metric: function_error_rate" -ForegroundColor Gray
    } catch {
        Write-Host "  Metric 'function_error_rate' already exists" -ForegroundColor Gray
    }
    
    # High latency metric
    try {
        gcloud logging metrics create function_high_latency `
            --description="Cloud Functions with execution time > 2s" `
            --log-filter='resource.type="cloud_function" jsonPayload.executionTime>2000' `
            --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Created metric: function_high_latency" -ForegroundColor Gray
    } catch {
        Write-Host "  Metric 'function_high_latency' already exists" -ForegroundColor Gray
    }
    
    # FCM delivery failures
    try {
        gcloud logging metrics create fcm_delivery_failures `
            --description="FCM notification delivery failures" `
            --log-filter='resource.type="cloud_function" jsonPayload.function="sendNotification" jsonPayload.success=false' `
            --project=$PROJECT_ID 2>&1 | Out-Null
        Write-Host "  Created metric: fcm_delivery_failures" -ForegroundColor Gray
    } catch {
        Write-Host "  Metric 'fcm_delivery_failures' already exists" -ForegroundColor Gray
    }
    
    Write-Host "  ✓ Log-based metrics created" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Skipping log-based metrics (requires gcloud CLI)" -ForegroundColor Yellow
}
Write-Host ""

# Display monitoring URLs
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Monitoring Dashboard URLs" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Firebase Console:" -ForegroundColor White
Write-Host "  Performance: https://console.firebase.google.com/project/$PROJECT_ID/performance" -ForegroundColor Gray
Write-Host "  Functions: https://console.firebase.google.com/project/$PROJECT_ID/functions" -ForegroundColor Gray
Write-Host "  Firestore: https://console.firebase.google.com/project/$PROJECT_ID/firestore" -ForegroundColor Gray
Write-Host "  Cloud Messaging: https://console.firebase.google.com/project/$PROJECT_ID/notification" -ForegroundColor Gray
Write-Host ""
Write-Host "Google Cloud Console:" -ForegroundColor White
Write-Host "  Logs Explorer: https://console.cloud.google.com/logs/query?project=$PROJECT_ID" -ForegroundColor Gray
Write-Host "  Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID" -ForegroundColor Gray
Write-Host "  Alerting: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID" -ForegroundColor Gray
Write-Host ""

# Display next steps
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set up alert policies in Google Cloud Console:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/monitoring/alerting/policies/create?project=$PROJECT_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Recommended alerts to create:" -ForegroundColor White
Write-Host "   - High error rate (>5% of function executions)" -ForegroundColor Gray
Write-Host "   - High latency (>2s execution time)" -ForegroundColor Gray
Write-Host "   - Low FCM delivery rate (<90%)" -ForegroundColor Gray
Write-Host "   - Firestore quota approaching limit" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure notification channels:" -ForegroundColor White
Write-Host "   - Email notifications" -ForegroundColor Gray
Write-Host "   - Slack integration" -ForegroundColor Gray
Write-Host "   - SMS for critical alerts" -ForegroundColor Gray
Write-Host ""
Write-Host "4. View the MONITORING.md file for detailed instructions" -ForegroundColor White
Write-Host ""
Write-Host "5. Test monitoring by triggering some functions:" -ForegroundColor White
Write-Host "   - Create a habit" -ForegroundColor Gray
Write-Host "   - Complete a check-in" -ForegroundColor Gray
Write-Host "   - View analytics" -ForegroundColor Gray
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
