import { chromium } from 'playwright';
import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { TestHelpers } from './helpers';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 * We create a test user account if needed and perform browser-based authentication
 */
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: config.projects[0].use.baseURL as string,
  });
  const page = await context.newPage();

  try {
    // Create a test user if it doesn't exist using environment variables
    const testUser = {
      email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com',
      password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!',
      name: process.env.E2E_TEST_USER_NAME || 'E2E Test User'
    };
    
    // Register test user via the UI to ensure it works
    console.log('Setting up test user account...');
    
    // First check if we can log in with the test user
    console.log('Attempting to log in with test user...');
    
    // Use our helper methods for more reliable login
    const loginSuccess = await TestHelpers.login(page, testUser.email, testUser.password, false);
    
    if (!loginSuccess) {
      console.log('Login failed, forcing registration of test user...');
      
      // Register the test user using our helper method
      await TestHelpers.registerAndLogin(page, testUser.name, testUser.email, testUser.password);
    }
    
    // Check again if we're logged in with a more robust check
    const isLoggedInAfterRetry = await TestHelpers.isAuthenticated(page);
    
    if (isLoggedInAfterRetry) {
      console.log('Successfully authenticated as test user');
      
      // Clean up any leftover test data from previous runs
      console.log('Cleaning up any existing test data...');
      await TestHelpers.cleanupTestData(page, false);
      
      // Save authentication state for reuse in tests
      const authDir = path.join(process.cwd(), 'playwright/.auth');
      await fs.mkdir(authDir, { recursive: true }).catch(() => {});
      await context.storageState({ path: path.join(authDir, 'user.json') });
      console.log('Authentication state saved for tests');
    } else {
      console.error('WARNING: Could not authenticate as test user');
      // Take screenshot for debugging
      await page.screenshot({ path: 'global-setup-auth-failed.png' });
      
      throw new Error('Authentication failed during global setup');
    }
    
    console.log('Global setup completed - test user ready');
  } catch (error) {
    console.error('Error during global setup:', error);
    await page.screenshot({ path: 'global-setup-error.png' });
    throw error; // Re-throw to fail the setup
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
