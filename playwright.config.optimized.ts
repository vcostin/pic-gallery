import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Optimized Playwright Configuration for Better Performance
 * 
 * Key Optimizations:
 * 1. Selective parallelization based on test type
 * 2. Optimized timeout settings
 * 3. Faster browser launching
 * 4. Better resource management
 * 5. Environment-specific optimizations
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  /* Global setup and teardown */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* Performance Optimizations */
  // Enable parallel execution for non-conflicting tests
  fullyParallel: process.env.PLAYWRIGHT_FAST_MODE === 'true' ? true : false,
  // More workers for parallel execution, but respect single-user strategy when needed
  workers: process.env.PLAYWRIGHT_FAST_MODE === 'true' ? 3 : 1,
  
  /* Timeout Optimizations */
  timeout: 45000, // Reduced from default 30s, but enough for slower tests
  expect: {
    timeout: 10000, // Faster assertion timeouts
  },
  
  /* Build and CI Configuration */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  /* Optimized Reporting */
  reporter: process.env.CI 
    ? [['github'], ['html']] 
    : [['list'], ['html']],
  
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
    // Fast independent tests that can run in parallel
    {
      name: 'fast-independent',
      testMatch: [
        '**/auth.spec.ts',
        '**/basic.spec.ts',
        '**/toast-component.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        // Faster settings for simple tests
        actionTimeout: 10000,
        navigationTimeout: 20000,
      },
      fullyParallel: true, // These can safely run in parallel
    },

    // Data-dependent tests that need careful sequencing
    {
      name: 'data-dependent',
      testMatch: [
        '**/authenticated.spec.ts',
        '**/comprehensive-gallery-workflow.spec.ts',
        '**/gallery-management.spec.ts',
        '**/setup-basic-gallery.spec.ts',
        '**/setup-gallery.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['fast-independent'],
      fullyParallel: false, // Sequential for data safety
    },

    // Gallery-specific tests that can share data
    {
      name: 'gallery-tests',
      testMatch: [
        '**/gallery-edit.spec.ts',
        '**/check-gallery-exists.spec.ts',
        '**/simple-gallery-toast.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['data-dependent'],
      fullyParallel: process.env.PLAYWRIGHT_SHARED_DATA === 'true', // Can be parallel if sharing data
    },

    // Notification tests (can be fast and parallel)
    {
      name: 'notification-tests',
      testMatch: [
        '**/toast-notification.spec.ts',
        '**/verify-toast-implementation.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
        // Faster settings for UI-only tests
        actionTimeout: 8000,
      },
      dependencies: ['data-dependent'],
      fullyParallel: true, // UI tests can run in parallel
    },

    // Cleanup tests (must run last, sequential)
    {
      name: 'cleanup-tests',
      testMatch: [
        '**/e2e-cleanup-comprehensive.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['gallery-tests', 'notification-tests'],
      fullyParallel: false,
    },

    // Final deletion (must be last)
    {
      name: 'deletion-tests',
      testMatch: [
        '**/profile-deletion.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['cleanup-tests'],
      fullyParallel: false,
    },
  ],

  /* Optimized Web Server Configuration */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Give more time for server startup
    stdout: 'pipe', // Reduce noise in CI
    stderr: 'pipe',
  },
});
