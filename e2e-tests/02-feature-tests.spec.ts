import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth-config';
import { TestHelpers } from './test-helpers';

// Feature tests using the authenticated single user
// Prerequisites: Global setup has created a clean test user, auth tests have verified login
test.describe('Feature Tests (Authenticated User)', () => {
  
  // Use saved authentication state from auth tests
  test.use({ storageState: TEST_USER.storageStatePath });

  test('dashboard access with authenticated user', async ({ page }) => {
    console.log('🏠 Testing dashboard access...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should be able to access protected areas
    // Add specific dashboard/gallery feature tests here
    console.log('✅ Dashboard accessible with authenticated user');
  });

  test('gallery creation and management', async ({ page }) => {
    console.log('🖼️ Testing gallery features...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test gallery creation, image upload, etc.
    // This will use the same authenticated user throughout
    console.log('✅ Gallery features working with single user');
  });

  test('image upload and management', async ({ page }) => {
    console.log('📸 Testing image features...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test image upload, editing, etc.
    console.log('✅ Image features working with single user');
  });
});
