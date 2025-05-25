import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth-config';
import { SimpleHelpers } from './simple-helpers';

// Auth tests using the single test user - user persists after these tests
// Prerequisites: Global setup has deleted any existing test user and created a fresh one
test.describe('Authentication Lifecycle (User Persists)', () => {
  
  test('verify user registration/existence', async ({ page }) => {
    console.log('🔐 Testing user registration/existence...');
    
    // Go to login page first to check if user exists
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login - should work since user was created in global setup
    const loginResult = await SimpleHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    
    if (loginResult) {
      console.log('✅ User exists and can login');
      
      // Verify we're logged in by checking dashboard or user indicator
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/auth/');
      
      // Logout for next test
      await SimpleHelpers.quickLogout(page);
    } else {
      throw new Error('❌ User should exist from global setup but login failed');
    }
  });

  test('login and logout flow', async ({ page }) => {
    console.log('🔑 Testing login/logout flow...');
    
    // Start from homepage
    await page.goto('/');
    
    // Go to login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    const loginSuccess = await SimpleHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);
    
    // Verify login worked
    await page.waitForTimeout(1000);
    const urlAfterLogin = page.url();
    expect(urlAfterLogin).not.toContain('/auth/');
    
    console.log('✅ Login successful');
    
    // Now logout
    const logoutSuccess = await SimpleHelpers.quickLogout(page);
    expect(logoutSuccess).toBe(true);
    
    console.log('✅ Logout successful');
  });

  test('authentication persistence check', async ({ page }) => {
    console.log('🔄 Testing authentication state...');
    
    // Login again to set up for feature tests
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const loginSuccess = await SimpleHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);
    
    // Save authentication state for other tests to use
    await page.context().storageState({ path: TEST_USER.storageStatePath });
    
    console.log('✅ Authentication state saved for feature tests');
  });
});
