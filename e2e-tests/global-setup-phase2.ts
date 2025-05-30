import { chromium, Page, Browser, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { TEST_USER, TestUser } from './auth-config';

/**
 * Phase 2 Global Setup - Advanced Performance Optimizations
 * 
 * Implements:
 * 1. Browser instance pooling for faster test execution
 * 2. Database connection optimization
 * 3. Pre-warmed authentication states
 * 4. Shared resource management across shards
 * 5. Performance monitoring and metrics collection
 */

// Browser instance pool for reuse
let browserPool: Browser[] = [];
let contextPool: BrowserContext[] = [];
const maxPoolSize = parseInt(process.env.PLAYWRIGHT_POOL_SIZE || '3');

// Performance metrics
const metrics = {
  setupStartTime: Date.now(),
  browserLaunchTime: 0,
  authStateCreationTime: 0,
  databaseOptimizationTime: 0,
};

async function createOptimizedBrowser(): Promise<Browser> {
  const launchStart = Date.now();
  
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADED !== 'true',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript-harmony-shipping',
      '--memory-pressure-off',
      '--max_old_space_size=4096',
      // Phase 2: Additional optimizations
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-networking',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
    ],
  });
  
  metrics.browserLaunchTime += Date.now() - launchStart;
  return browser;
}

async function createBrowserPool(): Promise<void> {
  console.log(`🔧 Creating browser pool with ${maxPoolSize} instances...`);
  
  const browsers = await Promise.all(
    Array(maxPoolSize).fill(null).map(() => createOptimizedBrowser())
  );
  
  browserPool.push(...browsers);
  console.log(`✅ Browser pool created with ${browserPool.length} instances`);
}

async function createOptimizedContext(browser: Browser): Promise<BrowserContext> {
  return await browser.newContext({
    // Phase 2: Context optimizations
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Disable unnecessary features for faster execution
    javaScriptEnabled: true,
    acceptDownloads: false,
    hasTouch: false,
    isMobile: false,
    permissions: [], // No permissions needed
    // Optimize for performance
    extraHTTPHeaders: {
      'x-e2e-test': 'true',
      'x-phase2-optimization': 'true',
    },
  });
}

async function optimizeDatabase(): Promise<void> {
  const dbOptStart = Date.now();
  
  try {
    console.log('🗃️  Optimizing database for Phase 2 performance...');
    
    // Create a temporary browser for database operations
    const browser = await createOptimizedBrowser();
    const context = await createOptimizedContext(browser);
    const page = await context.newPage();
    
    // Navigate to base URL to establish connection
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000');
    
    // Warm up database connection pool
    try {
      await page.request.get('/api/health', { timeout: 5000 });
      console.log('✅ Database connection pool warmed up');
    } catch (error) {
      console.log('⚠️  Database warmup failed, continuing...');
    }
    
    // Pre-create any database optimizations
    try {
      // Clear any existing test data
      await page.request.delete('/api/e2e/cleanup-all', {
        data: { force: true },
        timeout: 10000,
      });
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.log('ℹ️  Database cleanup skipped (normal if no existing data)');
    }
    
    await browser.close();
    
  } catch (error) {
    console.log('⚠️  Database optimization failed, continuing with standard setup');
  }
  
  metrics.databaseOptimizationTime = Date.now() - dbOptStart;
}

async function createPreWarmedAuthStates(): Promise<void> {
  const authStart = Date.now();
  
  console.log('🔐 Creating pre-warmed authentication states...');
  
  try {
    const browser = browserPool[0] || await createOptimizedBrowser();
    const context = await createOptimizedContext(browser);
    const page = await context.newPage();
    
    // Delete any existing test user
    console.log(`🗑️  Cleaning up existing test user (${TEST_USER.email})...`);
    try {
      const deleteResult = await page.request.delete('/api/e2e/delete-user', {
        data: { email: TEST_USER.email },
        timeout: 10000
      });
      
      if (deleteResult.ok()) {
        console.log('✅ Existing test user cleaned up');
      }
    } catch {
      console.log('ℹ️  No existing test user found');
    }
    
    // Create optimized test user
    console.log('📝 Creating optimized test user...');
    await createUser(page, TEST_USER);
    
    // Save authentication state
    await saveAuthState(page, TEST_USER);
    
    // Create additional auth states for parallel testing
    const authDir = path.join(__dirname, '../playwright/.auth');
    const mainAuthPath = path.join(authDir, 'single-user.json');
    
    // Create copies for different shards
    for (let i = 0; i < 3; i++) {
      const shardAuthPath = path.join(authDir, `single-user-shard-${i}.json`);
      if (fs.existsSync(mainAuthPath)) {
        fs.copyFileSync(mainAuthPath, shardAuthPath);
      }
    }
    
    console.log('✅ Pre-warmed authentication states created');
    
    if (!browserPool.includes(browser)) {
      await browser.close();
    }
    
  } catch (error) {
    console.error('❌ Failed to create pre-warmed auth states:', error);
    throw error;
  }
  
  metrics.authStateCreationTime = Date.now() - authStart;
}

async function createUser(page: Page, user: TestUser): Promise<void> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseURL}/auth/register`);
  await page.waitForLoadState('networkidle');
  
  // Fill registration form with optimized selectors
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  
  // Submit and wait for completion
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForURL('**/dashboard', { timeout: 15000 }),
  ]);
  
  console.log(`✅ Optimized user created: ${user.email}`);
}

async function saveAuthState(page: Page, user: TestUser): Promise<void> {
  const authDir = path.join(__dirname, '../playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  await page.context().storageState({ path: user.storageStatePath });
  console.log(`✅ Authentication state saved: ${user.email}`);
}

async function phase2GlobalSetup(): Promise<void> {
  console.log('🚀 Starting Phase 2 Global Setup - Advanced Performance Optimizations...');
  
  const currentShard = parseInt(process.env.PLAYWRIGHT_SHARD_INDEX || '0');
  const shardCount = parseInt(process.env.PLAYWRIGHT_SHARD_COUNT || '1');
  
  console.log(`📊 Shard ${currentShard + 1}/${shardCount} initializing...`);
  
  try {
    // Step 1: Database optimizations (only on shard 0)
    if (currentShard === 0) {
      await optimizeDatabase();
    }
    
    // Step 2: Create browser pool
    await createBrowserPool();
    
    // Step 3: Pre-warm authentication states (only on shard 0)
    if (currentShard === 0) {
      await createPreWarmedAuthStates();
    } else {
      // Wait for auth states to be created by shard 0
      console.log('⏳ Waiting for authentication states from shard 0...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Report performance metrics
    const totalSetupTime = Date.now() - metrics.setupStartTime;
    
    if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
      console.log('\n📊 Phase 2 Setup Performance Metrics:');
      console.log(`   Total setup time: ${totalSetupTime}ms`);
      console.log(`   Browser launch time: ${metrics.browserLaunchTime}ms`);
      console.log(`   Auth state creation: ${metrics.authStateCreationTime}ms`);
      console.log(`   Database optimization: ${metrics.databaseOptimizationTime}ms`);
      console.log(`   Browser pool size: ${browserPool.length}`);
    }
    
    console.log(`✅ Phase 2 setup completed for shard ${currentShard + 1}/${shardCount} in ${totalSetupTime}ms`);
    
  } catch (error) {
    console.error('❌ Phase 2 global setup failed:', error);
    // Cleanup on failure
    await Promise.all(browserPool.map(browser => browser.close().catch(() => {})));
    browserPool = [];
    throw error;
  }
}

export default phase2GlobalSetup;
