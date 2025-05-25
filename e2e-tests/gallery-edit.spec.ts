import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

// Tests for gallery editing functionality - including toast notifications
test.describe('Gallery Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the galleries page
    await page.goto('/galleries');
  });
  
  // Clean up after all tests are completed
  test.afterEach(async ({ page }) => {
    await TestHelpers.cleanupTestData(page);
  });

  test('toast notifications should appear and disappear correctly when removing an image', async ({ page }) => {
    // Find an existing gallery to edit
    const galleries = page.getByTestId('gallery-item');
    const count = await galleries.count();
    
    console.log(`Found ${count} galleries`);
    
    if (count === 0) {
      console.log('No galleries found, skipping test');
      test.skip('No galleries found to test');
      return;
    }
    
    // Click the first gallery
    await galleries.first().click();
    
    // Verify we're on the gallery detail page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
    
    // Click the edit gallery button
    await page.getByRole('link', { name: /edit/i }).click();
    
    // Verify we're on the edit page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+\/edit/);
    
    // Check if there are any images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    
    if (imageCount === 0) {
      test.skip('No images in gallery to test removal');
    }
    
    // Click the remove button on the first image
    await page.locator('.gallery-image').first().hover();
    await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
    
    // Confirm removal in the dialog
    await page.getByRole('button', { name: /remove image/i }).click();
    
    // Verify toast notification appears
    const toast = page.locator('.fixed.bottom-4.right-4');
    await expect(toast).toBeVisible();
    
    // Wait for the toast to disappear (it should auto-dismiss after 3 seconds)
    // Using a timeout slightly longer than the expected 3 seconds
    await expect(toast).toBeVisible({ timeout: 4000 });
    await expect(toast).not.toBeVisible({ timeout: 2000 });
    
    // Cancel without saving changes
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Confirm discarding changes
    await page.getByRole('button', { name: /discard/i }).click();
  });

  test('toast notifications should disappear when clicking the X button', async ({ page }) => {
    // Find an existing gallery to edit
    const galleries = page.getByTestId('gallery-item');
    const count = await galleries.count();
    
    if (count === 0) {
      test.skip('No galleries found to test');
    }
    
    // Click the first gallery
    await galleries.first().click();
    
    // Verify we're on the gallery detail page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
    
    // Click the edit gallery button
    await page.getByRole('link', { name: /edit/i }).click();
    
    // Verify we're on the edit page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+\/edit/);
    
    // Check if there are any images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    
    if (imageCount === 0) {
      test.skip('No images in gallery to test removal');
    }
    
    // Click the remove button on the first image
    await page.locator('.gallery-image').first().hover();
    await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
    
    // Confirm removal in the dialog
    await page.getByRole('button', { name: /remove image/i }).click();
    
    // Verify toast notification appears
    const toast = page.locator('.fixed.bottom-4.right-4');
    await expect(toast).toBeVisible();
    
    // Click the X button on the toast
    await toast.getByRole('button').click();
    
    // Verify toast disappears immediately
    await expect(toast).not.toBeVisible();
    
    // Cancel without saving changes
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Confirm discarding changes
    await page.getByRole('button', { name: /discard/i }).click();
  });
});
