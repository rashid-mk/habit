#!/bin/bash

# View Monitoring Metrics Script
# Quick script to view key metrics and logs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Habit Tracker - Metrics Viewer"
echo -e "==========================================${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed.${NC}"
    exit 1
fi

# Get current project
PROJECT_ID=$(firebase use | grep "active project" | awk '{print $NF}' | tr -d '()')

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No Firebase project selected.${NC}"
    exit 1
fi

echo -e "${GREEN}Project: $PROJECT_ID${NC}"
echo ""

# Menu
echo "Select an option:"
echo "1. View recent function logs"
echo "2. View function errors"
echo "3. View createHabit logs"
echo "4. View onCheckWrite logs"
echo "5. View sendReminder logs"
echo "6. View performance metrics"
echo "7. View all functions status"
echo "8. Follow logs in real-time"
echo ""
read -p "Enter option (1-8): " option

case $option in
    1)
        echo -e "\n${YELLOW}Recent function logs (last 50 lines):${NC}"
        firebase functions:log --limit 50
        ;;
    2)
        echo -e "\n${YELLOW}Function errors:${NC}"
        firebase functions:log --limit 100 | grep -i "error" || echo "No errors found"
        ;;
    3)
        echo -e "\n${YELLOW}createHabit function logs:${NC}"
        firebase functions:log --only createHabit --limit 20
        ;;
    4)
        echo -e "\n${YELLOW}onCheckWrite function logs:${NC}"
        firebase functions:log --only onCheckWrite --limit 20
        ;;
    5)
        echo -e "\n${YELLOW}sendReminder function logs:${NC}"
        firebase functions:log --only sendReminder --limit 20
        ;;
    6)
        echo -e "\n${YELLOW}Performance metrics:${NC}"
        echo "Opening Firebase Performance Monitoring..."
        echo "URL: https://console.firebase.google.com/project/$PROJECT_ID/performance"
        ;;
    7)
        echo -e "\n${YELLOW}All functions status:${NC}"
        firebase functions:list
        ;;
    8)
        echo -e "\n${YELLOW}Following logs in real-time (Ctrl+C to stop):${NC}"
        firebase functions:log --follow
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
