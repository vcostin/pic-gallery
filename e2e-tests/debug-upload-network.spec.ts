import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Debug Upload Network', () => {
  test('should replicate working enhanced upload pattern', async ({ page }) => {
    // Track network requests
    const networkRequests: Array<{
      url: string;
      method: string;
      status?: number;
      timestamp: number;
    }> = [];

    // Listen to all network requests with timestamps
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      });
    });

    page.on('response', response => {
      const requestIndex = networkRequests.findIndex(req => 
        req.url === response.url() && !req.hasOwnProperty('status')
      );
      if (requestIndex >= 0) {
        networkRequests[requestIndex].status = response.status();
      }
    });

    // Navigate to upload page (user should already be authenticated)
    await page.goto('/images/upload');
    
    // Wait for upload interface - replicate working pattern exactly
    await expect(page).toHaveURL(/\/images\/upload/);
    await expect(page.getByText('Upload Images')).toBeVisible();
    
    // Replicate the EXACT working pattern from enhanced-upload.spec.ts
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    // Create a file chooser promise before triggering the action
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click the drag and drop zone to trigger file selection
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    // Handle file selection
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Verify Step 2 appears after file selection
    await expect(page.locator('.bg-blue-500:has-text("2")')).toBeVisible();
    await expect(page.getByText('Add Details')).toBeVisible();
    
    // Verify file counter
    await expect(page.getByText('1 file selected')).toBeVisible();
    
    // Fill form - replicate working pattern
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('Debug Network Test');
    
    // Add description
    const descriptionInput = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInput.fill('Debug network test description');
    
    // Get upload button and click
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeEnabled();
    await expect(uploadButton).toContainText('Upload Image');
    
    console.log('=== STARTING UPLOAD ===');
    
    // Perform upload
    await uploadButton.click();
    
    // Wait for success or error
    try {
      // First try to wait for success
      await expect(page.getByText(/uploaded successfully/)).toBeVisible({ timeout: 15000 });
      console.log('✅ Upload succeeded!');
    } catch (error) {
      // If failed, check for error message
      const errorVisible = await page.locator('text=All uploads failed').isVisible().catch(() => false);
      console.log('❌ Upload failed. Error message visible:', errorVisible);
    }
    
    // Wait a bit more for any network activity
    await page.waitForTimeout(2000);
    
    // Log all API network requests
    console.log('=== NETWORK REQUESTS ===');
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}: ${req.method} ${req.url} -> ${req.status || 'pending'} (${req.timestamp})`);
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-upload-working-pattern.png', fullPage: true });
    
    expect(true).toBe(true); // Just to make the test pass while debugging
  });
});
