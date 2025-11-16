# Script to set up Cloud Function environment variables (PowerShell)
# Usage: .\scripts\setup-env.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔧 Setting up Cloud Function environment variables..." -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "❌ Not logged in to Firebase. Run: firebase login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "This script will help you set up environment variables for Cloud Functions."
Write-Host ""

# FCM Server Key (optional)
$fcmKey = Read-Host "Enter FCM Server Key (press Enter to skip)"
if ($fcmKey) {
    firebase functions:config:set "fcm.server_key=$fcmKey"
    Write-Host "✅ FCM Server Key set" -ForegroundColor Green
}

# Cloud Tasks Queue Name (optional)
$queueName = Read-Host "Enter Cloud Tasks Queue Name (default: reminder-queue)"
if (-not $queueName) {
    $queueName = "reminder-queue"
}
firebase functions:config:set "tasks.queue_name=$queueName"
Write-Host "✅ Cloud Tasks Queue Name set to: $queueName" -ForegroundColor Green

# Cloud Tasks Location (optional)
$tasksLocation = Read-Host "Enter Cloud Tasks Location (default: us-central1)"
if (-not $tasksLocation) {
    $tasksLocation = "us-central1"
}
firebase functions:config:set "tasks.location=$tasksLocation"
Write-Host "✅ Cloud Tasks Location set to: $tasksLocation" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Current configuration:" -ForegroundColor Yellow
firebase functions:config:get

Write-Host ""
Write-Host "✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: You need to redeploy functions for changes to take effect:"
Write-Host "  npm run deploy:functions"
