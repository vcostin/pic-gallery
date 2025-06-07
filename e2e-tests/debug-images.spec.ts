import { test, expect } from '@playwright/test';

test.describe('Image API Debug Test', () => {
  test('should debug image loading issue', async ({ page }) => {
    // Mock the images API
    await page.route('**/api/images**', async route => {
      console.log(`🔄 Mock API called: ${route.request().url()}`);
      
      const mockResponse = {
        data: [
          {
            id: 'test-img-1',
            title: 'Test Image 1',
            url: '/test-images/test1.jpg',
            description: 'Test description 1',
            userId: 'e2e-single-user',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            tags: [{ name: 'test', id: 'tag-1' }]
          },
          {
            id: 'test-img-2',
            title: 'Test Image 2',
            url: '/test-images/test2.jpg',
            description: 'Test description 2',
            userId: 'e2e-single-user',
            createdAt: '2024-01-02T10:00:00Z',
            updatedAt: '2024-01-02T10:00:00Z',
            tags: [{ name: 'test', id: 'tag-2' }]
          }
        ],
        meta: {
          currentPage: 1,
          lastPage: 1,
          total: 2,
          perPage: 20,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null
        }
      };
      
      console.log(`✅ Mock returning: ${JSON.stringify(mockResponse, null, 2)}`);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`🚨 Page Error: ${error.message}`);
    });

    // Navigate to images page
    await page.goto('/images');
    await page.waitForLoadState('load');
    
    // Wait for API call
    await page.waitForResponse(response => 
      response.url().includes('/api/images'), 
      { timeout: 5000 }
    );
    
    // Debug page state
    console.log('=== PAGE DEBUG ===');
    
    // Check if page loaded correctly
    const pageTitle = await page.locator('h1, h2, h3').first().textContent();
    console.log(`Page title: ${pageTitle}`);
    
    // Check basic elements
    const hasImagesPage = await page.locator('[data-testid="images-page"]').count();
    console.log(`images-page elements: ${hasImagesPage}`);
    
    const hasImageGrid = await page.locator('[data-testid="image-grid"]').count();
    console.log(`image-grid elements: ${hasImageGrid}`);
    
    const hasGalleryImages = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`gallery-image elements: ${hasGalleryImages}`);
    
    // Check for loading/error states
    const hasLoading = await page.locator('[data-testid="loading"], .loading').count();
    console.log(`loading elements: ${hasLoading}`);
    
    const hasError = await page.locator('[data-testid="error"], .error').count();
    console.log(`error elements: ${hasError}`);
    
    const hasEmptyState = await page.locator('[data-testid="empty-state"]').count();
    console.log(`empty-state elements: ${hasEmptyState}`);
    
    // Wait for content to appear or stabilize instead of arbitrary timeout
    await page.waitForFunction(
      () => {
        const hasImages = document.querySelectorAll('[data-testid="gallery-image"]').length > 0;
        const hasLoading = document.querySelectorAll('[data-testid="loading"], .loading').length > 0;
        const hasError = document.querySelectorAll('[data-testid="error"], .error').length > 0;
        const hasEmptyState = document.querySelectorAll('[data-testid="empty-state"]').length > 0;
        
        // Content is ready when we have images, empty state, error, or no loading indicators
        return hasImages || hasEmptyState || hasError || !hasLoading;
      },
      { timeout: 5000 }
    ).catch(() => {
      // Fallback: minimal wait if function check fails
      return page.waitForTimeout(500);
    });
    
    console.log('=== AFTER WAIT ===');
    const hasGalleryImagesAfter = await page.locator('[data-testid="gallery-image"]').count();
    console.log(`gallery-image elements after wait: ${hasGalleryImagesAfter}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-images-page.png' });
    
    // Basic assertions
    await expect(page.getByTestId('images-page')).toBeVisible({ timeout: 3000 });
    
    // If we find images, great! If not, let's understand why
    if (hasGalleryImagesAfter > 0) {
      console.log('✅ Images found!');
      await expect(page.locator('[data-testid="gallery-image"]')).toHaveCount(2);
    } else {
      console.log('❌ No images found. Debugging...');
      
      // Check the actual DOM content
      const bodyHTML = await page.locator('body').innerHTML();
      console.log('Body HTML (first 1000 chars):', bodyHTML.substring(0, 1000));
    }
  });
});
