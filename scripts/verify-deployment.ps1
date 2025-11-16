# Deployment verification script (PowerShell)
# Usage: .\scripts\verify-deployment.ps1 [project-id]

param(
    [string]$ProjectId
)

$ErrorActionPreference = "Continue"

if (-not $ProjectId) {
    $projectInfo = firebase use
    if ($projectInfo -match "Now using project '(.+?)'") {
        $ProjectId = $matches[1]
    }
}

if (-not $ProjectId) {
    Write-Host "❌ Could not determine project ID" -ForegroundColor Red
    Write-Host "Usage: .\scripts\verify-deployment.ps1 [project-id]"
    exit 1
}

Write-Host "🔍 Verifying deployment for project: $ProjectId" -ForegroundColor Green
Write-Host ""

# Check hosting
Write-Host "📦 Checking Firebase Hosting..." -ForegroundColor Yellow
$hostingUrl = "https://$ProjectId.web.app"

try {
    $response = Invoke-WebRequest -Uri $hostingUrl -Method Head -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Hosting is live at: $hostingUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Hosting returned error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check Cloud Functions
Write-Host "⚡ Checking Cloud Functions..." -ForegroundColor Yellow
try {
    $functions = firebase functions:list 2>&1
    if ($functions -match "createHabit|onCheckWrite|sendReminder|healthCheck") {
        Write-Host "✅ Cloud Functions deployed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not list functions (may need authentication)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not list functions" -ForegroundColor Yellow
}

Write-Host ""

# Check health endpoint
Write-Host "🏥 Checking health endpoint..." -ForegroundColor Yellow
$region = "us-central1"  # Default region
$healthUrl = "https://$region-$ProjectId.cloudfunctions.net/healthCheck"

try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check endpoint is responding" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Health check endpoint not accessible" -ForegroundColor Yellow
    Write-Host "   URL: $healthUrl" -ForegroundColor Gray
}

Write-Host ""

# Check Firestore rules
Write-Host "🔒 Checking Firestore rules..." -ForegroundColor Yellow
if (Test-Path "firestore.rules") {
    Write-Host "✅ Firestore rules file exists" -ForegroundColor Green
    try {
        firebase firestore:rules:validate firestore.rules 2>&1 | Out-Null
        Write-Host "✅ Firestore rules are valid" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not validate rules" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Firestore rules file not found" -ForegroundColor Red
}

Write-Host ""

# Check Firestore indexes
Write-Host "📑 Checking Firestore indexes..." -ForegroundColor Yellow
if (Test-Path "firestore.indexes.json") {
    Write-Host "✅ Firestore indexes file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Firestore indexes file not found" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Project ID: $ProjectId"
Write-Host "  Hosting URL: $hostingUrl"
Write-Host "  Console: https://console.firebase.google.com/project/$ProjectId"
Write-Host ""
Write-Host "🧪 Manual Testing Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] Sign up with email/password"
Write-Host "  [ ] Sign in with Google OAuth"
Write-Host "  [ ] Create a habit"
Write-Host "  [ ] Complete a check-in"
Write-Host "  [ ] View analytics on dashboard"
Write-Host "  [ ] Check timeline graph"
Write-Host "  [ ] Test offline functionality"
Write-Host ""
Write-Host "📊 Monitor your deployment:" -ForegroundColor Yellow
Write-Host "  Logs: firebase functions:log"
Write-Host "  Performance: https://console.firebase.google.com/project/$ProjectId/performance"
Write-Host "  Analytics: https://console.firebase.google.com/project/$ProjectId/analytics"
