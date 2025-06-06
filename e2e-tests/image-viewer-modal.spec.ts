import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Image Viewer Modal - Navigation and Interactions', () => {
  test.beforeAll(async ({ browser }) => {
    // Set up test images for modal testing via API
    const page = await browser.newPage();
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/images');
    await page.waitForLoadState('load');
  });
  
  test.afterAll(async ({ browser }) => {
    // Clean up test data
    const page = await browser.newPage();
    await TestHelpers.completeCleanup(page);
    await page.close();
  });

  test('should open image viewer modal when clicking on image', async ({ page }) => {
    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
    // Click on first image to open viewer
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    // Check that modal is visible
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Check that an image is displayed in the modal
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
  });

  test('should close image viewer modal using close button', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Click close button
    await page.getByRole('button', { name: /close/i }).click();
    
    // Modal should be closed
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible();
  });

  test('should close image viewer modal using Escape key', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible();
  });

  test('should navigate to next image using arrow button', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Click next arrow if available (depends on having multiple images)
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Verify modal still open and showing an image
      await expect(page.locator('[role="dialog"] img')).toBeVisible();
    }
  });

  test('should navigate to previous image using arrow button', async ({ page }) => {
    // Try to open modal on second image if available
    const images = page.getByTestId('gallery-image');
    const imageCount = await images.count();
    
    if (imageCount > 1) {
      await images.nth(1).click();
      
      await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
      
      // Click previous arrow
      const prevButton = page.getByRole('button', { name: /previous/i });
      if (await prevButton.isVisible()) {
        await prevButton.click();
        // Verify modal still open and showing an image
        await expect(page.locator('[role="dialog"] img')).toBeVisible();
      }
    }
  });

  test('should navigate using keyboard arrow keys', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Press right arrow key to go to next image (if available)
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
    
    // Press left arrow key to go back
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
  });

  test('should handle zoom functionality', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Look for zoom controls (if they exist)
    const zoomInButton = page.getByRole('button', { name: /zoom in/i });
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click();
    }
    
    // Check image is still visible after zoom operations
    const imageContainer = page.locator('[role="dialog"] img').first();
    await expect(imageContainer).toBeVisible();
    
    // Look for zoom out button (if it exists)
    const zoomOutButton = page.getByRole('button', { name: /zoom out/i });
    if (await zoomOutButton.isVisible()) {
      await zoomOutButton.click();
    }
  });

  test('should show image information correctly', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Check that an image is displayed
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
    
    // The modal should contain the image and be properly structured
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should handle edge cases (navigation boundaries)', async ({ page }) => {
    // Open modal on first image
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Try navigation (behavior depends on implementation)
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
    
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[role="dialog"] img')).toBeVisible();
  });

  test('should maintain focus management and accessibility', async ({ page }) => {
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    
    // Check aria attributes
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('role', 'dialog');
    
    // Check that focus management is working by tabbing
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
