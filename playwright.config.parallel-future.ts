import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * FUTURE PARALLEL CONFIGURATION - DO NOT USE YET
 * ==============================================
 * This configuration will be used once we implement:
 * 1. Worker isolation with separate test data per worker
 * 2. Database transaction boundaries in API routes  
 * 3. Enhanced test data factory with proper consistency checking
 * 
 * CURRENT ISSUES TO RESOLVE FIRST:
 * - Database race conditions between workers
 * - Shared test user account conflicts
 * - Gallery creation 404 errors due to timing issues
 * - Database cleanup interference
 * 
 * To activate this config in the future:
 * 1. Rename playwright.config.optimized.ts to playwright.config.sequential.ts
 * 2. Rename this file to playwright.config.optimized.ts
 * 3. Test thoroughly with worker isolation implemented
 */

const isCI = !!process.env.CI;
const isFastMode = process.env.PLAYWRIGHT_FAST === 'true';
const isOptimizedMode = process.env.PLAYWRIGHT_OPTIMIZED === 'true';
const enablePerfLogging = process.env.PLAYWRIGHT_PERF_LOG === 'true';
const isFailFast = process.env.PLAYWRIGHT_FAIL_FAST !== 'false';

const getPerformanceConfig = () => {
  const baseConfig = {
    // Restore optimized worker counts once isolation is implemented
    workers: isCI 
      ? (isFastMode ? 2 : 1) 
      : (isFastMode ? 4 : (isOptimizedMode ? 3 : 1)),

    timeouts: {
      test: isCI ? 60000 : (isFastMode ? 15000 : 30000),
      action: isCI ? 15000 : (isFastMode ? 5000 : 10000),
      navigation: isCI ? 20000 : (isFastMode ? 8000 : 15000),
      assertion: isFastMode ? 3000 : 5000
    },

    retries: isCI ? 2 : (isFastMode || isFailFast ? 0 : 1),
    parallelization: isFastMode || isOptimizedMode,

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

    headless: isCI || isOptimizedMode,
    trace: isFastMode ? 'off' as const : 'retain-on-failure' as const,
    screenshot: isFastMode ? 'only-on-failure' as const : 'only-on-failure' as const,
    video: isFastMode ? 'off' as const : 'retain-on-failure' as const
  };

  return baseConfig;
};

const perfConfig = getPerformanceConfig();

/**
 * FUTURE: Enhanced Worker Isolation Configuration
 * This will be implemented with proper database isolation
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* FUTURE: Re-enable parallel execution with proper isolation */
  fullyParallel: perfConfig.parallelization,
  workers: perfConfig.workers,
  
  timeout: perfConfig.timeouts.test,
  expect: {
    timeout: perfConfig.timeouts.assertion,
    toHaveScreenshot: { threshold: 0.4 },
    toMatchSnapshot: { threshold: 0.4 }
  },
  
  forbidOnly: isCI,
  retries: perfConfig.retries,
  maxFailures: isFailFast ? 1 : undefined,
  
  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: './test-results/report/html'
    }],
    ...(enablePerfLogging ? [['./e2e-tests/performance-reporter.ts', {}] as const] : [])
  ],

  outputDir: './test-results/artifacts',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    actionTimeout: perfConfig.timeouts.action,
    navigationTimeout: perfConfig.timeouts.navigation,
    headless: perfConfig.headless,
    launchOptions: {
      args: perfConfig.browserArgs
    },
    trace: perfConfig.trace,
    screenshot: perfConfig.screenshot,
    video: perfConfig.video,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
