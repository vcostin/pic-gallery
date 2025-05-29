import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Test for User Deletion in E2E Cleanup
 * 
 * This test verifies that the complete cleanup functionality with user deletion works properly.
 * It's important to know that running this test will:
 * 1. Create test data
 * 2. Delete the E2E test user account
 * 
 * Global setup will recreate the user account for the next test run.
 */
test.describe('E2E User Deletion', () => {
  const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
  const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
  
  test('should delete the test user account during complete cleanup', async ({ page }) => {
    // Step 1: Login and verify we're authenticated as the E2E test user
    await page.goto('/auth/login');
    const loginSuccess = await TestHelpers.login(page, testEmail, testPassword);
    
    if (!loginSuccess) {
      console.log('Could not authenticate with the E2E test user, skipping test');
      test.skip();
      return;
    }
    
    // Verify authentication
    await page.goto('/galleries');
    const isAuthenticated = await TestHelpers.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
    
    console.log('✅ Verified authenticated as E2E test user');
    
    try {
      // Step 2: Create some test data (a gallery)
      await page.goto('/galleries/create');
      
      // Wait for the form to be visible
      await page.getByTestId('gallery-title').waitFor({ timeout: 5000 });
      
      const testGalleryName = `Deletion Test Gallery ${Date.now()}`;
      await page.getByTestId('gallery-title').fill(testGalleryName);
      await page.getByTestId('gallery-description').fill('Test gallery for user deletion testing');
      
      // Take a screenshot before submitting
      await page.screenshot({ path: 'before-gallery-creation.png' });
      
      // Submit the form
      await page.getByTestId('create-gallery-submit').click();
      
      // Wait for creation to complete and redirect to gallery edit page
      try {
        await page.waitForURL(/\/galleries\/[^/]+\/edit/, { timeout: 10000 });
        console.log('✅ Created test gallery');
      } catch (error) {
        console.error('Failed to detect redirect after gallery creation:', error);
        await page.screenshot({ path: 'gallery-creation-error.png' });
        // Continue anyway - we'll still try to delete the user
      }
      
      // Step 3: Perform complete cleanup with user deletion
      console.log('Performing complete cleanup with user deletion...');
      await TestHelpers.completeCleanup(page);
      
      // Step 4: Wait for potential redirect and verify we're logged out
      await page.waitForTimeout(3000); // Give time for any redirects or state changes
      
      // Either we're on the login page or we can navigate there and verify
      await page.goto('/auth/login');
      
      // Step 5: Try to log in with the deleted user credentials
      console.log('Attempting to log in with test user credentials...');
      await page.getByTestId('login-email').waitFor({ timeout: 5000 });
      await page.getByTestId('login-email').fill(testEmail);
      await page.getByTestId('login-password').fill(testPassword);
      await page.getByTestId('login-submit').click();
      
      // Step 6: Verify login fails because the account has been deleted
      try {
        const loginError = page.getByText(/invalid credentials|user not found|incorrect password/i);
        await expect(loginError).toBeVisible({ timeout: 5000 });
        console.log('✅ Verified user account was deleted - login failed as expected');
      } catch (error) {
        console.error('Login error message not found:', error);
        await page.screenshot({ path: 'login-after-deletion.png' });
        throw new Error('Login did not fail as expected after user deletion');
      }
    } catch (testError) {
      console.error('Error during user deletion test:', testError);
      await page.screenshot({ path: 'user-deletion-test-error.png' });
      throw testError;
    }
    
    // Step 7: Register the test user account again for subsequent tests
    try {
      console.log('Recreating test user account...');
      await page.goto('/auth/register');
      
      await page.getByTestId('register-name').waitFor({ timeout: 5000 });
      await page.getByTestId('register-name').fill('E2E Test User');
      await page.getByTestId('register-email').fill(testEmail);
      await page.getByTestId('register-password').fill(testPassword);
      await page.getByTestId('register-confirm-password').fill(testPassword);
      await page.getByTestId('register-submit').click();
      
      // Step 8: Verify account creation succeeded
      // We should either be redirected to home or to login
      const redirected = await page.waitForURL(/\/(auth\/login|galleries|profile|home|\/$)/, { timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      
      expect(redirected).toBe(true);
      console.log('✅ Successfully recreated test user account');
    } catch (registrationError) {
      console.error('Error recreating test user:', registrationError);
      await page.screenshot({ path: 'user-recreation-error.png' });
      throw new Error('Failed to recreate the test user account after deletion');
    }
  });
});
