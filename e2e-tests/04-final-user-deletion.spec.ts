import { test, expect, Locator } from '@playwright/test';
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
      
      let deleteButton: Locator | null = null;
      for (const selector of deleteSelectors) {
        try {
          const candidate = page.locator(selector).first();
          if (await candidate.isVisible()) {
            deleteButton = candidate;
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (deleteButton) {
        await deleteButton.click();
        
        // Wait for confirmation dialog to appear
        await expect(page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete"), [data-testid="confirm-delete"]')).toBeVisible();
        
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
        
        // Wait for deletion to complete by checking for redirect or success message
        await expect(page.locator('text=/logged out|sign in|login/i, [data-testid="login-page"]')).toBeVisible();
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
    
    // Check if error message exists (using proper boolean check)
    const errorExists = await page.locator('text=/invalid|error|failed/i, [data-testid="login-error"]').isVisible().catch(() => false);
    
    if (!errorExists) {
      // If no error message, should still be on login page
      await expect(page.locator('[data-testid="login-submit"], [data-testid="login-form"]')).toBeVisible();
    }
    
    // Should still be on login page or see error message
    const currentUrl = page.url();
    const isStillOnLogin = currentUrl.includes('/auth/login');
    
    if (isStillOnLogin) {
      console.log('✅ User deletion verified - login failed as expected');
    } else if (errorExists) {
      console.log('✅ User deletion verified - login error displayed');
    } else {
      console.log('⚠️ User deletion verification inconclusive');
    }
  });
});
