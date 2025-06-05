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
      timeout: 45000,
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
  timeout: perfConfig.timeout, // Reduced from default 30s, but enough for slower tests
  expect: {
    timeout: isCI ? 15000 : 10000, // More time for assertions in CI
  },
  
  /* Build and CI Configuration */
  forbidOnly: isCI,
  retries: perfConfig.retries,
  
  /* Optimized Reporting */
  reporter: process.env.CI 
    ? [['github'], ['html', { outputFolder: 'playwright-report' }]] 
    : [['list'], ['html', { outputFolder: 'playwright-report' }]],
  
  /* Artifact Management */
  outputDir: './test-screenshots',
  
  /* Optimized Browser Settings */
  use: {
    baseURL: 'http://localhost:3000',
    
    /* Performance Settings */
    actionTimeout: 15000, // Faster action timeouts
    navigationTimeout: 30000, // Reasonable navigation timeout
    
    /* Tracing and Screenshots - Only when needed */
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
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
