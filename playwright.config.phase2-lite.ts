import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Phase 2 Lite Performance Optimizations - Simplified Configuration
 * 
 * Provides performance improvements through:
 * 1. Test sharding across multiple processes
 * 2. Optimized browser settings
 * 3. Advanced parallel test strategies
 * 4. Smart test distribution
 * (Without complex global setup/teardown)
 */

// Environment detection
const isCI = !!process.env.CI;
const isFastMode = process.env.PLAYWRIGHT_FAST_MODE === 'true';
const shardCount = parseInt(process.env.PLAYWRIGHT_SHARD_COUNT || '2');
const currentShard = parseInt(process.env.PLAYWRIGHT_SHARD_INDEX || '0');

// Performance monitoring
const performanceStartTime = Date.now();
process.on('exit', () => {
  if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
    const duration = Date.now() - performanceStartTime;
    console.log(`🚀 Phase 2 Lite test suite completed in ${duration}ms (Shard ${currentShard + 1}/${shardCount})`);
  }
});

// Advanced performance configuration
const getAdvancedPerformanceConfig = () => {
  if (isCI) {
    return {
      workers: Math.min(4, Math.max(2, Math.floor(shardCount * 1.5))), // Dynamic workers based on shards
      timeout: 45000, // Reduced timeout for faster failures
      retries: 1, // Fewer retries in CI with sharding
      maxFailures: 3, // Stop early if too many failures
    };
  } else {
    return {
      workers: Math.min(6, Math.max(3, shardCount * 2)), // More aggressive local parallelization
      timeout: 30000, // Even faster timeouts locally
      retries: 0, // No retries for faster feedback
      maxFailures: 1, // Fail fast for development
    };
  }
};

const config = getAdvancedPerformanceConfig();

export default defineConfig({
  testDir: './e2e-tests',
  
  /* Use existing optimized global setup */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* Phase 2 Performance Optimizations */
  workers: config.workers,
  timeout: config.timeout,
  retries: config.retries,
  maxFailures: config.maxFailures,
  
  /* Test Sharding Configuration */
  shard: process.env.PLAYWRIGHT_SHARD_COUNT ? {
    total: shardCount,
    current: currentShard + 1,
  } : undefined,
  
  /* Advanced Browser Management */
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list', { printSteps: false }],
    ['html', { 
      outputFolder: `playwright-report-shard-${currentShard}`,
      open: 'never' 
    }],
    ['junit', { 
      outputFile: `test-results/junit-shard-${currentShard}.xml` 
    }],
  ],
  
  /* Optimized Browser Settings */
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Phase 2: Browser Performance Optimizations
    launchOptions: {
      // Faster browser startup
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Skip image loading for faster tests
        '--disable-javascript-harmony-shipping',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        // Additional optimizations
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
        '--no-first-run',
      ],
      headless: process.env.PLAYWRIGHT_HEADED !== 'true',
    },
    
    // Faster navigation and actions
    actionTimeout: config.timeout * 0.5,
    navigationTimeout: config.timeout * 0.7,
  },

  /* Advanced Project Configuration with Smart Distribution */
  projects: [
    // Shard 0: Fast independent tests (authentication and basic functionality)
    ...(currentShard === 0 ? [{
      name: 'fast-independent-shard-0',
      testMatch: [
        '**/auth.spec.ts',
        '**/toast-component.spec.ts',
        '**/toast-notification.spec.ts',
        '**/verify-toast-implementation.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        actionTimeout: 8000,
        navigationTimeout: 15000,
      },
      fullyParallel: true,
    }] : []),

    // Shard 1: Gallery and feature tests
    ...(currentShard === 1 || shardCount === 1 ? [{
      name: 'gallery-tests-shard-1',
      testMatch: [
        '**/gallery.spec.ts',
        '**/gallery-edit.spec.ts',
        '**/gallery-management.spec.ts',
        '**/setup-gallery.spec.ts',
        '**/simple-gallery-toast.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
        actionTimeout: 10000,
      },
      fullyParallel: false, // Sequential for data safety
    }] : []),

    // Shard 2+: Workflow and comprehensive tests
    ...(currentShard >= 2 || (shardCount === 1 && currentShard === 0) ? [{
      name: `workflow-tests-shard-${currentShard}`,
      testMatch: [
        '**/comprehensive-gallery-workflow.spec.ts',
        '**/01-auth-lifecycle.spec.ts',
        '**/02-feature-tests.spec.ts',
        '**/authenticated.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
        actionTimeout: 8000,
      },
      fullyParallel: true,
    }] : []),

    // Cleanup tests (only on last shard)
    ...(currentShard === shardCount - 1 ? [{
      name: 'cleanup-tests-final-shard',
      testMatch: [
        '**/03-data-cleanup.spec.ts',
        '**/04-final-user-deletion.spec.ts',
        '**/e2e-cleanup-comprehensive.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      fullyParallel: false,
    }] : []),
  ],

  /* Optimized Web Server Configuration */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 90000,
    stdout: 'pipe',
    stderr: 'pipe',
    // Server optimization
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'test',
    },
  },
});
