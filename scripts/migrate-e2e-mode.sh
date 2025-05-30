#!/bin/bash

# Migration script to enable e2e-fast mode after e2e-standard proves successful
# This script helps transition to faster testing while maintaining reliability

set -e

WORKFLOW_FILE=".github/workflows/e2e-optimized.yml"
BACKUP_FILE=".github/workflows/e2e-optimized.yml.standard-backup"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 E2E Testing Migration Script${NC}"
echo "This script helps migrate from e2e-standard to e2e-fast once stability is proven"

# Check if we're in the right directory
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo -e "${RED}❌ Error: Workflow file not found. Run this from project root.${NC}"
    exit 1
fi

# Function to check recent workflow success rate
check_workflow_success() {
    echo -e "${YELLOW}📊 Checking recent workflow success rate...${NC}"
    
    # This would normally use GitHub CLI to check recent runs
    # For now, we'll provide manual instructions
    echo "To check your workflow success rate:"
    echo "1. Run: gh run list --workflow='E2E Tests (Cost Optimized)' --limit=10"
    echo "2. Look for consistent ✅ success status"
    echo "3. If you see 3+ consecutive successes, you can migrate to fast mode"
    echo ""
}

# Function to migrate to fast mode
migrate_to_fast() {
    echo -e "${YELLOW}🔄 Migrating to fast mode...${NC}"
    
    # Create backup of current (standard) configuration
    cp "$WORKFLOW_FILE" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Update workflow to use fast mode
    sed -i.tmp 's/npm run test:e2e$/npm run test:e2e:fast/' "$WORKFLOW_FILE"
    sed -i.tmp 's/Run E2E tests (standard mode)/Run E2E tests (fast mode)/' "$WORKFLOW_FILE"
    sed -i.tmp '/timeout-minutes: 15/c\        timeout-minutes: 10  # Reduced for fast mode' "$WORKFLOW_FILE"
    
    # Add fast mode environment variables
    sed -i.tmp '/NEXTAUTH_URL: "http:\/\/localhost:3000"/a\
      PLAYWRIGHT_FAST_MODE: true\
      PLAYWRIGHT_PERF_LOG: true' "$WORKFLOW_FILE"
    
    # Remove temporary file
    rm -f "$WORKFLOW_FILE.tmp"
    
    echo -e "${GREEN}✅ Migration to fast mode completed!${NC}"
    echo "Changes made:"
    echo "- Switched to npm run test:e2e:fast"
    echo "- Reduced timeout to 10 minutes"
    echo "- Added PLAYWRIGHT_FAST_MODE=true"
    echo "- Added PLAYWRIGHT_PERF_LOG=true"
    echo ""
    echo "Commit these changes when ready to deploy fast mode."
}

# Function to revert to standard mode
revert_to_standard() {
    echo -e "${YELLOW}🔄 Reverting to standard mode...${NC}"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Error: Backup file not found. Cannot revert.${NC}"
        exit 1
    fi
    
    cp "$BACKUP_FILE" "$WORKFLOW_FILE"
    echo -e "${GREEN}✅ Reverted to standard mode using backup${NC}"
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1) Check workflow success rate"
echo "2) Migrate to fast mode (after standard proves stable)"
echo "3) Revert to standard mode"
echo "4) Show current configuration"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        check_workflow_success
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚠️  Warning: Only migrate to fast mode if standard mode is consistently successful${NC}"
        read -p "Are you sure you want to proceed? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            migrate_to_fast
        else
            echo "Migration cancelled."
        fi
        ;;
    3)
        revert_to_standard
        ;;
    4)
        echo -e "${YELLOW}📄 Current configuration:${NC}"
        if grep -q "test:e2e:fast" "$WORKFLOW_FILE"; then
            echo "Mode: Fast (optimized)"
        else
            echo "Mode: Standard"
        fi
        
        echo "Timeouts:"
        grep -A1 "timeout-minutes:" "$WORKFLOW_FILE" || echo "  Not explicitly set"
        
        echo "Environment variables:"
        grep -A5 "env:" "$WORKFLOW_FILE" | head -10
        ;;
    5)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac
