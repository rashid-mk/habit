#!/bin/bash

# Script to set up Cloud Function environment variables
# Usage: ./scripts/setup-env.sh

set -e

echo "🔧 Setting up Cloud Function environment variables..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Run: firebase login"
    exit 1
fi

echo ""
echo "This script will help you set up environment variables for Cloud Functions."
echo ""

# FCM Server Key (optional)
read -p "Enter FCM Server Key (press Enter to skip): " fcm_key
if [ ! -z "$fcm_key" ]; then
    firebase functions:config:set fcm.server_key="$fcm_key"
    echo "✅ FCM Server Key set"
fi

# Cloud Tasks Queue Name (optional)
read -p "Enter Cloud Tasks Queue Name (default: reminder-queue): " queue_name
queue_name=${queue_name:-reminder-queue}
firebase functions:config:set tasks.queue_name="$queue_name"
echo "✅ Cloud Tasks Queue Name set to: $queue_name"

# Cloud Tasks Location (optional)
read -p "Enter Cloud Tasks Location (default: us-central1): " tasks_location
tasks_location=${tasks_location:-us-central1}
firebase functions:config:set tasks.location="$tasks_location"
echo "✅ Cloud Tasks Location set to: $tasks_location"

echo ""
echo "📋 Current configuration:"
firebase functions:config:get

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "Note: You need to redeploy functions for changes to take effect:"
echo "  npm run deploy:functions"
