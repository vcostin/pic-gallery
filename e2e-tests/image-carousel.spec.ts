import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Image Carousel - Navigation and Controls', () => {
  let galleryId: string;
  
  test.beforeAll(async ({ browser }) => {
    // Set up test data once for all tests using optimized API approach
    const page = await browser.newPage();
    
    // Ensure authentication
    const isAuthenticated = await TestHelpers.isAuthenticated(page);
    if (!isAuthenticated) {
      const testUser = {
        email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com',
        password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'
      };
      await TestHelpers.quickLogin(page, testUser.email, testUser.password);
    }
    
    // Create gallery with API for efficiency
    const galleryResult = await OptimizedTestDataFactory.createTestGallery(page, {
      name: 'Carousel Test Gallery',
      imageCount: 3,
      useExistingImages: true
    });
    
    galleryId = galleryResult.galleryId;
    await page.close();
  });
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the test gallery
    await page.goto(`/galleries/${galleryId}`);
    await page.waitForLoadState('load');
  });
  
  test.afterAll(async ({ browser }) => {
    // Clean up test data
    const page = await browser.newPage();
    await TestHelpers.cleanupTestData(page, false);
    await page.close();
  });

  test('should open carousel modal when clicking on gallery image', async ({ page }) => {
    // Click on first image to open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await expect(firstImage).toBeVisible();
    await firstImage.click();
    
    // Carousel modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check that an image is displayed in the carousel
    const carouselImage = page.locator('[role="dialog"] img');
    await expect(carouselImage).toBeVisible();
  });

  test('should close carousel with escape key', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Press escape key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close carousel with close button', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click close button
    const closeButton = page.locator('[role="dialog"] button[aria-label="Close dialog"]');
    await closeButton.click();
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should navigate to next image using button', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click next button
    const nextButton = page.locator('[role="dialog"] button[aria-label="Next image"]');
    await nextButton.click();
    
    // Should show image counter update
    await expect(page.locator('[role="dialog"]')).toContainText('2 of 3');
  });

  test('should navigate to previous image using button', async ({ page }) => {
    // Open carousel on second image
    const secondImage = page.locator('[data-testid="gallery-image"]').nth(1);
    await secondImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click previous button
    const prevButton = page.locator('[role="dialog"] button[aria-label="Previous image"]');
    await prevButton.click();
    
    // Should show first image counter
    await expect(page.locator('[role="dialog"]')).toContainText('1 of 3');
  });

  test('should cycle navigation (wraparound) at boundaries', async ({ page }) => {
    // Open carousel on last image
    const lastImage = page.locator('[data-testid="gallery-image"]').nth(2);
    await lastImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Should show last image counter
    await expect(page.locator('[role="dialog"]')).toContainText('3 of 3');
    
    // Click next on last image - should cycle to first
    const nextButton = page.locator('[role="dialog"] button[aria-label="Next image"]');
    await nextButton.click();
    
    await expect(page.locator('[role="dialog"]')).toContainText('1 of 3');
    
    // Click previous on first image - should cycle to last
    const prevButton = page.locator('[role="dialog"] button[aria-label="Previous image"]');
    await prevButton.click();
    
    await expect(page.locator('[role="dialog"]')).toContainText('3 of 3');
  });

  test('should display image metadata correctly', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check image counter is displayed
    await expect(page.locator('[role="dialog"]')).toContainText('1 of 3');
    
    // Verify the carousel image is visible
    const carouselImage = page.locator('[role="dialog"] img');
    await expect(carouselImage).toBeVisible();
  });

  test('should handle carousel accessibility features', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    
    // Check modal accessibility attributes
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Check button aria labels
    await expect(page.locator('button[aria-label="Close dialog"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Previous image"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Next image"]')).toBeVisible();
    
    // Check image is properly displayed
    const carouselImage = page.locator('[role="dialog"] img');
    await expect(carouselImage).toBeVisible();
  });

  test('should maintain aspect ratio and proper image sizing', async ({ page }) => {
    // Open carousel
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check image has object-contain class for proper sizing
    const carouselImage = page.locator('[role="dialog"] img');
    await expect(carouselImage).toHaveClass(/object-contain/);
  });
});
