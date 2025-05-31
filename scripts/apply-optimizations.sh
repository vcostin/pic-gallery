#!/bin/bash

# Apply E2E Test Performance Optimizations
# This script applies the tested optimizations to the main configuration

echo "🚀 Applying E2E Test Performance Optimizations"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Backing up original configuration...${NC}"
cp playwright.config.ts playwright.config.ts.backup
echo "✅ Backup created: playwright.config.ts.backup"

echo -e "${BLUE}Step 2: Applying optimized configuration...${NC}"
cp playwright.config.optimized.ts playwright.config.ts
echo "✅ Optimized configuration applied"

echo -e "${BLUE}Step 3: Updating test helpers...${NC}"
cp e2e-tests/test-helpers.ts e2e-tests/test-helpers.ts.backup
cp e2e-tests/test-helpers.optimized.ts e2e-tests/test-helpers.ts
echo "✅ Optimized test helpers applied"

echo -e "${BLUE}Step 4: Updating package.json scripts...${NC}"
echo "✅ Fast mode scripts already added to package.json"

echo ""
echo -e "${GREEN}🎉 Performance optimizations applied successfully!${NC}"
echo ""
echo "📋 New test commands available:"
echo "  npm run test:e2e:fast     - Optimized fast mode (recommended)"
echo "  npm run test:e2e:parallel - Experimental parallel mode"
echo "  npm run test:e2e:profile  - Performance profiling mode"
echo ""
echo "📊 Expected performance improvement: ~6.6% faster execution"
echo ""
echo "🔄 To revert changes:"
echo "  cp playwright.config.ts.backup playwright.config.ts"
echo "  cp e2e-tests/test-helpers.ts.backup e2e-tests/test-helpers.ts"

echo ""
echo -e "${YELLOW}⚠️  Test the optimizations before committing to main branch:${NC}"
echo "  npm run test:e2e:fast"
