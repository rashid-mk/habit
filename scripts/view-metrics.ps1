# View Monitoring Metrics Script
# Quick script to view key metrics and logs

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Blue
Write-Host "Habit Tracker - Metrics Viewer" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version
} catch {
    Write-Host "Error: Firebase CLI is not installed." -ForegroundColor Red
    exit 1
}

# Get current project
$projectOutput = firebase use 2>&1 | Out-String
if ($projectOutput -match "active project.*\(([^)]+)\)") {
    $PROJECT_ID = $matches[1]
} else {
    Write-Host "Error: No Firebase project selected." -ForegroundColor Red
    exit 1
}

Write-Host "Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "Select an option:" -ForegroundColor White
Write-Host "1. View recent function logs"
Write-Host "2. View function errors"
Write-Host "3. View createHabit logs"
Write-Host "4. View onCheckWrite logs"
Write-Host "5. View sendReminder logs"
Write-Host "6. View performance metrics"
Write-Host "7. View all functions status"
Write-Host "8. Follow logs in real-time"
Write-Host ""
$option = Read-Host "Enter option (1-8)"

switch ($option) {
    "1" {
        Write-Host "`nRecent function logs (last 50 lines):" -ForegroundColor Yellow
        firebase functions:log --limit 50
    }
    "2" {
        Write-Host "`nFunction errors:" -ForegroundColor Yellow
        $logs = firebase functions:log --limit 100 2>&1 | Out-String
        $errors = $logs -split "`n" | Select-String -Pattern "error" -CaseSensitive:$false
        if ($errors) {
            $errors
        } else {
            Write-Host "No errors found" -ForegroundColor Green
        }
    }
    "3" {
        Write-Host "`ncreateHabit function logs:" -ForegroundColor Yellow
        firebase functions:log --only createHabit --limit 20
    }
    "4" {
        Write-Host "`nonCheckWrite function logs:" -ForegroundColor Yellow
        firebase functions:log --only onCheckWrite --limit 20
    }
    "5" {
        Write-Host "`nsendReminder function logs:" -ForegroundColor Yellow
        firebase functions:log --only sendReminder --limit 20
    }
    "6" {
        Write-Host "`nPerformance metrics:" -ForegroundColor Yellow
        Write-Host "Opening Firebase Performance Monitoring..."
        Write-Host "URL: https://console.firebase.google.com/project/$PROJECT_ID/performance"
        Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/performance"
    }
    "7" {
        Write-Host "`nAll functions status:" -ForegroundColor Yellow
        firebase functions:list
    }
    "8" {
        Write-Host "`nFollowing logs in real-time (Ctrl+C to stop):" -ForegroundColor Yellow
        firebase functions:log --follow
    }
    default {
        Write-Host "Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
