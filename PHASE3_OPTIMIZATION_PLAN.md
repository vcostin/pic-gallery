# Phase 3 Optimization Plan

## Objectives
1. **Fix Prisma Client Import Warnings** - Optimize Prisma client generation and imports
2. **Implement Build Cache Optimization** - Configure Next.js build caching for faster rebuilds
3. **E2E Selector Optimization** - Replace timeouts with proper waitForSelector methods

## Current Issues Identified

### 1. Prisma Import Warnings
- Currently using `@/lib/generated/prisma-client` which may not be properly generated
- Need to optimize Prisma client instantiation and caching
- Multiple imports across codebase need standardization

### 2. Build Cache Missing
- Next.js config lacks build cache configuration
- No caching strategy for production builds
- Missing cache directories in `.gitignore`

### 3. E2E Timeout Issues
Found the following timeout usage that should be replaced with selectors:
- `waitForTimeout(1000)` in e2e-cleanup-comprehensive.spec.ts (line 106, 156)
- `waitForTimeout(1000)` in 04-final-user-deletion.spec.ts (line 47)
- `waitForTimeout(2000)` in 04-final-user-deletion.spec.ts (line 68, 95)
- `setTimeout` usage in gallery-edit.spec.ts (line 156)
- `setTimeout` in simple-gallery-toast.spec.ts (line 34)
- Multiple `isVisible()` checks that should use `expect().toBeVisible()`

## Implementation Plan

### Phase 3a: Prisma Optimization
1. Fix Prisma client generation and imports
2. Optimize database connection pooling
3. Standardize import patterns

### Phase 3b: Build Cache Implementation
1. Configure Next.js build cache
2. Add cache directories and ignore patterns
3. Optimize build performance

### Phase 3c: E2E Selector Optimization
1. Replace all `waitForTimeout` with `waitForSelector`
2. Convert `isVisible()` checks to `expect().toBeVisible()`
3. Implement proper wait strategies throughout test suite
4. Update test helpers with optimized waiting patterns

## Expected Benefits
- Eliminate Prisma import warnings
- 20-30% faster build times with proper caching
- More reliable E2E tests with proper selector waiting
- Cleaner, more maintainable test code
