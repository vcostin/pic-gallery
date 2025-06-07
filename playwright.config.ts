import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Environment and CI Detection
 */
const isCI = !!process.env.CI;
const isFastMode = process.env.PLAYWRIGHT_FAST_MODE === 'true';
const isSharedData = process.env.PLAYWRIGHT_SHARED_DATA === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const isDebugMode = process.env.PLAYWRIGHT_DEBUG === 'true';

/**
 * Performance Configuration Helper
 */
const getPerformanceConfig = () => {
  if (isCI) {
    return {
      workers: isFastMode ? 2 : 1, // More conservative in CI
      timeout: 60000, // More time in CI for stability
      retries: 2,
      parallelization: isFastMode,
    };
  } else {
    return {
      workers: isFastMode ? 3 : 1, // More aggressive locally
      timeout: 3000, // FAST: 3s timeout for reasonable development feedback
      retries: 0,
      parallelization: isFastMode,
    };
  }
};

const perfConfig = getPerformanceConfig();

/**
 * Performance Monitoring Hook
 */
const performanceStartTime = Date.now();
process.on('exit', () => {
  if (process.env.PLAYWRIGHT_PERF_LOG === 'true') {
    const duration = Date.now() - performanceStartTime;
    console.log(`\n🚀 Test suite completed in ${duration}ms`);
    console.log(`📊 Configuration: ${isFastMode ? 'FAST' : 'STANDARD'} mode`);
    console.log(`⚡ Workers: ${perfConfig.workers}, CI: ${isCI}`);
  }
});

/**
 * Optimized Playwright Configuration for Better Performance
 * 
 * Key Optimizations:
 * 1. Selective parallelization based on test type and environment
 * 2. Environment-aware timeout settings 
 * 3. CI/CD optimized configurations
 * 4. Faster browser launching with resource management
 * 5. Performance monitoring and regression detection
 * 6. Cross-platform compatibility
 * 
 * FAST LOCAL DEV TIMEOUTS: 3000ms test timeout for quick feedback
 * - Global test timeout: 3000ms (reasonable for file uploads and complex interactions)
 * - Action timeout: 1500ms-2500ms (depending on test type)
 * - Navigation timeout: 2000ms-2500ms
 * - Expect timeout: 1000ms
 * 
 * CI TIMEOUTS: 15s actions, 30s navigation, 60s test timeout
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  /* Global setup and teardown */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* Performance Optimizations */
  // Enable parallel execution for non-conflicting tests
  fullyParallel: isFastMode,
  // More workers for parallel execution, but respect single-user strategy when needed
  workers: perfConfig.workers,
  
  /* Timeout Optimizations */
  timeout: perfConfig.timeout, // 3000ms locally for FAST feedback, 60s in CI
  expect: {
    timeout: isCI ? 15000 : 1000, // Fast expects locally, 1s max
  },
  
  /* Build and CI Configuration */
  forbidOnly: isCI,
  retries: perfConfig.retries,
  
  /* ULTRA FAST DEV: Stop on first failure locally */
  maxFailures: isCI ? undefined : 1, // Stop immediately on first failure for local dev
  
  /* Optimized Reporting - NO HTML for local dev (completely disabled for speed) */
  reporter: process.env.CI 
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] 
    : [['list']], // Only list reporter locally - HTML completely disabled
  
  /* Artifact Management */
  outputDir: './test-screenshots',
  
  /* Optimized Browser Settings */
  use: {
    baseURL: 'http://localhost:3000',
    
    /* Performance Settings */
    actionTimeout: isCI ? 15000 : 2000, // 2s locally for FAST feedback, 15s in CI
    navigationTimeout: isCI ? 30000 : 2500, // 2.5s locally, 30s in CI
    
    /* Tracing and Screenshots - Minimal for local dev */
    trace: process.env.CI ? 'retain-on-failure' : 'off', // No trace locally
    screenshot: process.env.CI ? 'only-on-failure' : 'off', // No screenshots locally  
    video: 'off', // No video anywhere - too slow
    
    /* Browser Performance Optimizations */
    launchOptions: {
      // Faster browser startup
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-background-media-playback',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-dev-shm-usage', // Helps with CI memory issues
        '--no-sandbox', // Faster startup
      ],
    },
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
        actionTimeout: isCI ? 15000 : 2500,  // 2.5s locally
        navigationTimeout: isCI ? 30000 : 3000, // 3s locally
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
        // FAST timeouts for immediate feedback on complex tests
        actionTimeout: isCI ? 15000 : 2500, // 2.5s locally, 15s in CI
        navigationTimeout: isCI ? 30000 : 2500, // 2.5s locally, 30s in CI
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
        '**/optimized-upload-workflow.spec.ts',
        '**/debug-upload-network.spec.ts',
        '**/image-viewer-modal.spec.ts',
      ],
      timeout: isCI ? 60000 : 8000, // 8s timeout for image tests (complex workflows with uploads)
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
        // FAST settings for image loading and interactions
        actionTimeout: isCI ? 15000 : 2500, // 2.5s locally
        navigationTimeout: isCI ? 30000 : 3500, // 3.5s locally for page loads
      },
      dependencies: ['feature-tests'],
      fullyParallel: isSharedData, // Can be parallel if sharing data
    },

    // Data cleanup tests (must run after image tests)
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
  } : undefined,
});
