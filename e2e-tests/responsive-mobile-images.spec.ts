import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_USER } from './auth-config';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Responsive & Mobile Image Gallery - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // This test project is configured to use stored authentication state
    // Only authenticate manually if the stored state somehow fails
    try {
      // Quick navigation test to verify authentication
      await page.goto('/galleries', { timeout: 5000 });
      await page.waitForLoadState('networkidle', { timeout: 3000 });
      
      // If we're redirected to login, the stored auth state didn't work
      if (page.url().includes('/auth/login')) {
        console.log('Stored auth state failed, attempting manual login...');
        const loginSuccess = await TestHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
        if (!loginSuccess) {
          throw new Error('Could not authenticate with the E2E test user');
        }
      }
    } catch (error) {
      console.log('Authentication check failed, attempting manual login...', error);
      const loginSuccess = await TestHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
      if (!loginSuccess) {
        throw new Error('Could not authenticate with the E2E test user');
      }
    }

    // Create test images for responsive testing - MUST have data to test properly
    console.log('🚀 Creating test images for responsive tests...');
    const testImages = await OptimizedTestDataFactory.createTestImages(page, 6, true);
    
    if (testImages.length === 0) {
      throw new Error('Failed to create test images for responsive tests - cannot test without data');
    }
    
    console.log(`✅ Created ${testImages.length} test images for responsive testing`);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await TestHelpers.cleanupTestData(page, false);
  });

  test('should display mobile layout correctly on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Verify responsive layout
    await expect(page.getByTestId('images-page')).toBeVisible({ timeout: 5000 });
    
    // MUST have images to test mobile layout properly - fail if none
    const imageGrid = page.getByTestId('image-grid');
    await expect(imageGrid).toBeVisible({ timeout: 5000 });
    
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    
    // Test MUST fail if no images available - we need data to test layout
    expect(imageCount).toBeGreaterThan(0);
    
    console.log(`✅ Mobile layout test completed with ${imageCount} images`);
    
    // Test mobile navigation if present
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, .navbar-toggler');
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await expect(page.locator('.nav-menu, .navbar-collapse')).toBeVisible();
    }
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // MUST have images to test touch interactions - fail if none
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    
    // Wait for first image to be visible
    const firstImage = images.first();
    await expect(firstImage).toBeVisible();
    
    // Test touch tap (click on mobile)
    await firstImage.click();
    
    // Should open image viewer or modal
    const hasModal = await page.locator('[data-testid="image-modal"], [data-testid="image-viewer-modal"]').isVisible();
    const hasImagePage = await page.locator('[data-testid="image-details"]').isVisible();
    
    expect(hasModal || hasImagePage).toBeTruthy();
    
    console.log('✅ Touch interaction test completed successfully');
  });

  test('should adapt grid layout for tablet screens', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // MUST have images to test tablet layout - fail if none
    const imageGrid = page.getByTestId('image-grid');
    await expect(imageGrid).toBeVisible({ timeout: 5000 });
    
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    
    // Verify responsive grid columns (should have more columns than mobile)
    const gridComputedStyle = await imageGrid.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    
    // Should have more columns than mobile layout
    expect(gridComputedStyle).not.toBe('1fr');
    
    console.log(`✅ Tablet layout test completed with ${imageCount} images`);
  });

  test('should maintain functionality across different screen sizes', async ({ page }) => {
    const screenSizes = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];
    
    for (const screenSize of screenSizes) {
      console.log(`📱 Testing ${screenSize.name} (${screenSize.width}x${screenSize.height})`);
      
      await page.setViewportSize({ width: screenSize.width, height: screenSize.height });
      
      // Navigate to images page
      await page.goto('/images');
      await page.waitForLoadState('networkidle');
      
      // Basic functionality should work on all screen sizes
      await expect(page.getByTestId('images-page')).toBeVisible();
      
      // MUST have images to test functionality - fail if none
      const imageGrid = page.getByTestId('image-grid');
      await expect(imageGrid).toBeVisible({ timeout: 5000 });
      
      const images = page.locator('[data-testid="gallery-image"]');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThanOrEqual(1);
      
      // Test clicking first image
      await images.first().click();
      
      // Should open something (modal or navigate)
      const hasModal = await page.locator('[data-testid="image-modal"], [data-testid="image-viewer-modal"]').isVisible();
      const hasImagePage = await page.locator('[data-testid="image-details"]').isVisible();
      
      expect(hasModal || hasImagePage).toBeTruthy();
      
      // Close modal if opened
      if (hasModal) {
        const closeButton = page.locator('[data-testid="close-modal"], .modal-close, [aria-label*="close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        // Navigate back if on image page
        await page.goBack();
      }
      
      console.log(`✅ ${screenSize.name} functionality test completed`);
    }
  });

  test('should handle touch scrolling in mobile image grid', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // MUST have images to test scrolling - fail if none
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    
    // Wait for images to load
    await expect(images.first()).toBeVisible();
    
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 200));
    
    // Wait a bit for scrolling to complete
    await page.waitForTimeout(500);
    
    // Get final scroll position
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(initialScrollY);
    
    console.log('✅ Touch scrolling test completed successfully');
  });

  test('should maintain aspect ratios on different screen orientations', async ({ page }) => {
    // Test portrait orientation first
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // MUST have images to test aspect ratios - fail if none
    const images = page.locator('[data-testid="gallery-image"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
    
    await expect(images.first()).toBeVisible();
    
    // Get image dimensions in portrait
    const portraitImageBox = await page.locator('[data-testid="gallery-image"] img').first().boundingBox();
    
    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500); // Allow for layout changes
    
    // Get image dimensions in landscape
    const landscapeImageBox = await page.locator('[data-testid="gallery-image"] img').first().boundingBox();
    
    // Images should maintain proper aspect ratios
    expect(portraitImageBox).toBeTruthy();
    expect(landscapeImageBox).toBeTruthy();
    
    if (portraitImageBox && landscapeImageBox) {
      const portraitRatio = portraitImageBox.width / portraitImageBox.height;
      const landscapeRatio = landscapeImageBox.width / landscapeImageBox.height;
      
      // Aspect ratios should be similar (allowing for small differences due to responsive design)
      expect(Math.abs(portraitRatio - landscapeRatio)).toBeLessThan(0.5);
    }
    
    console.log('✅ Aspect ratio test completed successfully');
  });
});
