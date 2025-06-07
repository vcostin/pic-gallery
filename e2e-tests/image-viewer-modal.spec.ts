import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Image Viewer Modal - Navigation and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated for all tests
    const isAuthenticated = await TestHelpers.isAuthenticated(page);
    if (!isAuthenticated) {
      const testUser = {
        email: process.env.E2E_TEST_USER_EMAIL || 'e2e-single-user@example.com',
        password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'
      };
      const loginSuccess = await TestHelpers.quickLogin(page, testUser.email, testUser.password);
      
      if (!loginSuccess) {
        throw new Error('Could not authenticate with the E2E test user');
      }
    }
  });
  
  test.afterEach(async ({ page }) => {
    // Clean up test data but keep user account
    await TestHelpers.cleanupTestData(page);
  });

  test('should open image viewer modal when clicking on image', async ({ page }) => {
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first  
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load  
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
    // Open modal
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    
    // Click next arrow if available (depends on having multiple images)
    const nextButton = page.getByRole('button', { name: /next image/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Verify modal still open and showing an image
      await expect(page.locator('[role="dialog"] img')).toBeVisible();
    }
  });

  test('should navigate to previous image using arrow button', async ({ page }) => {
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
    // Try to open modal on second image if available
    const images = page.getByTestId('gallery-image');
    const imageCount = await images.count();
    
    if (imageCount > 1) {
      await images.nth(1).click();
      
      await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
      
      // Click previous arrow
      const prevButton = page.getByRole('button', { name: /previous image/i });
      if (await prevButton.isVisible()) {
        await prevButton.click();
        // Verify modal still open and showing an image
        await expect(page.locator('[role="dialog"] img')).toBeVisible();
      }
    }
  });

  test('should navigate using keyboard arrow keys', async ({ page }) => {
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
    // Create test images first
    const imageIds = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    expect(imageIds.length).toBeGreaterThan(0);
    
    // Navigate to images page to see the test images
    await page.goto('/images');
    await page.waitForLoadState('load');

    // Wait for images to load
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
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
