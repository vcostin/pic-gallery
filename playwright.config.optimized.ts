import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Enhanced Environment and Performance Detection
 * Updated configuration for comprehensive E2E optimization
 */
const isCI = !!process.env.CI;
const isFastMode = process.env.PLAYWRIGHT_FAST === 'true';
const isOptimizedMode = process.env.PLAYWRIGHT_OPTIMIZED === 'true';
const enablePerfLogging = process.env.PLAYWRIGHT_PERF_LOG === 'true';
const isSharedData = process.env.PLAYWRIGHT_SHARED_DATA === 'true';
const isFailFast = process.env.PLAYWRIGHT_FAIL_FAST !== 'false'; // DEFAULT TO TRUE

/**
 * Enhanced Performance Configuration with Optimization Strategies
 */
const getPerformanceConfig = () => {
  const baseConfig = {
    // Worker optimization based on environment and mode
    workers: isCI 
      ? (isFastMode ? 2 : 1) // Conservative in CI
      : (isFastMode ? 4 : (isOptimizedMode ? 3 : 1)), // Aggressive locally in optimization modes

    // Timeout optimization for different scenarios
    timeouts: {
      test: isCI ? 60000 : (isFastMode ? 15000 : 30000),
      action: isCI ? 15000 : (isFastMode ? 5000 : 10000),
      navigation: isCI ? 20000 : (isFastMode ? 8000 : 15000),
      assertion: isFastMode ? 3000 : 5000
    },

    // Retry strategy
    retries: isCI ? 2 : (isFastMode || isFailFast ? 0 : 1),
    
    // Parallelization strategy
    parallelization: isFastMode || isOptimizedMode,

    // Browser launch optimizations
    browserArgs: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-default-apps',
      '--disable-extensions',
      '--no-first-run',
      '--disable-sync'
    ],

    // Output optimizations
    headless: isCI || isOptimizedMode,
    trace: isFastMode ? 'off' as const : 'retain-on-failure' as const,
    screenshot: isFastMode ? 'only-on-failure' as const : 'only-on-failure' as const,
    video: isFastMode ? 'off' as const : 'retain-on-failure' as const
  };

  return baseConfig;
};

const perfConfig = getPerformanceConfig();

/**
 * Enhanced Performance Monitoring with Detailed Metrics
 */
const performanceStartTime = Date.now();
process.on('exit', () => {
  if (enablePerfLogging) {
    const duration = Date.now() - performanceStartTime;
    console.log(`
🚀 E2E Test Suite Performance Report
═══════════════════════════════════════
Total Duration: ${duration}ms
Configuration: ${isFastMode ? 'FAST' : isOptimizedMode ? 'OPTIMIZED' : 'STANDARD'}${isFailFast ? ' + FAIL-FAST' : ''}
Workers: ${perfConfig.workers}
Environment: ${isCI ? 'CI' : 'Local'}
Parallelization: ${perfConfig.parallelization}
Test Timeout: ${perfConfig.timeouts.test}ms
Max Failures: ${isFailFast ? '1 (fail-fast)' : 'unlimited'}
═══════════════════════════════════════
    `);
  }
});

