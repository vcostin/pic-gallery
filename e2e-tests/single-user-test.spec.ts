import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth-config';

test.describe('Single User Strategy Test', () => {
  test('verify single user strategy setup', async ({ page }) => {
    console.log('🔐 Testing single user strategy...');
    console.log(`Using test user: ${TEST_USER.email}`);
    
    // Go to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with the test user created in global setup
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Check if we're logged in (not on auth page anymore)
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Basic assertion - we should not be on auth pages if login worked
    expect(currentUrl).not.toContain('/auth/');
    
    console.log('✅ Single user strategy working!');
  });
});
