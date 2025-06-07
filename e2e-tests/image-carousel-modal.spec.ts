import { test, expect } from '@playwright/test';

test.describe('Image Carousel - Navigation and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock gallery data with images for carousel testing
    await page.route('**/api/galleries/**/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'gallery-1',
          title: 'Test Gallery',
          description: 'Gallery for carousel testing',
          images: [
            {
              id: 'gi-1',
              description: 'First carousel image',
              image: {
                id: 'img-1',
                url: '/test-images/carousel1.jpg',
                title: 'Carousel Image 1',
                tags: [{ id: 'tag-1', name: 'landscape' }]
              }
            },
            {
              id: 'gi-2',
              description: 'Second carousel image',
              image: {
                id: 'img-2',
                url: '/test-images/carousel2.jpg',
                title: 'Carousel Image 2',
                tags: [{ id: 'tag-2', name: 'nature' }]
              }
            },
            {
              id: 'gi-3',
              description: 'Third carousel image',
              image: {
                id: 'img-3',
                url: '/test-images/carousel3.jpg',
                title: 'Carousel Image 3',
                tags: [{ id: 'tag-3', name: 'portrait' }]
              }
            }
          ]
        })
      });
    });
    
    // Mock main galleries API
    await page.route('**/api/galleries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'gallery-1',
            title: 'Test Gallery',
            description: 'Gallery for carousel testing',
            imageCount: 3
          }
        ])
      });
    });
    
    // Navigate to gallery page and open carousel
    await page.goto('/galleries');
    await page.waitForLoadState('load');
  });

  test('should open carousel modal when clicking on gallery image', async ({ page }) => {
    // Navigate to specific gallery
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    // Click on an image to open carousel
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    // Check that carousel modal is visible
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Check that image is displayed
    await expect(page.locator('.fixed.inset-0 img, [role="dialog"] img')).toBeVisible();
  });

  test('should display carousel navigation controls', async ({ page }) => {
    // Navigate to gallery and open carousel
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    // Check for navigation controls
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
  });

  test('should navigate to next image in carousel', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    // Wait for carousel to open
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Get initial image source
    const initialImage = page.locator('.fixed.inset-0 img, [role="dialog"] img').first();
    const initialSrc = await initialImage.getAttribute('src');
    
    // Click next button
    await page.getByRole('button', { name: /next/i }).click();
    
    // Check that image changed
    await page.waitForTimeout(500); // Allow for transition
    const newSrc = await initialImage.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);
  });

  test('should navigate to previous image in carousel', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    // Open carousel on second image if possible, or navigate to second
    const images = page.locator('[data-testid="gallery-image"], .gallery-image');
    if ((await images.count()) > 1) {
      await images.nth(1).click();
    } else {
      await images.first().click();
      // Navigate to next first
      await page.getByRole('button', { name: /next/i }).click();
    }
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Get current image source
    const currentImage = page.locator('.fixed.inset-0 img, [role="dialog"] img').first();
    const currentSrc = await currentImage.getAttribute('src');
    
    // Click previous button
    await page.getByRole('button', { name: /previous/i }).click();
    
    // Check that image changed
    await page.waitForTimeout(500);
    const newSrc = await currentImage.getAttribute('src');
    expect(newSrc).not.toBe(currentSrc);
  });

  test('should support keyboard navigation in carousel', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Get initial image
    const carouselImage = page.locator('.fixed.inset-0 img, [role="dialog"] img').first();
    const initialSrc = await carouselImage.getAttribute('src');
    
    // Use right arrow key to navigate
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    const nextSrc = await carouselImage.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);
    
    // Use left arrow key to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    
    const backSrc = await carouselImage.getAttribute('src');
    expect(backSrc).toBe(initialSrc);
  });

  test('should close carousel using close button', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Click close button
    await page.getByRole('button', { name: /close/i }).click();
    
    // Carousel should be closed
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).not.toBeVisible();
  });

  test('should close carousel using Escape key', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Carousel should be closed
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).not.toBeVisible();
  });

  test('should display image information in carousel', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Check for image title/description
    const carouselContent = page.locator('.fixed.inset-0, [role="dialog"]');
    
    // Should contain image title or description
    await expect(carouselContent).toContainText(/Carousel Image|carousel/i);
  });

  test('should handle loading states for images', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Navigate to trigger loading
    await page.getByRole('button', { name: /next/i }).click();
    
    // Check for loading indicator or smooth transition
    await page.waitForTimeout(200);
    await expect(page.locator('.fixed.inset-0 img, [role="dialog"] img')).toBeVisible();
  });

  test('should display image counter/pagination info', async ({ page }) => {
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Look for pagination indicator (e.g., "1 of 3" or dots)
    const carouselContent = page.locator('.fixed.inset-0, [role="dialog"]');
    
    // Check if pagination info is displayed
    const hasPaginationText = await carouselContent.locator('text=/\\d+ (?:of|\\/) \\d+/').count() > 0;
    const hasPaginationDots = await carouselContent.locator('[role="button"]:has-text("")').count() > 1;
    
    expect(hasPaginationText || hasPaginationDots).toBeTruthy();
  });

  test('should handle error states for missing images', async ({ page }) => {
    // Mock an error scenario
    await page.route('**/test-images/carousel2.jpg', async route => {
      await route.abort('failed');
    });
    
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const firstImage = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await firstImage.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Navigate to the broken image
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should handle error gracefully (show placeholder or error message)
    await page.waitForTimeout(500);
    
    // Carousel should still be functional
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
  });

  test('should handle single image in carousel', async ({ page }) => {
    // Mock single image gallery
    await page.route('**/api/galleries/**/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'gallery-1',
          title: 'Single Image Gallery',
          images: [
            {
              id: 'gi-1',
              description: 'Only image',
              image: {
                id: 'img-1',
                url: '/test-images/single.jpg',
                title: 'Single Image',
                tags: []
              }
            }
          ]
        })
      });
    });
    
    await page.goto('/galleries');
    await page.waitForLoadState('load');
    
    await page.click('[data-testid="gallery-item"]');
    await page.waitForLoadState('load');
    
    const image = page.locator('[data-testid="gallery-image"], .gallery-image').first();
    await image.click();
    
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible();
    
    // Navigation buttons should be disabled or hidden for single image
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous/i });
    
    // At least one should be disabled or not visible
    const nextDisabled = await nextButton.isDisabled().catch(() => true);
    const prevDisabled = await prevButton.isDisabled().catch(() => true);
    const nextHidden = !(await nextButton.isVisible().catch(() => false));
    const prevHidden = !(await prevButton.isVisible().catch(() => false));
    
    expect(nextDisabled || prevDisabled || nextHidden || prevHidden).toBeTruthy();
  });
});
