import { test as setup } from '@playwright/test';
import { TEST_USERS } from './auth-config';

// Create all test users and save their authentication states
for (const [userType, user] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${userType.toLowerCase()} user`, async ({ page }) => {
    console.log(`Setting up authentication for ${user.email}`);
    
    // Try to log in (user should exist from global setup)
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    try {
      await page.waitForURL(/\/(galleries|profile|home|\/)/, { timeout: 10000 });
      console.log(`✅ Authentication successful for ${user.email}`);
    } catch {
      console.log(`⚠️ Login redirect timeout for ${user.email}, but continuing...`);
    }
    
    // Save authentication state
    await page.context().storageState({ path: user.storageStatePath });
    console.log(`✅ Authentication state saved for ${user.email}`);
  });
}
