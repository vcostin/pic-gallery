import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e-tests',
  /* Path to global setup and teardown files */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  /* Run tests sequentially for single-user strategy */
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Basic tests that don't require authentication
    {
      name: 'basic-tests',
      testMatch: '**/basic.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Authentication verification tests 
    {
      name: 'auth-tests',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: [],
    },

    // Main authenticated tests using the single test user
    {
      name: 'authenticated-tests',
      testMatch: /(authenticated\.spec\.ts|comprehensive-gallery-workflow\.spec\.ts|gallery-management\.spec\.ts|check-gallery-exists\.spec\.ts|setup-basic-gallery\.spec\.ts|setup-gallery\.spec\.ts|toast-notification\.spec\.ts|gallery-edit\.spec\.ts|simple-gallery-toast\.spec\.ts)/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['auth-tests'],
    },

    // Data cleanup tests (keep user, clean data)
    {
      name: 'cleanup-tests',
      testMatch: '**/e2e-cleanup-comprehensive.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['authenticated-tests'],
    },

    // Final profile deletion tests (delete user)
    {
      name: 'deletion-tests',
      testMatch: '**/profile-deletion.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
      dependencies: ['cleanup-tests'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
