#!/bin/bash

# Deployment verification script
# Usage: ./scripts/verify-deployment.sh [project-id]

set -e

PROJECT_ID=${1:-$(firebase use | grep "Now using project" | awk '{print $4}' | tr -d "'")}

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not determine project ID"
    echo "Usage: ./scripts/verify-deployment.sh [project-id]"
    exit 1
fi

echo "🔍 Verifying deployment for project: $PROJECT_ID"
echo ""

# Check hosting
echo "📦 Checking Firebase Hosting..."
HOSTING_URL="https://${PROJECT_ID}.web.app"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HOSTING_URL)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Hosting is live at: $HOSTING_URL"
else
    echo "❌ Hosting returned status: $HTTP_STATUS"
fi

echo ""

# Check Cloud Functions
echo "⚡ Checking Cloud Functions..."
firebase functions:list 2>/dev/null | grep -E "createHabit|onCheckWrite|sendReminder|healthCheck" || echo "⚠️  Could not list functions (may need authentication)"

echo ""

# Check health endpoint
echo "🏥 Checking health endpoint..."
REGION=$(firebase functions:config:get 2>/dev/null | grep -o "us-central1" || echo "us-central1")
HEALTH_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/healthCheck"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health check endpoint is responding"
    HEALTH_RESPONSE=$(curl -s $HEALTH_URL 2>/dev/null)
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "⚠️  Health check endpoint returned status: $HEALTH_STATUS"
    echo "   URL: $HEALTH_URL"
fi

echo ""

# Check Firestore rules
echo "🔒 Checking Firestore rules..."
if [ -f "firestore.rules" ]; then
    echo "✅ Firestore rules file exists"
    firebase firestore:rules:validate firestore.rules 2>/dev/null && echo "✅ Firestore rules are valid" || echo "⚠️  Could not validate rules"
else
    echo "❌ Firestore rules file not found"
fi

echo ""

# Check Firestore indexes
echo "📑 Checking Firestore indexes..."
if [ -f "firestore.indexes.json" ]; then
    echo "✅ Firestore indexes file exists"
else
    echo "❌ Firestore indexes file not found"
fi

echo ""

# Summary
echo "📊 Deployment Summary:"
echo "  Project ID: $PROJECT_ID"
echo "  Hosting URL: $HOSTING_URL"
echo "  Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "🧪 Manual Testing Checklist:"
echo "  [ ] Sign up with email/password"
echo "  [ ] Sign in with Google OAuth"
echo "  [ ] Create a habit"
echo "  [ ] Complete a check-in"
echo "  [ ] View analytics on dashboard"
echo "  [ ] Check timeline graph"
echo "  [ ] Test offline functionality"
echo ""
echo "📊 Monitor your deployment:"
echo "  Logs: firebase functions:log"
echo "  Performance: https://console.firebase.google.com/project/$PROJECT_ID/performance"
echo "  Analytics: https://console.firebase.google.com/project/$PROJECT_ID/analytics"
