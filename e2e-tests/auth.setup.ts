import { test as setup, expect } from '@playwright/test';
import { TestHelpers } from './helpers';
import fs from 'fs/promises';
import path from 'path';

/**
 * This setup test runs before the authenticated tests
 * It handles logging in to create an authenticated state
 */
setup('authenticate', async ({ page, context }) => {
  // Go to the login page
  await page.goto('/auth/login');
  
  // Check if we're already logged in
  const isAlreadyLoggedIn = await TestHelpers.isAuthenticated(page);
  if (isAlreadyLoggedIn) {
    console.log('Already authenticated, skipping login');
  } else {
    console.log('Not authenticated, performing login...');
    
    // Login with our test user account using environment variables
    const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
    const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
    await TestHelpers.login(page, testEmail, testPassword);
    
    // Verify we are logged in
    await expect(page.getByTestId('logout-button')).toBeVisible();
  }
  
  // Go to a protected page to ensure we're fully authenticated
  await page.goto('/galleries');
  await expect(page).toHaveURL(/\/galleries/);
  
  // Save storage state to file for use in other tests
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  await fs.mkdir(authDir, { recursive: true }).catch(() => {});
  await context.storageState({ path: path.join(authDir, 'user.json') });
  console.log('Auth state saved to file after browser login');
});
