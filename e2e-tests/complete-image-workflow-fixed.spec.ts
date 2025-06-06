import { test, expect } from '@playwright/test';

test.describe('Complete Image Gallery Workflow - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Mock comprehensive image and gallery data
    await page.route('**/api/images**', async route => {
      console.log(`🔄 Mock API called: ${route.request().url()}`);
      console.log(`🔄 Method: ${route.request().method()}`);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'workflow-img-1',
              title: 'Sunset Mountain Vista',
              url: '/test-images/sunset-mountain.jpg',
              description: 'A breathtaking sunset over mountain peaks',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-01T10:00:00Z'),
              updatedAt: new Date('2024-01-01T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'landscape', id: 'tag-2' },
                { name: 'sunset', id: 'tag-3' }
              ]
            },
            {
              id: 'workflow-img-2',
              title: 'Ocean Waves Crashing',
              url: '/test-images/ocean-waves.jpg',
              description: 'Powerful waves crashing against rocky shores',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-02T10:00:00Z'),
              updatedAt: new Date('2024-01-02T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'ocean', id: 'tag-4' },
                { name: 'water', id: 'tag-5' }
              ]
            },
            {
              id: 'workflow-img-3',
              title: 'Urban Night Portrait',
              url: '/test-images/urban-portrait.jpg',
              description: 'City lights creating dramatic portrait lighting',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-03T10:00:00Z'),
              updatedAt: new Date('2024-01-03T10:00:00Z'),
              tags: [
                { name: 'portrait', id: 'tag-6' },
                { name: 'urban', id: 'tag-7' },
                { name: 'night', id: 'tag-8' }
              ]
            },
            {
              id: 'workflow-img-4',
              title: 'Forest Path Adventure',
              url: '/test-images/forest-path.jpg',
              description: 'A mysterious path winding through ancient trees',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-04T10:00:00Z'),
              updatedAt: new Date('2024-01-04T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'forest', id: 'tag-9' },
                { name: 'adventure', id: 'tag-10' }
              ]
            },
            {
              id: 'workflow-img-5',
              title: 'Desert Dune Patterns',
              url: '/test-images/desert-dunes.jpg',
              description: 'Intricate patterns formed by wind in sand dunes',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-05T10:00:00Z'),
              updatedAt: new Date('2024-01-05T10:00:00Z'),
              tags: [
                { name: 'landscape', id: 'tag-2' },
                { name: 'desert', id: 'tag-11' },
                { name: 'patterns', id: 'tag-12' }
              ]
            }
          ],
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 5,
            perPage: 20,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null
          }
        })
      });
    });

    // Mock gallery data
    await page.route('**/api/galleries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'workflow-gallery-1',
            title: 'Nature Collection',
            description: 'Curated collection of nature photography',
            imageCount: 3,
            coverImageId: 'workflow-img-1'
          },
          {
            id: 'workflow-gallery-2',
            title: 'Portrait Gallery',
            description: 'Professional portrait photography',
            imageCount: 1,
            coverImageId: 'workflow-img-3'
          }
        ])
      });
    });

    // Mock individual gallery data
    await page.route('**/api/galleries/workflow-gallery-1**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'workflow-gallery-1',
          title: 'Nature Collection',
          description: 'Curated collection of nature photography',
          images: [
            {
              id: 'workflow-img-1',
              title: 'Sunset Mountain Vista',
              url: '/test-images/sunset-mountain.jpg',
              description: 'A breathtaking sunset over mountain peaks',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-01T10:00:00Z'),
              updatedAt: new Date('2024-01-01T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'landscape', id: 'tag-2' },
                { name: 'sunset', id: 'tag-3' }
              ]
            },
            {
              id: 'workflow-img-2',
              title: 'Ocean Waves Crashing',
              url: '/test-images/ocean-waves.jpg',
              description: 'Powerful waves crashing against rocky shores',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-02T10:00:00Z'),
              updatedAt: new Date('2024-01-02T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'ocean', id: 'tag-4' },
                { name: 'water', id: 'tag-5' }
              ]
            },
            {
              id: 'workflow-img-4',
              title: 'Forest Path Adventure',
              url: '/test-images/forest-path.jpg',
              description: 'A mysterious path winding through ancient trees',
              userId: 'e2e-single-user',
              createdAt: new Date('2024-01-04T10:00:00Z'),
              updatedAt: new Date('2024-01-04T10:00:00Z'),
              tags: [
                { name: 'nature', id: 'tag-1' },
                { name: 'forest', id: 'tag-9' },
                { name: 'adventure', id: 'tag-10' }
              ]
            }
          ]
        })
      });
    });

    // Mock tags API
    await page.route('**/api/tags**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'tag-1', name: 'nature' },
          { id: 'tag-2', name: 'landscape' },
          { id: 'tag-3', name: 'sunset' },
          { id: 'tag-4', name: 'ocean' },
          { id: 'tag-5', name: 'water' },
          { id: 'tag-6', name: 'portrait' },
          { id: 'tag-7', name: 'urban' },
          { id: 'tag-8', name: 'night' },
          { id: 'tag-9', name: 'forest' },
          { id: 'tag-10', name: 'adventure' },
          { id: 'tag-11', name: 'desert' },
          { id: 'tag-12', name: 'patterns' }
        ])
      });
    });
  });

  test('should complete full image browsing workflow from images page', async ({ page }) => {
    // Step 1: Navigate to images page and verify layout
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    await expect(page.getByTestId('images-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Images' })).toBeVisible();
    
    // Debug: Check what's currently on the page
    console.log('=== PAGE DEBUG ===');
    const isLoading = await page.locator('.loading, [data-testid="loading"]').count();
    console.log(`Loading elements: ${isLoading}`);
    
    const hasError = await page.locator('[data-testid="error"], .error').count();
    console.log(`Error elements: ${hasError}`);
    
    const hasEmptyState = await page.locator('[data-testid="empty-state"]').count();
    console.log(`Empty state elements: ${hasEmptyState}`);
    
    const hasImageGrid = await page.locator('[data-testid="image-grid"]').count();
    console.log(`Image grid elements: ${hasImageGrid}`);
    
    const allImages = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`Gallery image elements: ${allImages}`);
    
    // Wait for API call to complete
    await page.waitForResponse(response => response.url().includes('/api/images'), { timeout: 5000 });

    // Step 2: Wait for loading to complete and verify all images are displayed
    // Wait for the loading state to finish (if any)
    if (isLoading > 0) {
      await expect(page.locator('.loading, [data-testid="loading"]')).toHaveCount(0, { timeout: 3000 });
    }
    
    // Wait for images to appear
    const images = page.locator('[data-testid="gallery-image"]');
    await expect(images).toHaveCount(5, { timeout: 3000 });
    
    // Step 3: Test search functionality
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('sunset');
    
    // Wait for search debounce and URL update with smart waiting
    await page.waitForFunction(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('searchQuery') === 'sunset';
    }, { timeout: 3000 }).catch(async () => {
      // Fallback for slower systems
      await page.waitForTimeout(300);
    });
    
    // Should update URL with search parameter
    await expect(page).toHaveURL(/searchQuery=sunset/);
    
    // Step 4: Test tag filtering
    await searchInput.clear();
    
    // Wait for search parameter to be cleared
    await page.waitForFunction(() => {
      const url = new URL(window.location.href);
      return !url.searchParams.has('searchQuery') || url.searchParams.get('searchQuery') === '';
    }, { timeout: 3000 }).catch(async () => {
      await page.waitForTimeout(300);
    });
    
    const tagInput = page.getByTestId('tag-input');
    await tagInput.fill('nature');
    
    // Wait for tag parameter to be added to URL
    await page.waitForFunction(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('tag') === 'nature';
    }, { timeout: 3000 }).catch(async () => {
      await page.waitForTimeout(300);
    });
    
    await expect(page).toHaveURL(/tag=nature/);
    
    // Step 5: Clear filters and test image viewer
    await tagInput.clear();
    
    // Wait for tag parameter to be cleared
    await page.waitForFunction(() => {
      const url = new URL(window.location.href);
      return !url.searchParams.has('tag') || url.searchParams.get('tag') === '';
    }, { timeout: 3000 }).catch(async () => {
      await page.waitForTimeout(300);
    });
    
    // Step 6: Open image viewer and test navigation
    const firstImage = images.first();
    await firstImage.click();
    
    const imageViewer = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(imageViewer).toBeVisible();
    await expect(page.locator('#image-viewer-title')).toContainText('Sunset Mountain Vista');
    
    // Step 7: Test image viewer navigation
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#image-viewer-title')).toContainText('Ocean Waves Crashing');
    
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#image-viewer-title')).toContainText('Urban Night Portrait');
    
    // Step 8: Test zoom functionality
    const zoomInButton = page.getByRole('button', { name: /zoom in/i });
    await zoomInButton.click();
    
    const zoomOutButton = page.getByRole('button', { name: /zoom out/i });
    await zoomOutButton.click();
    
    // Step 9: Close image viewer
    await page.keyboard.press('Escape');
    await expect(imageViewer).not.toBeVisible();
    
    // Step 10: Test individual image navigation
    await images.nth(2).click(); // Click on third image
    await expect(imageViewer).toBeVisible();
    await expect(page.locator('#image-viewer-title')).toContainText('Urban Night Portrait');
    
    // Step 11: Test fullscreen mode
    const fullscreenButton = page.getByRole('button', { name: /fullscreen/i });
    await fullscreenButton.click();
    // Note: Actual fullscreen testing is complex in E2E, we just verify the button works
    
    await page.keyboard.press('Escape');
    await expect(imageViewer).not.toBeVisible();
    
    console.log('✅ Complete image browsing workflow completed successfully');
  });

  test('should handle gallery integration from images page', async ({ page }) => {
    // Step 1: Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for images to load
    const images = page.locator('[data-testid="gallery-image"]');
    await expect(images).toHaveCount(5, { timeout: 3000 });
    
    // Step 2: Navigate to galleries page
    await page.goto('/galleries');
    await page.waitForLoadState('load');
    
    // Wait for galleries to load
    const galleries = page.locator('[data-testid="gallery-card"]');
    await expect(galleries).toHaveCount(2, { timeout: 3000 });
    
    // Step 3: Open first gallery
    await galleries.first().click();
    await page.waitForLoadState('load');
    
    // Should show gallery images
    const galleryImages = page.locator('[data-testid="gallery-image"]');
    await expect(galleryImages).toHaveCount(3, { timeout: 3000 });
    
    // Step 4: Test image viewer from gallery
    await galleryImages.first().click();
    
    const imageViewer = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(imageViewer).toBeVisible();
    await expect(page.locator('#image-viewer-title')).toContainText('Sunset Mountain Vista');
    
    // Step 5: Navigate between gallery images
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#image-viewer-title')).toContainText('Ocean Waves Crashing');
    
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#image-viewer-title')).toContainText('Forest Path Adventure');
    
    // Should wrap around to first image
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#image-viewer-title')).toContainText('Sunset Mountain Vista');
    
    await page.keyboard.press('Escape');
    await expect(imageViewer).not.toBeVisible();
    
    console.log('✅ Gallery integration workflow completed successfully');
  });

  test('should handle error states and edge cases', async ({ page }) => {
    // Step 1: Test with no mock data (should show empty state)
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: {
            currentPage: 1,
            lastPage: 1,
            total: 0,
            perPage: 20,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null
          }
        })
      });
    });
    
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Should show empty state
    await expect(page.getByTestId('empty-state')).toBeVisible({ timeout: 3000 });
    
    // Step 2: Test API error handling
    await page.route('**/api/images**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.reload();
    await page.waitForLoadState('load');
    
    // Should show error state
    await expect(page.locator('[data-testid="error"], .error')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Error handling workflow completed successfully');
  });
});
