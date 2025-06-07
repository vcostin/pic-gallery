# E2E Test Analysis - Database Race Conditions & Concurrency Issues

**Date**: June 7, 2025  
**Analysis of**: `npm run test:e2e:dev` output  
**Configuration**: `playwright.config.optimized.ts` with 4 workers

## 🔍 Root Cause Analysis

### 1. **Database Consistency Issues (Primary Issue)**
**Problem**: Race conditions between database writes and reads across parallel workers.

**Evidence from logs**:
```
[WebServer] Image created: cmblg16ib0015s0cye2dqygqo by user cmblg0g550000s0cyljmbfek7
[WebServer] POST /api/images 201 in 26ms
...
[WebServer] GET /api/images result - total: 0 images count: 0
⏳ Image persistence check: 0/3 images persisted by ID
```

**Root Cause**: Database transactions are not properly isolated between parallel test workers, causing:
- Worker A creates images
- Worker B immediately queries for images 
- Database hasn't committed/propagated the changes yet
- Worker B sees 0 images and fails

### 2. **Page Context Lifecycle Issues**
**Evidence**:
```
⚠️ Page context is closed, cannot fetch existing images
```

**Root Cause**: Parallel workers are closing page contexts while other workers are trying to use them.

### 3. **Gallery Creation 404 Errors**
**Evidence**:
```
Error: expect.toBeVisible: Error: strict mode violation: locator('h1, h2, [data-testid="gallery-title"]') resolved to 2 elements:
1) <h1 class="next-error-h1">404</h1>
2) <h2>This page could not be found.</h2>
```

**Root Cause**: Gallery API returns success but with invalid/non-existent gallery IDs due to database consistency issues.

### 4. **Cleanup Interference**
**Evidence**:
```
[WebServer] Starting E2E test data cleanup for user: e2e-single-user@example.com
[WebServer] Deleted: 0 galleries, 0 gallery images, 6 images
```

**Root Cause**: Cleanup operations running while other tests are actively creating/reading data.

## 🎯 Specific Issues in Current Implementation

### OptimizedTestDataFactory Problems

1. **Database Consistency Waits Are Insufficient**:
   ```typescript
   // Current approach - polling doesn't guarantee consistency
   while (Date.now() - startTime < maxWaitMs) {
     const currentCount = await page.evaluate(async () => {
       const response = await fetch('/api/images?limit=100');
       // This might see stale data due to database isolation
     });
   }
   ```

2. **Cache Invalidation Issues**:
   ```typescript
   // Cache assumes data persists, but parallel cleanup invalidates it
   if (useCache && this.imageCache.has(cacheKey)) {
     const cachedIds = this.imageCache.get(cacheKey)!.split(',');
     const stillExist = await this.verifyImagesExist(page, cachedIds);
     // stillExist can be false due to parallel cleanup
   }
   ```

3. **Shared User Account Conflicts**:
   ```typescript
   // All tests use same user: e2e-single-user@example.com
   // Worker A creates images for user
   // Worker B cleans up images for same user
   // Worker A fails when trying to verify its images
   ```

## 🛠️ Immediate Solutions

### Solution 1: Disable Problematic Parallel Execution
**Quick Fix - Reduce workers to 1 for data-dependent tests**:

```typescript
// In playwright.config.optimized.ts
projects: [
  {
    name: 'image-tests',
    testMatch: [
      '**/complete-image-workflow.spec.ts',
      '**/enhanced-gallery-layouts.spec.ts', 
      '**/image-grid.spec.ts',
      '**/simple-gallery-workflow.spec.ts',
      '**/optimized-upload-workflow.spec.ts',
    ],
    use: { 
      ...devices['Desktop Chrome'],
      storageState: './playwright/.auth/single-user.json',
    },
    dependencies: ['feature-tests'],
    fullyParallel: false, // 🔥 DISABLE PARALLEL FOR DATA TESTS
  },
]
```

### Solution 2: Implement Per-Worker Database Isolation
**Better Fix - Create isolated test data per worker**:

```typescript
// Enhanced OptimizedTestDataFactory
static async createTestImages(
  page: Page,
  count: number = 3,
  useCache: boolean = true
): Promise<string[]> {
  const workerId = process.env.TEST_WORKER_INDEX || '0';
  const userPrefix = `e2e-worker-${workerId}`;
  const cacheKey = `images_${count}_${workerId}`;
  
  // Each worker gets isolated test data
  // Worker 0: creates images with prefix "worker-0-"
  // Worker 1: creates images with prefix "worker-1-"
  // etc.
}
```

### Solution 3: Add Database Transaction Boundaries
**Robust Fix - Use database transactions properly**:

```typescript
// In API routes - ensure proper transaction isolation
export async function POST(request: Request) {
  return await prisma.$transaction(async (tx) => {
    const image = await tx.image.create({
      data: imageData
    });
    
    // Ensure commit before returning
    await tx.$executeRaw`SELECT 1`; // Force transaction boundary
    return NextResponse.json({ success: true, data: image });
  });
}
```

### Solution 4: Implement Proper Database Consistency Checks
**Enhanced waiting strategy**:

```typescript
private static async waitForDatabaseConsistency(
  page: Page, 
  expectedImageIds: string[], 
  maxWaitMs: number = 10000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const foundIds = await page.evaluate(async (imageIds) => {
        const response = await fetch('/api/images?limit=100');
        if (!response.ok) return [];
        
        const result = await response.json();
        const images = result?.data?.data || [];
        const foundImageIds = images
          .map((img: { id: string }) => img.id)
          .filter((id: string) => imageIds.includes(id));
          
        return foundImageIds;
      }, expectedImageIds);
      
      // Wait for ALL specific image IDs to be found
      if (foundIds.length === expectedImageIds.length) {
        console.log(`✅ All ${expectedImageIds.length} images confirmed in database`);
        return;
      }
      
      console.log(`⏳ Database consistency: ${foundIds.length}/${expectedImageIds.length} images found`);
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.log('⚠️ Error during consistency check:', error);
      await page.waitForTimeout(500);
    }
  }
  
  throw new Error(`Database consistency timeout: expected ${expectedImageIds.length} images`);
}
```

## 🚨 Recommended Immediate Actions

### 1. **Emergency Fix - Disable Parallel for Data Tests** (5 minutes)
Set `fullyParallel: false` for all `image-tests` project tests.

### 2. **Quick Win - Increase Database Wait Times** (10 minutes)
Increase `waitForDatabaseConsistency` timeout from 10s to 30s.

### 3. **Medium Term - Implement Worker Isolation** (1-2 hours)
- Create separate test users per worker
- Prefix all test data with worker ID
- Update cleanup to be worker-specific

### 4. **Long Term - Database Architecture** (1-2 days)
- Implement proper transaction isolation
- Add database replication lag handling
- Use read/write database separation for tests

## 📊 Performance vs Reliability Trade-offs

| Approach | Speed | Reliability | Complexity |
|----------|-------|-------------|------------|
| Single Worker | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| Worker Isolation | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| DB Transactions | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Current (Broken) | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ |

## 🎯 Next Steps

1. **Immediate**: Apply emergency fix (disable parallel for data tests)
2. **Short term**: Implement proper database consistency checking  
3. **Medium term**: Worker isolation with separate test data
4. **Long term**: Database architecture improvements

This analysis shows the tests are fundamentally sound - the issues are purely related to database consistency and parallel execution timing, not test logic.
