import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

// This is a simplified test that focuses only on the toast notification behavior
test('toast notifications should disappear completely', async ({ page }) => {
  console.log('Starting simplified toast test...');
  
  // Login with test credentials
  await page.goto('/auth/login');
  
  try {
    await page.getByTestId('login-email').fill(process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com');
    await page.getByTestId('login-password').fill(process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!');
    await page.getByTestId('login-submit').click();
    
    // Wait for authentication to complete
    await page.waitForURL(/\/galleries|\/|\/home/, { timeout: 10000 });
    console.log('Login successful');
  } catch (error) {
    console.log('Login failed or already logged in, continuing...');
  }
  
  // Go to galleries page
  await page.goto('/galleries');
  console.log('On galleries page');
  
  try {
    // Count galleries
    const galleries = await page.getByTestId('gallery-item').count();
    console.log(`Found ${galleries} galleries`);
    
    if (galleries > 0) {
      // Use the first gallery
      await page.getByTestId('gallery-item').first().click();
      
      // Go to edit page
      await page.getByRole('link', { name: /edit/i }).click();
      console.log('On gallery edit page');
      
      // Count images
      const images = await page.locator('.gallery-image').count();
      console.log(`Gallery has ${images} images`);
      
      if (images > 0) {
        // Remove an image to trigger toast
        await page.locator('.gallery-image').first().hover();
        await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
        await page.getByRole('button', { name: /remove image/i }).click();
        
        // Check toast visibility
        const toast = page.locator('.fixed.bottom-4.right-4');
        
        // Toast should be visible at first
        await expect(toast).toBeVisible({ timeout: 5000 });
        console.log('Toast is visible');
        
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
      test.skip();
    }
  } catch (error) {
    console.error('Test error:', error);
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-error.png' });
    throw error;
  }
});
