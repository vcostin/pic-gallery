import { test, expect } from '@playwright/test';
import { SimpleHelpers } from './simple-helpers';

/**
 * Comprehensive E2E cleanup test
 * 
 * This test demonstrates the complete cleanup functionality:
 * 1. Creates test data (galleries, images)
 * 2. Verifies the data exists
 * 3. Performs cleanup with data deletion only
 * 4. Verifies data is cleaned up but user still exists
 * 5. Creates more test data
 * 6. Performs complete cleanup including user deletion
 * 7. Verifies everything is deleted including the user account
 */
test.describe('E2E Cleanup System', () => {
  const testGalleryName = `Cleanup Test Gallery ${Date.now()}`;
  const testImageTitle = `Cleanup Test Image ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Simple authentication check - tests should already be authenticated from global setup
    const isAuthenticated = await SimpleHelpers.isAuthenticated(page);
    if (!isAuthenticated) {
      // If not authenticated, try quick login
      const testUser = {
        email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com',
        password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'
      };
      const loginSuccess = await SimpleHelpers.quickLogin(page, testUser.email, testUser.password);
      
      if (!loginSuccess) {
        throw new Error('Could not authenticate with the E2E test user');
      }
    }
  });

  test('should perform comprehensive cleanup operations', async ({ page }) => {
    // ========== PHASE 1: CREATE TEST DATA ==========
    console.log('Phase 1: Creating test data...');
    
    // Create a test gallery
    await page.goto('/galleries/create');
    await expect(page).toHaveURL(/\/galleries\/create/);
    
    await page.getByTestId('gallery-title').fill(testGalleryName);
    await page.getByTestId('gallery-description').fill('Test gallery for cleanup testing');
    await page.getByTestId('gallery-public-checkbox').check();
    
    // Submit the form
    await page.getByTestId('create-gallery-submit').click();
    
    // Wait for successful creation and redirect
    await expect(page).toHaveURL(/\/galleries\/[a-z0-9-]+\/edit/, { timeout: 10000 });
    console.log('✅ Test gallery created successfully');

    // Navigate back to galleries to verify it exists
    await page.goto('/galleries');
    await expect(page.getByText(testGalleryName)).toBeVisible();
    console.log('✅ Test gallery visible in gallery list');

    // ========== PHASE 2: PERFORM DATA-ONLY CLEANUP ==========
    console.log('Phase 2: Performing data-only cleanup...');
    
    // Clean up test data (but keep user account)
    await SimpleHelpers.cleanupTestData(page, false);
    
    // Wait a moment for cleanup to complete
    await page.waitForTimeout(1000);
    
    // Verify we're still authenticated (user account should still exist)
    await page.goto('/galleries');
    const stillAuthenticated = await SimpleHelpers.isAuthenticated(page);
    expect(stillAuthenticated).toBe(true);
    console.log('✅ User account preserved after data cleanup');
    
    // Verify the test gallery was deleted
    await page.reload();
    await expect(page.getByText(testGalleryName)).not.toBeVisible();
    console.log('✅ Test data successfully cleaned up');

    // ========== PHASE 3: CREATE MORE DATA FOR COMPLETE CLEANUP ==========
    console.log('Phase 3: Creating more test data for complete cleanup...');
    
    // Create another test gallery
    const secondGalleryName = `Complete Cleanup Test ${Date.now()}`;
    await page.goto('/galleries/create');
    await page.getByTestId('gallery-title').fill(secondGalleryName);
    await page.getByTestId('gallery-description').fill('Test gallery for complete cleanup');
    await page.getByTestId('create-gallery-submit').click();
    
    await expect(page).toHaveURL(/\/galleries\/[a-z0-9-]+\/edit/, { timeout: 10000 });
    console.log('✅ Second test gallery created');

    // ========== PHASE 4: PERFORM COMPLETE CLEANUP ==========
    console.log('Phase 4: Performing complete cleanup (including user account)...');
    
    // Perform complete cleanup including user deletion
    await SimpleHelpers.cleanupTestData(page, true);
    
    // Wait for cleanup to complete
    await page.waitForTimeout(2000);
    
    // After complete cleanup, we should be logged out
    await page.goto('/galleries');
    
    // We should either be redirected to login or see a login prompt
    const isLoggedOut = await page.waitForURL(/\/auth\/login/, { timeout: 5000 }).then(() => true).catch(() => false);
    const hasLoginForm = await page.getByTestId('login-email').isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(isLoggedOut || hasLoginForm).toBe(true);
    console.log('✅ User successfully logged out after complete cleanup');

    // ========== PHASE 5: VERIFY USER ACCOUNT DELETION ==========
    console.log('Phase 5: Verifying user account deletion...');
    
    // Try to login with the test user credentials
    const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
    const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
    
    // Navigate to login page if not already there
    if (!page.url().includes('/auth/login')) {
      await page.goto('/auth/login');
    }
    
    // Attempt login
    await page.getByTestId('login-email').fill(testEmail);
    await page.getByTestId('login-password').fill(testPassword);
    await page.getByTestId('login-submit').click();
    
    // Login should fail since the account was deleted
    const loginError = page.getByTestId('login-error');
    await expect(loginError).toBeVisible({ timeout: 5000 });
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log('✅ Confirmed user account was deleted - login failed as expected');
    
    console.log('🎉 Complete cleanup test successful!');
  });

  test('should handle cleanup when no data exists', async ({ page }) => {
    console.log('Testing cleanup with no existing data...');
    
    // Attempt cleanup when no galleries/images exist
    await SimpleHelpers.cleanupTestData(page, false);
    
    // Should still be authenticated and no errors should occur
    const stillAuthenticated = await SimpleHelpers.isAuthenticated(page);
    expect(stillAuthenticated).toBe(true);
    
    console.log('✅ Cleanup with no data handled gracefully');
  });
});
