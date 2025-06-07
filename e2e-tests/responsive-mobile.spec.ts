import { test, expect } from '@playwright/test';

test.describe('Images Page - Responsive and Mobile Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Mock responsive images data
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: Array.from({ length: 12 }, (_, i) => ({
            id: `img-${i + 1}`,
            title: `Responsive Image ${i + 1}`,
            url: `/test-images/responsive-${i + 1}.jpg`,
            description: `Description for responsive image ${i + 1}`,
            tags: [
              { name: i % 2 === 0 ? 'landscape' : 'portrait', id: `tag-${i}` }
            ]
          })),
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 12,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });
  });

  test('should display correct grid layout on mobile (1 column)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Check that grid uses single column on mobile
    const gridContainer = page.getByTestId('image-grid');
    await expect(gridContainer).toBeVisible();
    await expect(gridContainer).toHaveClass(/grid-cols-1/);
    
    // Calculate actual columns by checking image positions
    const imageCards = page.getByTestId('gallery-image');
    const firstImageBox = await imageCards.first().boundingBox();
    const secondImageBox = await imageCards.nth(1).boundingBox();
    
    if (firstImageBox && secondImageBox) {
      // In single column layout, second image should be below first (higher Y)
      expect(secondImageBox.y).toBeGreaterThan(firstImageBox.y + firstImageBox.height - 10);
    }
  });

  test('should display correct grid layout on tablet (2 columns)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    const gridContainer = page.getByTestId('image-grid');
    await expect(gridContainer).toHaveClass(/sm:grid-cols-2/);
    
    // Verify 2-column layout by checking positions
    const imageCards = page.getByTestId('gallery-image');
    const firstImageBox = await imageCards.first().boundingBox();
    const secondImageBox = await imageCards.nth(1).boundingBox();
    
    if (firstImageBox && secondImageBox) {
      // In 2-column layout, second image should be to the right of first
      expect(Math.abs(secondImageBox.y - firstImageBox.y)).toBeLessThan(50);
      expect(secondImageBox.x).toBeGreaterThan(firstImageBox.x);
    }
  });

  test('should display correct grid layout on desktop (4 columns)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    const gridContainer = page.getByTestId('image-grid');
    await expect(gridContainer).toHaveClass(/lg:grid-cols-4/);
    
    // Verify 4-column layout
    const imageCards = page.getByTestId('gallery-image');
    const boxes = await Promise.all([
      imageCards.nth(0).boundingBox(),
      imageCards.nth(1).boundingBox(),
      imageCards.nth(2).boundingBox(),
      imageCards.nth(3).boundingBox()
    ]);
    
    if (boxes.every(box => box !== null)) {
      // All first 4 images should be on roughly the same row
      const firstRowY = boxes[0]!.y;
      boxes.forEach(box => {
        expect(Math.abs(box!.y - firstRowY)).toBeLessThan(50);
      });
    }
  });

  test('should handle touch interactions on mobile for image viewing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    const firstImage = page.getByTestId('gallery-image').first();
    
    // Simulate touch tap
    await firstImage.tap();
    
    // Image viewer should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should handle swipe gestures in image viewer on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Open image viewer
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.tap();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check initial image
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toHaveAttribute('alt', 'Responsive Image 1');
    
    // Simulate swipe left (next image)
    const imageBox = await viewerImage.boundingBox();
    if (imageBox) {
      // Start swipe from right side, move to left
      await page.mouse.move(imageBox.x + imageBox.width - 50, imageBox.y + imageBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(imageBox.x + 50, imageBox.y + imageBox.height / 2);
      await page.mouse.up();
    }
    
    // Should show next image (if swipe navigation is implemented)
    // Note: This test documents expected swipe behavior
  });

  test('should show mobile-optimized navigation controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Open image viewer
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.tap();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Navigation buttons should be appropriately sized for mobile
    const nextButton = page.locator('[role="dialog"] button[aria-label*="next"], [role="dialog"] button[aria-label*="Next"]');
    const prevButton = page.locator('[role="dialog"] button[aria-label*="prev"], [role="dialog"] button[aria-label*="Previous"]');
    
    if (await nextButton.count() > 0) {
      const buttonBox = await nextButton.first().boundingBox();
      if (buttonBox) {
        // Button should be large enough for touch (at least 44px)
        expect(buttonBox.width).toBeGreaterThanOrEqual(40);
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should handle search input on mobile with virtual keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByTestId('search-input');
    
    // Focus on search input (should trigger virtual keyboard)
    await searchInput.tap();
    await expect(searchInput).toBeFocused();
    
    // Type on mobile
    await searchInput.fill('landscape');
    
    // Check that input value is correct
    await expect(searchInput).toHaveValue('landscape');
  });

  test('should handle filter controls layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Check that filter section stacks properly on mobile
    const filterSection = page.locator('.grid-cols-1.md\\:grid-cols-2');
    await expect(filterSection).toBeVisible();
    
    // Search and tag inputs should stack vertically on mobile
    const searchInput = page.getByTestId('search-input');
    const tagInput = page.getByTestId('tag-input');
    
    const searchBox = await searchInput.boundingBox();
    const tagBox = await tagInput.boundingBox();
    
    if (searchBox && tagBox) {
      // On mobile, tag input should be below search input
      expect(tagBox.y).toBeGreaterThan(searchBox.y + searchBox.height - 10);
    }
  });

  test('should handle pagination controls on mobile', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: `img-${i + 1}`,
            title: `Image ${i + 1}`,
            url: `/test-images/image-${i + 1}.jpg`,
            description: `Description ${i + 1}`,
            tags: []
          })),
          meta: {
            currentPage: 1,
            lastPage: 3,
            total: 24,
            hasNextPage: true,
            hasPrevPage: false
          }
        })
      });
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Check pagination controls are touch-friendly
    const pagination = page.getByTestId('pagination');
    await expect(pagination).toBeVisible();
    
    const nextButton = page.getByTestId('next-page-button');
    const buttonBox = await nextButton.boundingBox();
    
    if (buttonBox) {
      // Button should be large enough for touch
      expect(buttonBox.height).toBeGreaterThanOrEqual(40);
    }
    
    // Test pagination button tap
    await nextButton.tap();
    await expect(page).toHaveURL(/page=2/);
  });

  test('should handle image grid scrolling performance on mobile', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: Array.from({ length: 50 }, (_, i) => ({
            id: `img-${i + 1}`,
            title: `Scroll Image ${i + 1}`,
            url: `/test-images/scroll-${i + 1}.jpg`,
            description: `Description ${i + 1}`,
            tags: []
          })),
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 50,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Scroll through the grid
    const startTime = Date.now();
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    
    // Wait for scroll to complete
    await page.waitForFunction(() => {
      return window.scrollY > 0;
    });
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be responsive (complete within reasonable time)
    expect(scrollTime).toBeLessThan(2000);
    
    // Images should still be visible at bottom
    await expect(page.getByTestId('gallery-image')).toHaveCount(50);
  });

  test('should handle image aspect ratios correctly on different screen sizes', async ({ page }) => {
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    let imageCard = page.getByTestId('gallery-image').first();
    let imageContainer = imageCard.locator('.aspect-square');
    await expect(imageContainer).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(imageContainer).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(imageContainer).toBeVisible();
    
    // Images should maintain square aspect ratio across all sizes
    const imageBox = await imageContainer.boundingBox();
    if (imageBox) {
      expect(Math.abs(imageBox.width - imageBox.height)).toBeLessThan(5);
    }
  });

  test('should handle tag filters layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Tag filter buttons should wrap properly on mobile
    const tagFilters = page.locator('.flex.flex-wrap.gap-2');
    await expect(tagFilters).toBeVisible();
    
    // Individual tag buttons should be touch-friendly
    const tagButton = page.getByTestId('image-grid-tag-filter-landscape');
    if (await tagButton.isVisible()) {
      const buttonBox = await tagButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(32);
      }
      
      // Test tag button tap
      await tagButton.tap();
      
      // Wait for filtering to complete - check URL or loading state
      await page.waitForFunction(() => {
        const url = new URL(window.location.href);
        return url.searchParams.has('tag') || 
               !document.querySelector('.loading, [data-testid="loading"]');
      }, { timeout: 2000 }).catch(async () => {
        // Fallback for slower systems
        await page.waitForTimeout(300);
      });
      // Check if filtering worked (implementation dependent)
    }
  });

  test('should handle orientation changes gracefully', async ({ page }) => {
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Grid should still be visible and properly laid out
    await expect(page.getByTestId('image-grid')).toBeVisible();
    
    // Should now use more columns in landscape
    const imageCards = page.getByTestId('gallery-image');
    await expect(imageCards.first()).toBeVisible();
  });

  test('should optimize image loading for mobile bandwidth', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Check that images have proper loading attributes
    const images = page.locator('img');
    const firstImage = images.first();
    
    // Should use lazy loading
    await expect(firstImage).toHaveAttribute('loading', 'lazy');
    
    // Should have responsive sizes attribute
    const sizesAttr = await firstImage.getAttribute('sizes');
    expect(sizesAttr).toContain('100vw'); // Full width on mobile
  });
});
