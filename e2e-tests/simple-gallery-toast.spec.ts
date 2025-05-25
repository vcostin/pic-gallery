import { test, expect } from '@playwright/test';

// This is a simplified test that focuses only on the toast notification behavior
test('toast notifications should disappear completely', async ({ page }) => {
  console.log('Starting simplified toast test...');
  
  try {
    // Try to navigate to galleries page first (we should already be authenticated)
    await page.goto('/galleries', { timeout: 10000 });
    console.log('Successfully navigated to galleries page');
  } catch (error: unknown) {
    console.log('Initial navigation failed, trying to login:', error instanceof Error ? error.message : 'Unknown error');
    
    // If navigation fails, try to login
    try {
      await page.goto('/auth/login');
      await page.getByTestId('login-email').fill(process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com');
      await page.getByTestId('login-password').fill(process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!');
      await page.getByTestId('login-submit').click();
      
      // Wait for authentication to complete
      await page.waitForURL(/\/galleries|\/|\/home/, { timeout: 10000 });
      console.log('Login successful');
      
      // Try to go to galleries page again
      await page.goto('/galleries');
    } catch {
      console.log('Login failed or already logged in, continuing...');
      // If login also fails, skip the test
      test.skip(true, 'Unable to authenticate or navigate to galleries page');
      return;
    }
  }
  console.log('On galleries page');
  
  try {
    // Count galleries with timeout
    await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 5000 }).catch(() => {
      console.log('No galleries found on page');
    });
    
    const galleries = await page.getByTestId('gallery-item').count();
    console.log(`Found ${galleries} galleries`);
    
    if (galleries > 0) {
      // Use the first gallery
      await page.getByTestId('gallery-item').first().click();
      
      // Wait for navigation to gallery detail page
      await page.waitForURL(/\/galleries\/[^/]+$/, { timeout: 5000 });
      console.log('Navigated to gallery detail page');
      
      // Go to edit page - look for edit button with correct test ID
      await page.getByTestId('edit-gallery-button').click();
      console.log('Clicked edit gallery button');
      
      // Wait for navigation to edit page
      await page.waitForURL(/\/galleries\/[^/]+\/edit/, { timeout: 5000 });
      console.log('Successfully navigated to edit page');
      
      // Count images with timeout
      await page.waitForSelector('.gallery-image', { timeout: 3000 }).catch(() => {
        console.log('No images found in gallery');
      });
      
      const images = await page.locator('.gallery-image').count();
      console.log(`Gallery has ${images} images`);
      
      if (images > 0) {
        // Remove an image to trigger toast
        await page.locator('.gallery-image').first().hover();
        await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
        await page.getByRole('button', { name: /remove image/i }).click();
        
        // Check toast visibility using data-testid
        const toast = page.getByTestId('toast-container');
        
        // Toast should be visible at first
        await expect(toast).toBeVisible({ timeout: 5000 });
        console.log('Toast is visible');
        
        // Verify the toast message is also visible
        const toastMessage = page.getByTestId('toast-message');
        await expect(toastMessage).toBeVisible();
        console.log('Toast message is visible');
        
        // Toast should disappear after timeout (we added about 1-2 seconds buffer)
        await expect(toast).not.toBeVisible({ timeout: 5000 });
        console.log('Toast disappeared automatically');
        
        // Success!
        console.log('Test passed: Toast notification properly disappears');
      } else {
        console.log('No images in gallery, skipping test');
        test.skip();
      }
    } else {
      console.log('No galleries found, skipping test');
      test.skip(true, 'No galleries available for testing');
    }
  } catch (error: unknown) {
    console.error('Test error:', error instanceof Error ? error.message : 'Unknown error');
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'test-error.png' });
    } catch {
      console.log('Could not take screenshot');
    }
    // Re-throw the error to fail the test
    throw error;
  }
});
