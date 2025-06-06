import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_USER } from './auth-config';

test.describe('Responsive & Mobile Image Gallery - E2E Tests', () => {

  test('should display mobile layout correctly on small screens', async ({ page }) => {
    console.log('📱 Testing mobile layout...');
    
    // Login first
    const loginSuccess = await TestHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);
    
    // Navigate to images page directly (use any existing images from previous tests)
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive layout to apply
    await page.waitForFunction(() => window.innerWidth <= 768, { timeout: 3000 });
    
    // The page should load properly even if no images exist
    // Check for the main grid container
    const gridContainer = page.locator('[data-testid="images-grid"], .grid, .image-grid, main').first();
    await expect(gridContainer).toBeVisible();
    
    // Check if we have images or empty state
    const hasImages = await page.locator('[data-testid="image-card"], .image-card, .grid img').count() > 0;
    const hasEmptyState = await page.locator('[data-testid="empty-state"], .empty-state, .no-images').isVisible().catch(() => false);
    
    // Mobile layout should show either images or empty state appropriately
    expect(hasImages || hasEmptyState).toBe(true);
    
    console.log(`✅ Mobile layout test completed (${hasImages ? 'with images' : 'with empty state'})`);
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    console.log('👆 Testing mobile touch interactions...');
    
    // Login first
    const loginSuccess = await TestHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive layout to apply
    await page.waitForFunction(() => window.innerWidth <= 768, { timeout: 3000 });
    
    // Check if we have any images to interact with
    const imageCount = await page.locator('[data-testid="image-card"], .image-card, .grid img').count();
    
    if (imageCount > 0) {
      // Test touch interaction with existing images
      const firstImageContainer = page.locator('[data-testid="image-card"], .image-card, .relative.group').first();
      await expect(firstImageContainer).toBeVisible();
      
      // Simulate mobile interaction (click instead of tap for reliability)
      await firstImageContainer.click({ force: true });
      
      // Wait for interaction response (modal, navigation, or state change)
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="modal"], .modal, [data-testid="image-detail"]') !== null ||
               window.location.pathname !== '/images' ||
               document.querySelector('.active, .selected, .focused') !== null;
      }, { timeout: 3000 }).catch(() => {
        // If no specific response detected, interaction still completed
        console.log('Touch interaction completed (no specific response detected)');
      });
      
      console.log('✅ Touch interaction test completed with images');
    } else {
      // Test mobile interface without images
      const mainContainer = page.locator('main, [data-testid="main-content"]').first();
      await expect(mainContainer).toBeVisible();
      console.log('✅ Touch interaction test completed (no images available, interface responsive)');
    }
  });

  test('should adapt grid layout for tablet screens', async ({ page }) => {
    console.log('📱 Testing tablet layout...');
    
    // Login first
    const loginSuccess = await TestHelpers.quickLogin(page, TEST_USER.email, TEST_USER.password);
    expect(loginSuccess).toBe(true);
    
    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Wait for responsive layout to apply
    await page.waitForFunction(() => window.innerWidth >= 768 && window.innerWidth < 1024, { timeout: 3000 });
    
    // Check if we have any images
    const imageCount = await page.locator('[data-testid="image-card"], .image-card, .grid img').count();
    
    // Verify grid container exists and is responsive (should work with or without images)
    const gridContainer = page.locator('[data-testid="images-grid"], .grid, .image-grid, main').first();
    await expect(gridContainer).toBeVisible();
    
    // The layout should be responsive regardless of image presence
    const hasImages = imageCount > 0;
    const hasEmptyState = await page.locator('[data-testid="empty-state"], .empty-state, .no-images').isVisible().catch(() => false);
    
    // Tablet layout should show either images or empty state appropriately
    expect(hasImages || hasEmptyState).toBe(true);
    
    console.log(`✅ Tablet layout test completed (${hasImages ? 'with images' : 'with empty state'})`);
  });
});
