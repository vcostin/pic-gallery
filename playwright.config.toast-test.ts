import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Temporary config to test toast notifications without auth dependencies
 */
export default defineConfig({
  testDir: './e2e-tests',
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Only the authenticated tests (skipping auth dependencies)
    {
      name: 'toast-tests',
      testMatch: /(gallery-edit\.spec\.ts|simple-gallery-toast\.spec\.ts)/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
