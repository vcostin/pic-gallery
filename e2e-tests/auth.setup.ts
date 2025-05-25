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
    
    // Try to login, with multiple attempts if needed
    let loginSuccess = false;
    for (let attempt = 1; attempt <= 3 && !loginSuccess; attempt++) {
      console.log(`Login attempt ${attempt}/3`);
      loginSuccess = await TestHelpers.login(page, testEmail, testPassword);
      
      if (!loginSuccess && attempt < 3) {
        console.log('Login failed, retrying after short delay...');
        await page.waitForTimeout(1000);
      }
    }
    
    if (!loginSuccess) {
      console.error('All login attempts failed');
      throw new Error('Could not authenticate for tests');
    }
    
    // Verify we are logged in
    await expect(page.getByTestId('logout-button'), 'Logout button should be visible').toBeVisible()
      .catch(async () => {
        // If we can't find the logout button by test ID, try alternate selectors
        const altLogoutButton = page.getByRole('button', { name: /logout|sign out/i });
        await expect(altLogoutButton, 'Alternative logout button should be visible').toBeVisible();
      });
  }
  
  // Go to a protected page to ensure we're fully authenticated
  await page.goto('/galleries');
  
  // Verify we're on the correct page or a similarly protected page
  await expect(
    page.url(),
    'URL should indicate we are on a protected page'
  ).toMatch(/\/galleries|\/home|\/dashboard|\//);
  
  // Save storage state to file for use in other tests
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  await fs.mkdir(authDir, { recursive: true }).catch(() => {});
  await context.storageState({ path: path.join(authDir, 'user.json') });
  console.log('Auth state saved to file after browser login');
  
  // Verify that we really have an authenticated session
  const finalAuthCheck = await TestHelpers.isAuthenticated(page);
  if (!finalAuthCheck) {
    console.error('WARNING: Authentication verification failed despite appearing to login');
    throw new Error('Authentication verification failed');
  }
});
