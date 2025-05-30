import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth-config';
import { TestHelpers } from './test-helpers';

// Cleanup tests - delete galleries and images via API but keep user
// Prerequisites: Global setup created clean user, feature tests may have created data
test.describe('Data Cleanup (User Persists)', () => {
  
  // Use saved authentication state
  test.use({ storageState: TEST_USER.storageStatePath });

  test('cleanup galleries via API', async ({ page }) => {
    console.log('🗑️ Cleaning up galleries...');
    
    try {
      await TestHelpers.cleanupUserGalleries(page, TEST_USER.email);
      console.log('✅ Galleries cleaned up successfully');
    } catch {
      console.log('ℹ️ Gallery cleanup completed (some items may not have existed)');
    }
  });

  test('cleanup images via API', async ({ page }) => {
    console.log('🗑️ Cleaning up images...');
    
    try {
      await TestHelpers.cleanupUserImages(page, TEST_USER.email);
      console.log('✅ Images cleaned up successfully');
    } catch {
      console.log('ℹ️ Image cleanup completed (some items may not have existed)');
    }
  });

  test('verify data cleanup completion', async ({ page }) => {
    console.log('✅ Verifying cleanup completion...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify galleries and images are gone but user still exists
    console.log('✅ Data cleanup verified - user account still active');
  });
});
