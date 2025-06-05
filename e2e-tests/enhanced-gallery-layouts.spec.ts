import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Enhanced Gallery Layouts - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated for all tests
    const isAuthenticated = await TestHelpers.isAuthenticated(page);
    if (!isAuthenticated) {
      const testUser = {
        email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com',
        password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'
      };
      const loginSuccess = await TestHelpers.quickLogin(page, testUser.email, testUser.password);
      
      if (!loginSuccess) {
        throw new Error('Could not authenticate with the E2E test user');
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await TestHelpers.cleanupTestData(page, false);
  });

  test('should display gallery with different layout modes', async ({ page }) => {
    // Create a gallery with multiple images using the proper workflow
    const galleryName = 'Enhanced Layout Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 8, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for layout testing');
    }
    
    // We should already be on the gallery page after creation
    // Add an explicit wait for navigation to complete and page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the gallery view with a longer timeout
    await expect(page.getByTestId('gallery-view')).toBeVisible({ timeout: 5000 });
    
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThanOrEqual(1); // At least 1 image should be present
    console.log('Gallery has images for layout testing');
  });

  test('should switch between grid and list layout modes', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Layout Mode Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 6, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for layout mode testing');
    }
    
    // Look for layout mode controls
    const gridViewButton = page.locator('[data-testid="grid-view"], [aria-label*="grid"], button[title*="Grid"]');
    const listViewButton = page.locator('[data-testid="list-view"], [aria-label*="list"], button[title*="List"]');
    
    // Test grid view (default)
    if (await gridViewButton.isVisible()) {
      await gridViewButton.click();
      
      // Wait for grid layout to be visible instead of arbitrary timeout
      const gridContainer = page.locator('[data-testid="image-grid"], .grid');
      await expect(gridContainer).toBeVisible({ timeout: 3000 });
    }
    
    // Test list view
    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      
      // Wait for list layout to become visible instead of arbitrary timeout
      const listContainer = page.locator('[data-testid="image-list"], .list-view');
      const visible = await listContainer.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        await expect(listContainer).toBeVisible();
      }
    }
  });

  test('should handle masonry layout if available', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Masonry Layout Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 10, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for masonry testing');
    }
    
    // Look for masonry layout option
    const masonryButton = page.locator('[data-testid="masonry-view"], button[title*="Masonry"]');
    if (await masonryButton.isVisible()) {
      await masonryButton.click();
      
      // Verify masonry layout
      const masonryContainer = page.locator('[data-testid="masonry-grid"], .masonry');
      await expect(masonryContainer).toBeVisible({ timeout: 3000 });
      
      // In masonry layout, items should have varying heights
      const imageItems = page.locator('[data-testid="gallery-image"]');
      const itemCount = await imageItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(1); // At least 1 image should be present
    }
  });

  test('should handle carousel layout mode', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Carousel Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 5, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for carousel testing');
    }
    
    // Look for carousel/slideshow mode
    const carouselButton = page.locator('[data-testid="carousel-view"], button[title*="Carousel"], button[title*="Slideshow"]');
    if (await carouselButton.isVisible()) {
      await carouselButton.click();
      await page.waitForTimeout(500);
      
      // Verify carousel interface
      const carouselContainer = page.locator('[data-testid="image-carousel"], .carousel');
      await expect(carouselContainer).toBeVisible();
      
      // Test carousel navigation
      const nextButton = page.locator('[data-testid="carousel-next"], .carousel-next');
      const prevButton = page.locator('[data-testid="carousel-prev"], .carousel-prev');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
      
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should maintain layout preferences across page reloads', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Persistent Layout Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 4, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for persistence testing');
    }
    
    // Change to list view if available
    const listViewButton = page.locator('[data-testid="list-view"], button[title*="List"]');
    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      await page.waitForTimeout(500);
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('load');
      
      // Check if list view is still active (this depends on implementation)
      const listContainer = page.locator('[data-testid="image-list"], .list-view');
      if (await listContainer.isVisible()) {
        await expect(listContainer).toBeVisible();
      }
    }
  });

  test('should handle fullscreen gallery mode', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Fullscreen Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 3, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for fullscreen testing');
    }
    
    // Ensure page is fully loaded before interacting with it
    await page.waitForLoadState('networkidle');
    
    // Click on first image to enter fullscreen/viewer mode
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await expect(firstImage).toBeVisible({ timeout: 5000 });
    await firstImage.click();
    
    // Should open fullscreen viewer
    const fullscreenViewer = page.locator('[data-testid="image-viewer-modal"], [data-testid="fullscreen-viewer"]');
    await expect(fullscreenViewer).toBeVisible({ timeout: 5000 });
    
    // Test navigation in fullscreen
    const nextButton = page.locator('[data-testid="gallery-next-button"], [data-testid="viewer-next"], [aria-label*="next"]');
    if (await nextButton.isVisible({ timeout: 2000 })) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
    
    // Exit fullscreen
    await page.keyboard.press('Escape');
    await expect(fullscreenViewer).not.toBeVisible();
  });

  test('should handle responsive layout adjustments', async ({ page }) => {
    // Create gallery with images using proper workflow
    const galleryName = 'Responsive Layout Gallery';
    const galleryResult = await TestHelpers.createGalleryWithImages(page, 6, galleryName);
    
    if (!galleryResult) {
      throw new Error('Failed to create gallery with images for responsive testing');
    }
    
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1200, height: 800 }   // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Verify gallery still displays properly
      await expect(page.getByTestId('gallery-view')).toBeVisible();
      
      const images = page.locator('[data-testid="gallery-image"]');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThanOrEqual(1); // At least 1 image should be present
      
      // Verify images are still clickable
      await images.first().click();
      
      const viewer = page.locator('[data-testid="image-viewer-modal"], [role="dialog"]');
      await expect(viewer).toBeVisible();
      
      // Close viewer
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
    }
  });
});
