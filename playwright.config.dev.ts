import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Ultra-Fast Development Playwright Configuration
 * 
 * This config is optimized for maximum speed during local development:
 * - 1s action timeout (fail fast for broken elements)
 * - 3s navigation timeout (fail fast for slow pages)
 * - 10s total test timeout (fail fast for hanging tests)
 * - No retries (immediate feedback)
 * - Minimal tracing (faster execution)
 * 
 * Usage: npx playwright test --config=playwright.config.dev.ts
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  /* Global setup and teardown */
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',
  
  /* Ultra-Fast Development Settings */
  fullyParallel: true, // Maximum parallelization
  workers: 3, // Multiple workers for speed
  
  /* Aggressive Timeouts for Fast Feedback */
  timeout: 10000, // 10s max per test - fail fast
  expect: {
    timeout: 1000, // 1s max for assertions - fail fast
  },
  
  /* No Retries - Immediate Feedback */
  forbidOnly: false,
  retries: 0,
  
  /* Minimal Reporting for Speed */
  reporter: [['list']],
  
  /* No Artifacts for Speed */
  outputDir: './test-screenshots',
  
  /* Ultra-Fast Browser Settings */
  use: {
    baseURL: 'http://localhost:3000',
    
    /* Aggressive Performance Settings */
    actionTimeout: 1000, // 1s - fail fast for missing elements
    navigationTimeout: 3000, // 3s - fail fast for slow navigation
    
    /* Minimal Tracing for Speed */
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    
    /* Fastest Browser Launch */
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-background-media-playback',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
    },
  },

  /* Ultra-Fast Project Configuration */
  projects: [
    // Lightning-fast independent tests
    {
      name: 'dev-fast',
      testMatch: [
        '**/auth.spec.ts',
        '**/toast-component.spec.ts',
        '**/image-viewer-modal.spec.ts',
        '**/image-carousel-modal.spec.ts',
        '**/images-page.spec.ts',
        '**/image-grid.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        actionTimeout: 800, // Ultra-fast for simple interactions
        navigationTimeout: 2000, // Ultra-fast navigation
      },
      fullyParallel: true,
    },

    // Fast authenticated tests with pre-saved state
    {
      name: 'dev-auth',
      testMatch: [
        '**/authenticated.spec.ts',
        '**/gallery-edit.spec.ts',
        '**/enhanced-upload.spec.ts',
      ],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/single-user.json',
        actionTimeout: 1000,
        navigationTimeout: 3000,
      },
      dependencies: ['dev-fast'],
      fullyParallel: true,
    },
  ],

  /* Fast Local Server */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000, // Give server time to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
