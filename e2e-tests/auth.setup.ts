import { test as setup, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

/**
 * This setup test runs before the authenticated tests
 * It handles logging in to create an authenticated state
 */
setup('authenticate', async ({ page }) => {
  // Go to the login page
  await page.goto('/auth/login');
  
  // Check if we're already logged in
  const isAlreadyLoggedIn = await TestHelpers.isAuthenticated(page);
  if (isAlreadyLoggedIn) {
    console.log('Already authenticated, skipping login');
    return;
  }
  
  // Login with our test user account
  await TestHelpers.login(page, 'e2e-test@example.com', 'TestPassword123!');
  
  // Verify we are logged in
  await expect(page.getByTestId('logout-button')).toBeVisible();
});
