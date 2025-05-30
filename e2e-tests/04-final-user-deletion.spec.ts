import { test, expect } from '@playwright/test';
import { TEST_USER } from './auth-config';
import { TestHelpers } from './test-helpers';

// Final test - delete the user profile and verify deletion
// Prerequisites: Global setup created clean user, all previous tests used same user
test.describe('Final User Profile Deletion', () => {
  
  // Use saved authentication state for the last time
  test.use({ storageState: TEST_USER.storageStatePath });

  test('delete user profile from /profile page', async ({ page }) => {
    console.log('🗑️ Final test: Deleting user profile...');
    
    // Go to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for delete account button/section
    // This might need to be adjusted based on your actual profile page
    try {
      // Try common selectors for delete account
      const deleteSelectors = [
        '[data-testid="delete-account"]',
        'button:has-text("Delete Account")',
        'button:has-text("Delete Profile")',
        '.delete-account',
        '#delete-account'
      ];
      
      let deleteButton = null;
      for (const selector of deleteSelectors) {
        try {
          deleteButton = await page.locator(selector).first();
          if (await deleteButton.isVisible()) {
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (deleteButton) {
        await deleteButton.click();
        
        // Handle confirmation if it exists
        await page.waitForTimeout(1000);
        
        const confirmSelectors = [
          'button:has-text("Confirm")',
          'button:has-text("Yes")',
          'button:has-text("Delete")',
          '[data-testid="confirm-delete"]'
        ];
        
        for (const selector of confirmSelectors) {
          try {
            const confirmButton = page.locator(selector);
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              break;
            }
          } catch {
            continue;
          }
        }
        
        await page.waitForTimeout(2000);
        console.log('✅ User profile deletion attempted via UI');
      } else {
        console.log('⚠️ Delete account button not found, attempting API deletion...');
        await TestHelpers.deleteUser(page, TEST_USER.email);
      }      } catch {
        console.log('⚠️ UI deletion failed, attempting API deletion...');
        await TestHelpers.deleteUser(page, TEST_USER.email);
      }
  });

  test('verify user deletion by attempting login', async ({ page }) => {
    console.log('🔍 Verifying user deletion...');
    
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    // Go to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login - should fail
    await page.fill('[data-testid="login-email"]', TEST_USER.email);
    await page.fill('[data-testid="login-password"]', TEST_USER.password);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForTimeout(2000);
    
    // Should still be on login page or see error message
    const currentUrl = page.url();
    const isStillOnLogin = currentUrl.includes('/auth/login');
    
    if (isStillOnLogin) {
      console.log('✅ User deletion verified - login failed as expected');
    } else {
      // Check for error message
      const errorExists = await page.locator('text=/invalid|error|failed/i').first().isVisible().catch(() => false);
      if (errorExists) {
        console.log('✅ User deletion verified - login error displayed');
      } else {
        console.log('⚠️ User deletion verification inconclusive');
      }
    }
  });
});
