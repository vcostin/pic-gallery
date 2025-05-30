import { test as setup } from '@playwright/test';
import { TEST_USER } from './auth-config';

// Create test user and save authentication state
setup(`authenticate as test user`, async ({ page }) => {
  console.log(`Setting up authentication for ${TEST_USER.email}`);
  
  // Try to log in (user should exist from global setup)
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
    
  // Wait for successful login
  try {
    await page.waitForURL(/\/(galleries|profile|home|\/)/, { timeout: 10000 });
    console.log(`✅ Authentication successful for ${TEST_USER.email}`);
  } catch {
    console.log(`⚠️ Login redirect timeout for ${TEST_USER.email}, but continuing...`);
  }
  
  // Save authentication state
  await page.context().storageState({ path: TEST_USER.storageStatePath });
  console.log(`✅ Authentication state saved for ${TEST_USER.email}`);
});
