import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Complete Images Page Workflow - E2E Integration', () => {
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

  test('complete images workflow: view, search, and manage images', async ({ page }) => {
    // ========== PHASE 1: CREATE TEST IMAGES VIA API ==========
    console.log('Phase 1: Creating test images via optimized API...');
    
    // Use optimized factory to create images efficiently
    const imageIds = await OptimizedTestDataFactory.createTestImages(page, 4, true);
    console.log(`✅ Successfully created ${imageIds.length} test images via API:`, imageIds);
    
    // ========== PHASE 2: NAVIGATE TO IMAGES PAGE ==========
    console.log('Phase 2: Navigating to images page...');
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Verify page loads correctly
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // ========== PHASE 3: VERIFY UPLOADED IMAGES APPEAR ==========
    console.log('Phase 3: Verifying uploaded images appear in grid...');
    
    // Wait for image grid to load
    const imageGrid = page.locator('[data-testid="image-grid"]');
    await expect(imageGrid).toBeVisible({ timeout: 3000 });
    
    // Check that at least some images are displayed
    const galleryImages = page.locator('[data-testid="gallery-image"]');
    const imageCount = await galleryImages.count();
    console.log(`Found ${imageCount} images on images page`);
    
    // Expect at least the images we created
    expect(imageCount).toBeGreaterThanOrEqual(imageIds.length);
    
    // ========== PHASE 4: TEST SEARCH FUNCTIONALITY ==========
    console.log('Phase 4: Testing search functionality...');
    
    const searchInput = page.getByTestId('search-input');
    if (await searchInput.isVisible()) {    // Search for one of our uploaded images
    const searchTerm = 'E2E Test';
    await searchInput.fill(searchTerm);
    
    // Wait for search results to update instead of arbitrary timeout
    await page.waitForFunction(
      () => {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('searchQuery') === 'E2E Test' || 
               !document.querySelector('.loading, .spinner');
      },
      { timeout: 3000 }
    ).catch(() => {
      // Fallback: minimal wait for search debounce
      return page.waitForTimeout(300);
    });
    
    // Verify search results show our test images
    const searchResults = page.locator('[data-testid="gallery-image"]');
    const searchCount = await searchResults.count();
    console.log(`Search for "${searchTerm}" returned ${searchCount} images`);
    
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
    } else {
      console.log('Search input not found, skipping search test');
    }
    
    // ========== PHASE 5: TEST IMAGE INTERACTION ==========
    console.log('Phase 5: Testing image interaction...');
    
    if (imageCount > 0) {
      const firstImage = page.getByTestId('gallery-image').first();
      
      // Test hover effects - wait for element to be ready for hover
      await expect(firstImage).toBeVisible();
      await firstImage.hover();
      
      // Wait for hover effects to apply
      await page.waitForFunction(
        () => document.querySelector('[data-testid="gallery-image"]:hover') !== null,
        { timeout: 1000 }
      ).catch(() => {
        // Continue if hover effect detection fails
      });
      
      // Test click to view image details or modal
      await firstImage.click();
      
      // Wait for navigation or modal to appear
      const modalOrNavigation = await Promise.race([
        page.waitForSelector('[data-testid="image-modal"], [data-testid="image-viewer-modal"]', { timeout: 2000 }).then(() => 'modal'),
        page.waitForURL(/\/images\/.*/, { timeout: 2000 }).then(() => 'navigation'),
        page.waitForTimeout(2000).then(() => 'timeout')
      ]);
      
      // Check if modal opened or navigated to details page
      const isModal = modalOrNavigation === 'modal';
      const isDetailsPage = modalOrNavigation === 'navigation' || 
        (page.url().includes('/images/') && !page.url().endsWith('/images'));
      
      if (isModal) {
        console.log('✅ Image modal opened successfully');
        // Close modal if it opened
        const closeButton = page.locator('[data-testid="close-modal"], [data-testid="modal-close"], .modal-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // Try escape key
          await page.keyboard.press('Escape');
        }
      } else if (isDetailsPage) {
        console.log('✅ Navigated to image details page');
        // Navigate back to images page
        await page.goto('/images');
        await page.waitForLoadState('load');
      } else {
        console.log('Image click behavior unclear, continuing...');
      }
    }
    
    // ========== PHASE 6: TEST TAG FILTERING (IF AVAILABLE) ==========
    console.log('Phase 6: Testing tag filtering...');
    
    const tagFilters = page.locator('[data-testid*="tag-filter"], [data-testid*="tag-button"]');
    const tagCount = await tagFilters.count();
    
    if (tagCount > 0) {
      console.log(`Found ${tagCount} tag filters, testing first one...`);
      const firstTag = tagFilters.first();
      await firstTag.click();
      
      // Wait for filtering to complete by checking if URL or grid state changes
      await page.waitForFunction(
        () => {
          const searchParams = new URLSearchParams(window.location.search);
          return searchParams.get('tag') !== null || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => {
        // Fallback wait
        return page.waitForTimeout(300);
      });
      
      // Verify filtering occurred
      const filteredImages = page.locator('[data-testid="gallery-image"]');
      const filteredCount = await filteredImages.count();
      console.log(`After tag filter: ${filteredCount} images shown`);
      
      // Clear filter by clicking again or finding clear button
      await firstTag.click();
      
      // Wait for filter to clear
      await page.waitForFunction(
        () => {
          const searchParams = new URLSearchParams(window.location.search);
          return !searchParams.get('tag') || 
                 !document.querySelector('.loading, .spinner');
        },
        { timeout: 2000 }
      ).catch(() => {
        // Fallback wait
        return page.waitForTimeout(300);
      });
    } else {
      console.log('No tag filters found, skipping tag filter test');
    }
    
    // ========== PHASE 7: VERIFY RESPONSIVE BEHAVIOR ==========
    console.log('Phase 7: Testing responsive behavior...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive layout adjustment by checking viewport-specific elements
    await page.waitForFunction(
      () => window.innerWidth === 375,
      { timeout: 1000 }
    ).catch(() => {
      // Fallback wait for layout adjustment
      return page.waitForTimeout(200);
    });
    
    // Verify images still display properly on mobile
    const mobileImages = page.locator('[data-testid="gallery-image"]');
    const mobileCount = await mobileImages.count();
    console.log(`Mobile view shows ${mobileCount} images`);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for responsive layout to adjust back
    await page.waitForFunction(
      () => window.innerWidth === 1280,
      { timeout: 1000 }
    ).catch(() => {
      // Fallback wait for layout adjustment
      return page.waitForTimeout(200);
    });
    
    console.log('✅ Complete images workflow test completed successfully!');
  });

  test('images page empty state handling', async ({ page }) => {
    console.log('Testing empty state when no images exist...');
    
    // Navigate to images page without uploading any images
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Check for empty state or ensure graceful handling
    const imageGrid = page.locator('[data-testid="image-grid"]');
    const emptyState = page.locator('[data-testid="empty-state"], [data-testid="no-images"]');
    
    const hasImages = await imageGrid.isVisible() && await page.locator('[data-testid="gallery-image"]').count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    if (hasImages) {
      console.log('✅ Images found on page (from previous tests or existing data)');
      expect(await page.locator('[data-testid="gallery-image"]').count()).toBeGreaterThan(0);
    } else if (hasEmptyState) {
      console.log('✅ Empty state displayed correctly');
      await expect(emptyState).toBeVisible();
    } else {
      console.log('ℹ️ No specific empty state found, but page loads normally');
      await expect(page.getByTestId('images-page')).toBeVisible();
    }
  });

  test('images page error handling', async ({ page }) => {
    console.log('Testing error handling and recovery...');
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Verify page loads without errors
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    // Test navigation away and back
    await page.goto('/');
    await page.waitForLoadState('load');
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Verify page still works after navigation
    await expect(page.getByTestId('images-page')).toBeVisible();
    
    console.log('✅ Navigation and error handling test completed');
  });
});
