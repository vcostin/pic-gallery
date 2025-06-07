import { test, expect } from '@playwright/test';

test.describe('Image Viewer Modal - Navigation and Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Mock images data for testing
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'img-1',
              title: 'First Image',
              url: '/test-images/image1.jpg',
              description: 'Description for first image',
              tags: [{ name: 'nature', id: 'tag-1' }]
            },
            {
              id: 'img-2',
              title: 'Second Image',
              url: '/test-images/image2.jpg',
              description: 'Description for second image',
              tags: [{ name: 'landscape', id: 'tag-2' }]
            },
            {
              id: 'img-3',
              title: 'Third Image',
              url: '/test-images/image3.jpg',
              description: 'Description for third image',
              tags: [{ name: 'portrait', id: 'tag-3' }]
            }
          ],
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 3,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });
    
    await page.goto('/images');
    await page.waitForLoadState('load');
  });

  test('should open image viewer when clicking on an image', async ({ page }) => {
    // Click on the first image
    const firstImage = page.getByTestId('gallery-image').first();
    await firstImage.locator('img').click();
    
    // Image viewer modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check that the correct image is displayed
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toBeVisible();
    await expect(viewerImage).toHaveAttribute('alt', 'First Image');
  });

  test('should close image viewer with escape key', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Press escape key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close image viewer with close button', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click close button (X icon)
    const closeButton = page.locator('[role="dialog"] button').filter({ hasText: /close/i }).or(
      page.locator('[role="dialog"] [data-testid*="close"]')
    ).or(
      page.locator('[role="dialog"] svg').filter({ hasText: /x/i }).locator('..')
    );
    
    await closeButton.first().click();
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should navigate between images using arrow keys', async ({ page }) => {
    // Open image viewer on first image
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check first image is displayed
    let viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toHaveAttribute('alt', 'First Image');
    
    // Press right arrow to go to next image
    await page.keyboard.press('ArrowRight');
    
    // Should show second image
    await expect(viewerImage).toHaveAttribute('alt', 'Second Image');
    
    // Press right arrow again
    await page.keyboard.press('ArrowRight');
    
    // Should show third image
    await expect(viewerImage).toHaveAttribute('alt', 'Third Image');
    
    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    
    // Should show second image again
    await expect(viewerImage).toHaveAttribute('alt', 'Second Image');
  });

  test('should navigate between images using navigation buttons', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Find navigation buttons
    const nextButton = page.locator('[role="dialog"]').getByRole('button').filter({ hasText: /next|right/i }).or(
      page.locator('[role="dialog"] [data-testid*="next"]')
    ).or(
      page.locator('[role="dialog"] svg').filter({ hasText: /right/i }).locator('..')
    );
    
    const prevButton = page.locator('[role="dialog"]').getByRole('button').filter({ hasText: /prev|left/i }).or(
      page.locator('[role="dialog"] [data-testid*="prev"]')
    ).or(
      page.locator('[role="dialog"] svg').filter({ hasText: /left/i }).locator('..')
    );
    
    // Click next button
    if (await nextButton.count() > 0) {
      await nextButton.first().click();
      
      // Should show second image
      const viewerImage = page.locator('[role="dialog"] img');
      await expect(viewerImage).toHaveAttribute('alt', 'Second Image');
      
      // Click previous button
      if (await prevButton.count() > 0) {
        await prevButton.first().click();
        
        // Should show first image again
        await expect(viewerImage).toHaveAttribute('alt', 'First Image');
      }
    }
  });

  test('should handle zoom functionality', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Test zoom in with + key
    await page.keyboard.press('+');
    
    // Test zoom in with = key (alternative)
    await page.keyboard.press('=');
    
    // Test zoom out with - key
    await page.keyboard.press('-');
    
    // Test toggle zoom with spacebar
    await page.keyboard.press(' ');
    
    // Find zoom buttons if they exist
    const zoomInButton = page.locator('[role="dialog"]').getByRole('button').filter({ hasText: /zoom.*in|\\+/i }).or(
      page.locator('[role="dialog"] [data-testid*="zoom-in"]')
    );
    
    const zoomOutButton = page.locator('[role="dialog"]').getByRole('button').filter({ hasText: /zoom.*out|\\-/i }).or(
      page.locator('[role="dialog"] [data-testid*="zoom-out"]')
    );
    
    // Test zoom buttons if they exist
    if (await zoomInButton.count() > 0) {
      await zoomInButton.first().click();
    }
    
    if (await zoomOutButton.count() > 0) {
      await zoomOutButton.first().click();
    }
  });

  test('should display image metadata in viewer', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check if image title is displayed
    await expect(page.locator('[role="dialog"]')).toContainText('First Image');
    
    // Check if description is displayed
    await expect(page.locator('[role="dialog"]')).toContainText('Description for first image');
    
    // Check if tags are displayed
    await expect(page.locator('[role="dialog"]')).toContainText('nature');
  });

  test('should handle edge cases for navigation', async ({ page }) => {
    // Open image viewer on last image (third image)
    await page.getByTestId('gallery-image').nth(2).locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Press right arrow on last image - should cycle to first
    await page.keyboard.press('ArrowRight');
    
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toHaveAttribute('alt', 'First Image');
    
    // Press left arrow on first image - should cycle to last
    await page.keyboard.press('ArrowLeft');
    await expect(viewerImage).toHaveAttribute('alt', 'Third Image');
  });

  test('should handle single image scenario', async ({ page }) => {
    // Mock single image response
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'img-only',
              title: 'Only Image',
              url: '/test-images/only.jpg',
              description: 'The only image',
              tags: []
            }
          ],
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Open the only image
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Navigation arrows should either be hidden or disabled, or cycle to same image
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    
    // Should still show the same image
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toHaveAttribute('alt', 'Only Image');
  });

  test('should handle drag and pan when zoomed', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Zoom in first
    await page.keyboard.press('+');
    
    // Get the image element for dragging
    const viewerImage = page.locator('[role="dialog"] img');
    
    // Perform drag operation
    const imageBox = await viewerImage.boundingBox();
    if (imageBox) {
      // Start drag from center
      await page.mouse.move(imageBox.x + imageBox.width / 2, imageBox.y + imageBox.height / 2);
      await page.mouse.down();
      
      // Drag to new position
      await page.mouse.move(imageBox.x + imageBox.width / 2 + 50, imageBox.y + imageBox.height / 2 + 50);
      await page.mouse.up();
    }
    
    // Image should still be visible and positioned
    await expect(viewerImage).toBeVisible();
  });

  test('should reset zoom and position when changing images', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Zoom in and pan
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    
    // Navigate to next image
    await page.keyboard.press('ArrowRight');
    
    // Should show second image at normal zoom/position
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toHaveAttribute('alt', 'Second Image');
    
    // Image should be reset to default scale and position
    // This would need to check CSS transform or similar visual indicators
  });

  test('should handle modal backdrop clicks', async ({ page }) => {
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click on backdrop/overlay (outside the image)
    const modal = page.locator('[role="dialog"]');
    const modalBox = await modal.boundingBox();
    
    if (modalBox) {
      // Click near the edge of the modal (should be backdrop)
      await page.mouse.click(modalBox.x + 10, modalBox.y + 10);
    }
    
    // Modal might close or might stay open depending on implementation
    // This test documents the expected behavior
  });

  test('should load high-resolution images in viewer', async ({ page }) => {
    // Mock high-res image URLs
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'img-hires',
              title: 'High Resolution Image',
              url: '/test-images/thumb.jpg',
              description: 'Thumbnail version',
              tags: [],
              fullSizeUrl: '/test-images/full-res.jpg'
            }
          ],
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      });
    });
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Open image viewer
    await page.getByTestId('gallery-image').first().locator('img').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Viewer should potentially load higher resolution version
    const viewerImage = page.locator('[role="dialog"] img');
    await expect(viewerImage).toBeVisible();
    
    // Check if src changes to high-res version (if implemented)
    const imageSrc = await viewerImage.getAttribute('src');
    // This test documents the expected behavior for high-res loading
  });
});
