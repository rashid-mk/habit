#!/bin/bash

# Deployment script for Habit Experiment Tracker
# Usage: ./scripts/deploy.sh [environment] [component]
# Examples:
#   ./scripts/deploy.sh production all
#   ./scripts/deploy.sh staging hosting
#   ./scripts/deploy.sh production functions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
COMPONENT=${2:-all}

echo -e "${GREEN}🚀 Starting deployment to ${ENVIRONMENT}...${NC}"

# Switch to the correct Firebase project
echo -e "${YELLOW}📋 Switching to ${ENVIRONMENT} project...${NC}"
firebase use $ENVIRONMENT

# Run pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if .firebaserc exists
if [ ! -f .firebaserc ]; then
    echo -e "${RED}❌ Error: .firebaserc not found${NC}"
    exit 1
fi

# Check if firebase.json exists
if [ ! -f firebase.json ]; then
    echo -e "${RED}❌ Error: firebase.json not found${NC}"
    exit 1
fi

# Run linting
echo -e "${YELLOW}🔍 Running TypeScript checks...${NC}"
npm run lint

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test

# Deploy based on component
case $COMPONENT in
    all)
        echo -e "${YELLOW}📦 Building frontend...${NC}"
        npm run build
        
        echo -e "${YELLOW}📦 Building Cloud Functions...${NC}"
        cd functions
        npm run build
        cd ..
        
        echo -e "${YELLOW}🚀 Deploying everything...${NC}"
        firebase deploy
        ;;
    
    hosting)
        echo -e "${YELLOW}📦 Building frontend...${NC}"
        npm run build
        
        echo -e "${YELLOW}🚀 Deploying hosting...${NC}"
        firebase deploy --only hosting
        ;;
    
    functions)
        echo -e "${YELLOW}📦 Building Cloud Functions...${NC}"
        cd functions
        npm run build
        cd ..
        
        echo -e "${YELLOW}🚀 Deploying functions...${NC}"
        firebase deploy --only functions
        ;;
    
    rules)
        echo -e "${YELLOW}🚀 Deploying Firestore rules...${NC}"
        firebase deploy --only firestore:rules
        ;;
    
    *)
        echo -e "${RED}❌ Unknown component: $COMPONENT${NC}"
        echo "Valid components: all, hosting, functions, rules"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Show deployment URL
if [ "$COMPONENT" = "all" ] || [ "$COMPONENT" = "hosting" ]; then
    PROJECT_ID=$(firebase use | grep "Now using project" | awk '{print $4}' | tr -d "'")
    echo -e "${GREEN}🌐 Your app is live at: https://${PROJECT_ID}.web.app${NC}"
fi

echo -e "${YELLOW}📊 View logs: firebase functions:log${NC}"
echo -e "${YELLOW}📈 Monitor: https://console.firebase.google.com/project/${PROJECT_ID}${NC}"
