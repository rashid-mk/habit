# Deployment script for Habit Experiment Tracker (PowerShell)
# Usage: .\scripts\deploy.ps1 [environment] [component]
# Examples:
#   .\scripts\deploy.ps1 production all
#   .\scripts\deploy.ps1 staging hosting
#   .\scripts\deploy.ps1 production functions

param(
    [string]$Environment = "production",
    [string]$Component = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment to $Environment..." -ForegroundColor Green

# Switch to the correct Firebase project
Write-Host "📋 Switching to $Environment project..." -ForegroundColor Yellow
firebase use $Environment

# Run pre-deployment checks
Write-Host "🔍 Running pre-deployment checks..." -ForegroundColor Yellow

# Check if .firebaserc exists
if (-not (Test-Path .firebaserc)) {
    Write-Host "❌ Error: .firebaserc not found" -ForegroundColor Red
    exit 1
}

# Check if firebase.json exists
if (-not (Test-Path firebase.json)) {
    Write-Host "❌ Error: firebase.json not found" -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host "🔍 Running TypeScript checks..." -ForegroundColor Yellow
npm run lint

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm run test

# Deploy based on component
switch ($Component) {
    "all" {
        Write-Host "📦 Building frontend..." -ForegroundColor Yellow
        npm run build
        
        Write-Host "📦 Building Cloud Functions..." -ForegroundColor Yellow
        Push-Location functions
        npm run build
        Pop-Location
        
        Write-Host "🚀 Deploying everything..." -ForegroundColor Yellow
        firebase deploy
    }
    
    "hosting" {
        Write-Host "📦 Building frontend..." -ForegroundColor Yellow
        npm run build
        
        Write-Host "🚀 Deploying hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
    }
    
    "functions" {
        Write-Host "📦 Building Cloud Functions..." -ForegroundColor Yellow
        Push-Location functions
        npm run build
        Pop-Location
        
        Write-Host "🚀 Deploying functions..." -ForegroundColor Yellow
        firebase deploy --only functions
    }
    
    "rules" {
        Write-Host "🚀 Deploying Firestore rules..." -ForegroundColor Yellow
        firebase deploy --only firestore:rules
    }
    
    default {
        Write-Host "❌ Unknown component: $Component" -ForegroundColor Red
        Write-Host "Valid components: all, hosting, functions, rules"
        exit 1
    }
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Show deployment URL
if ($Component -eq "all" -or $Component -eq "hosting") {
    $projectInfo = firebase use
    if ($projectInfo -match "Now using project '(.+?)'") {
        $projectId = $matches[1]
        Write-Host "🌐 Your app is live at: https://$projectId.web.app" -ForegroundColor Green
        Write-Host "📊 View logs: firebase functions:log" -ForegroundColor Yellow
        Write-Host "📈 Monitor: https://console.firebase.google.com/project/$projectId" -ForegroundColor Yellow
    }
}