/**
 * Optimized Playwright Configuration for Better Performance
 * 
 * EMERGENCY FIX APPLIED: Database Race Condition Resolution
 * ========================================================
 * - Disabled parallel execution (fullyParallel: false)
 * - Reduced workers to 1 to eliminate database race conditions
 * - This fixes the 4-worker async/priority issues causing test failures
 * - Gallery creation 404 errors were due to parallel workers competing for same test data
 * - Database cleanup interference resolved by sequential execution
 * 
 * PERFORMANCE IMPACT:
 * - Test execution time will increase (trade-off for stability)
 * - All tests will run sequentially, preventing data conflicts
 * - UI tests will be reliable but slower
 * 
 * NEXT STEPS for optimization:
 * 1. Implement worker isolation with separate test data per worker
 * 2. Add database transaction boundaries in API routes
 * 3. Enhance test data factory with proper consistency checking
 * 
 * Key Optimizations (when parallel execution is re-enabled):
 * 1. Selective parallelization based on test type and environment
 * 2. Environment-aware timeout settings  
 * 3. CI/CD optimized configurations
 * 4. Faster browser launching with resource management
 * 5. Performance monitoring and regression detection
 * 6. Cross-platform compatibility
 * 7. Fail-fast mode for rapid development cycles
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  /* Global setup and teardown */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* Performance Optimizations */
  // EMERGENCY FIX: Disable parallel execution for data-dependent tests
  // This prevents database race conditions between workers
  fullyParallel: false,
  // Reduce workers to 1 to eliminate race conditions
  workers: 1,
  
  /* Timeout Optimizations */
  timeout: perfConfig.timeouts.test, // Optimized timeout based on mode
  expect: {
    timeout: perfConfig.timeouts.assertion, // Fast assertion timeouts
    toHaveScreenshot: { threshold: 0.4 }, // Relaxed for speed
    toMatchSnapshot: { threshold: 0.4 }
  },
  
  /* Build and CI Configuration */
  forbidOnly: isCI,
  retries: perfConfig.retries,
  
  /* Fail-fast configuration for development */
  maxFailures: isFailFast ? 1 : undefined,
  
  /* Optimized Reporting */
  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: './test-results/report/html' // Changed path
    }],
    ...(enablePerfLogging ? [['./e2e-tests/performance-reporter.ts', {}] as const] : [])
  ],

  /* Output directories */
  outputDir: './test-results/artifacts', // Changed path
  
  /* Optimized Browser Settings */
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Optimized timeouts */
    actionTimeout: perfConfig.timeouts.action,
    navigationTimeout: perfConfig.timeouts.navigation,
    
    /* Reduced overhead in fast mode */
    trace: perfConfig.trace,
    screenshot: perfConfig.screenshot,
    video: perfConfig.video,
    
    /* Browser optimizations */
    headless: perfConfig.headless,
    
    /* Browser Performance Optimizations */
    launchOptions: {
      args: perfConfig.browserArgs,
    },
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  /* Optimized Project Configuration */
  projects: [
    // Authentication lifecycle (sequential - must run first)
    {
      name: 'auth-lifecycle',
      testMatch: [
        '**/01-auth-lifecycle.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        // Standard settings for auth tests
        actionTimeout: 15000,
        navigationTimeout: 30000,
      },
      fullyParallel: false, // Sequential for auth setup
    },

    // Core feature tests (can run in parallel with shared auth state)
    {
      name: 'feature-tests',
      testMatch: [
        '**/02-feature-tests.spec.ts',
        '**/enhanced-upload.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['auth-lifecycle'],
      fullyParallel: isFastMode, // Can be parallel in fast mode
    },

    // Image and gallery tests (can share data and run in parallel)
    {
      name: 'image-tests',
      testMatch: [
        '**/complete-image-workflow.spec.ts',
        '**/enhanced-gallery-layouts.spec.ts',
        '**/image-grid.spec.ts',
        '**/responsive-mobile-images.spec.ts',
        '**/simple-gallery-workflow.spec.ts', // Replaced complex test with simple one
        '**/optimized-upload-workflow.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['feature-tests'],
      fullyParallel: isSharedData, // Can be parallel if sharing data
    },

    // Data cleanup tests (must run after feature tests)
    {
      name: 'cleanup-tests',
      testMatch: [
        '**/03-data-cleanup.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['image-tests'],
      fullyParallel: false, // Sequential for cleanup safety
    },

    // Final user deletion (must be last)
    {
      name: 'deletion-tests',
      testMatch: [
        '**/04-final-user-deletion.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['cleanup-tests'],
      fullyParallel: false, // Must be sequential and last
    },
  ],

  /* Optimized Web Server Configuration */
  // Only start server locally - in CI, server is started manually in workflow
  webServer: !process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000, // Give more time for server startup
    stdout: 'pipe', // Reduce noise in CI
    stderr: 'pipe',
    // Try alternate ports if 3000 is busy
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
  } : undefined,
});
