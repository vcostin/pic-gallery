import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers';

test.describe('Profile Deletion', () => {
  test('should delete user profile successfully', async ({ page }) => {
    // This test uses the DELETION user which is separate from other test users
    // so it can be safely deleted without affecting other tests
    
    // User should already be authenticated via storageState
    await page.goto('http://localhost:3000/profile');
    await expect(page).toHaveURL(/\/profile/);

    // Trigger account deletion dialog
    await page.getByTestId('delete-account-button').click();
    
    // Confirm account deletion in the dialog
    await page.getByTestId('delete-confirmation-input').fill('DELETE');
    await page.getByTestId('confirm-delete-account').click();

    // After deletion, user should be logged out and redirected
    await expect(page.getByTestId('logout-button')).not.toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login|\//, { timeout: 10000 });

    // Verify account has been deleted by trying to login
    const deletionUser = AuthHelpers.getUser('DELETION');
    await page.goto('http://localhost:3000/auth/login');
    
    await page.fill('input[type="email"]', deletionUser.email);
    await page.fill('input[type="password"]', deletionUser.password);
    await page.click('button[type="submit"]');

    // Login should fail with error message
    const errorMessage = page.getByTestId('login-error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/invalid|incorrect|failed|not found|credentials/i);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
