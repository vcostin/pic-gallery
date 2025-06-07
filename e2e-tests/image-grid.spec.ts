import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Image Grid - E2E Tests', () => {
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

  test('should load image grid and display images correctly', async ({ page }) => {
    // Create test images via API to ensure we have content
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for images API to load real data
    await page.waitForResponse(response => 
      response.url().includes('/api/images') && response.status() === 200, 
      { timeout: 3000 }
    );
    
    // Verify images page is visible
    await expect(page.getByTestId('images-page')).toBeVisible({ timeout: 2000 });
    
    // Verify image grid appears
    await expect(page.getByTestId('image-grid')).toBeVisible({ timeout: 2000 });
    
    // Verify we have at least the uploaded images  
    const imageElements = page.locator('[data-testid="gallery-image"]');
    const imageCount = await imageElements.count();
    expect(imageCount).toBeGreaterThanOrEqual(2);
    
    // Verify image grid layout and responsiveness
    const firstImage = imageElements.first();
    await expect(firstImage).toBeVisible();
    
    // Check that images have proper attributes
    const imageLocator = firstImage.locator('img');
    // Accept both real image files and placeholder URLs (like picsum.photos)
    await expect(imageLocator).toHaveAttribute('src', /\.(jpg|jpeg|png|gif|webp)$|picsum\.photos|placeholder/i);
    await expect(imageLocator).toHaveAttribute('alt');
  });

  test('should handle image grid interactions correctly', async ({ page }) => {
    // Create test images via API
    await OptimizedTestDataFactory.createTestImagesViaAPI(page, 3);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for images to load
    const imageElements = page.locator('[data-testid="gallery-image"]');
    await expect(imageElements.first()).toBeVisible({ timeout: 3000 });
    
    // Verify we have at least 3 images
    const imageCount = await imageElements.count();
    expect(imageCount).toBeGreaterThanOrEqual(3);
    
    // Test clicking on first image
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();
    
    // Should open image viewer or navigate to image details
    // Wait for either modal or navigation
    const hasModal = await page.locator('[data-testid="image-modal"], [data-testid="image-viewer-modal"]').isVisible();
    const hasImagePage = await page.locator('[data-testid="image-details"]').isVisible();
    
    expect(hasModal || hasImagePage).toBeTruthy();
  });

  test('should handle empty state when no images exist', async ({ page }) => {
    // Clean up all images first
    await TestHelpers.cleanupTestData(page, false);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for API response
    await page.waitForResponse(response => 
      response.url().includes('/api/images'), 
      { timeout: 3000 }
    );
    
    // Should show empty state
    const emptyStateCount = await page.getByTestId('empty-state').count();
    expect(emptyStateCount).toBeGreaterThan(0);
  });
});
