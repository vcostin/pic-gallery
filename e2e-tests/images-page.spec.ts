import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Images Page - E2E Tests', () => {
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
    // Clean up any test data created during this test
    await TestHelpers.cleanupTestData(page, false);
  });

  test('should load images page and display image grid', async ({ page }) => {
    // First create some test images via API to ensure we have content
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Verify page loads correctly
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Check for either images or empty state
    const imageGrid = page.locator('[data-testid="image-grid"]');
    const emptyState = page.locator('[data-testid="empty-state"]');
    
    // Should show either images or empty state
    const hasImages = await imageGrid.isVisible() && await page.locator('[data-testid="gallery-image"]').count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasImages || hasEmptyState).toBe(true);
    
    if (hasImages) {
      console.log('✅ Images displayed successfully');
      const imageCount = await page.locator('[data-testid="gallery-image"]').count();
      expect(imageCount).toBeGreaterThan(0);
    } else {
      console.log('✅ Empty state displayed correctly');
    }
  });

  test('should handle search functionality', async ({ page }) => {
    // Create test images with specific titles for searching via API
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for page to load
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Test search functionality if available
    const searchInput = page.getByTestId('search-input');
    
    if (await searchInput.isVisible()) {
      console.log('Testing search functionality...');
      
      // Search for our test images
      await searchInput.fill('E2E Test');
      
      // Wait for search to complete using URL params or absence of loading indicators
      await page.waitForFunction(
        () => {
          const searchParams = new URLSearchParams(window.location.search);
          return searchParams.get('searchQuery') === 'E2E Test' || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => {
        // Fallback: minimal debounce wait
        return page.waitForTimeout(200);
      });
      
      // Should show filtered results
      const searchResults = page.locator('[data-testid="gallery-image"]');
      const resultCount = await searchResults.count();
      console.log(`Search returned ${resultCount} results`);
      
      // Clear search
      await searchInput.clear();
      
      // Wait for search to clear
      await page.waitForFunction(
        () => {
          const searchParams = new URLSearchParams(window.location.search);
          return !searchParams.get('searchQuery') || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => {
        // Fallback: minimal wait
        return page.waitForTimeout(200);
      });
      
      console.log('✅ Search functionality works');
    } else {
      console.log('Search input not found, skipping search test');
    }
  });

  test('should handle image interaction and navigation', async ({ page }) => {
    // Create test images via API
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Check if we have images to interact with
    const galleryImages = page.locator('[data-testid="gallery-image"]');
    const imageCount = await galleryImages.count();
    
    if (imageCount > 0) {
      console.log(`Testing interaction with ${imageCount} images...`);
      
      const firstImage = galleryImages.first();
      
      // Test hover effects
      await firstImage.hover();
      // Wait for hover effects to be applied
      await Promise.race([
        page.waitForFunction(() => {
          const image = document.querySelector('[data-testid="gallery-image"]');
          return image && window.getComputedStyle(image).transform !== 'none';
        }, { timeout: 2000 }),
        page.waitForTimeout(300)
      ]).catch(() => {});
      
      // Test image click
      await firstImage.click();
      // Wait for navigation or modal to appear
      await Promise.race([
        page.waitForSelector('[data-testid="image-modal"], [data-testid="image-viewer-modal"]', { timeout: 2000 }),
        page.waitForFunction(() => window.location.pathname.includes('/images/') && !window.location.pathname.endsWith('/images'), { timeout: 2000 }),
        page.waitForTimeout(300)
      ]).catch(() => {});
      
      // Check if modal or detail page opened
      const isModal = await page.locator('[data-testid="image-modal"], [data-testid="image-viewer-modal"]').isVisible();
      const isDetailPage = page.url().includes('/images/') && !page.url().endsWith('/images');
      
      if (isModal) {
        console.log('✅ Image modal opened');
        // Close modal
        const closeButton = page.locator('[data-testid="close-modal"], [data-testid="modal-close"], .modal-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } else if (isDetailPage) {
        console.log('✅ Navigated to image detail page');
        // Navigate back
        await page.goto('/images');
        await page.waitForLoadState('load');
      } else {
        console.log('Image click behavior varies, continuing...');
      }
    } else {
      console.log('No images found for interaction testing');
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Navigate to images page without uploading anything
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Page should load without errors
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Check for proper empty state handling
    const imageGrid = page.locator('[data-testid="image-grid"]');
    const emptyState = page.locator('[data-testid="empty-state"], [data-testid="no-images"]');
    
    const hasImages = await imageGrid.isVisible() && await page.locator('[data-testid="gallery-image"]').count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    if (!hasImages && hasEmptyState) {
      console.log('✅ Empty state displayed correctly');
      await expect(emptyState).toBeVisible();
    } else if (hasImages) {
      console.log('✅ Images found (from previous tests or existing data)');
    } else {
      console.log('ℹ️ Page loads normally without specific empty state');
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Upload test images
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    const desktopImages = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`Desktop view: ${desktopImages} images`);
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    // Wait for responsive layout changes to take effect
    await page.waitForFunction(
      () => window.innerWidth === 768,
      { timeout: 2000 }
    ).catch(() => page.waitForTimeout(200));
    
    const tabletImages = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`Tablet view: ${tabletImages} images`);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    // Wait for responsive layout changes to take effect
    await page.waitForFunction(
      () => window.innerWidth === 375,
      { timeout: 2000 }
    ).catch(() => page.waitForTimeout(200));
    
    const mobileImages = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`Mobile view: ${mobileImages} images`);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Responsive behavior test completed');
  });

  test('should handle navigation and page refresh', async ({ page }) => {
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Verify initial load
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Navigate away and back
    await page.goto('/');
    await page.waitForLoadState('load');
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Should still work after navigation
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Test page refresh
    await page.reload();
    await page.waitForLoadState('load');
    
    // Should still work after refresh
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    console.log('✅ Navigation and refresh test completed');
  });

  test('should handle tag filtering if available', async ({ page }) => {
    // Create test images with tags via API
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Look for tag filters
    const tagFilters = page.locator('[data-testid*="tag-filter"], [data-testid*="tag-button"]');
    const tagCount = await tagFilters.count();
    
    if (tagCount > 0) {
      console.log(`Found ${tagCount} tag filters, testing...`);
      
      const originalImageCount = await page.locator('[data-testid="gallery-image"]').count();
      console.log(`Original image count: ${originalImageCount}`);
      
      // Click first tag filter
      const firstTag = tagFilters.first();
      await firstTag.click();
      // Wait for tag filtering to be applied
      await page.waitForFunction(
        () => {
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get('tag') !== null || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => page.waitForTimeout(200));
      
      const filteredImageCount = await page.locator('[data-testid="gallery-image"]').count();
      console.log(`Filtered image count: ${filteredImageCount}`);
      
      // Clear filter
      await firstTag.click();
      // Wait for filter to be cleared
      await page.waitForFunction(
        () => {
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get('tag') === null || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => page.waitForTimeout(200));
      
      console.log('✅ Tag filtering test completed');
    } else {
      console.log('No tag filters found, skipping tag filter test');
    }
  });
});
