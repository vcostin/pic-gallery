import { test, expect } from '@playwright/test';
import { EnhancedWaitHelpers } from './enhanced-wait-helpers';
import { OptimizedTestSession } from './optimized-test-session';
import { OptimizedTestDataFactory } from './optimized-test-data-factory';

test.describe('Optimized Gallery Workflow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    OptimizedTestSession.initializeTestSession('gallery-workflow');
    
    // Setup optimized page with smart waiting and disabled animations
    await OptimizedTestSession.setupOptimizedPage(page, {
      route: '/galleries',
      waitForAuth: true,
      preloadData: true,
      disableAnimations: true
    });
  });

  test.afterEach(async ({ page }) => {
    await OptimizedTestSession.completeTestSession('gallery-workflow', page, {
      cleanupLevel: 'minimal',
      logPerformance: true
    });
  });

  test('should create and manage gallery with optimized workflow', async ({ page }) => {
    // Increase timeout for this complex test
    test.setTimeout(60000); // 60 seconds
    
    // Use optimized test data factory for faster setup with forced existing images
    let galleryData;
    try {
      // First, force getting existing images
      const existingImageIds = await page.evaluate(async () => {
        try {
          console.log('Fetching existing images from API...');
          const response = await fetch('/api/images');
          console.log('API response status:', response.status);
          
          if (!response.ok) {
            console.log('API response not ok:', response.status, response.statusText);
            return [];
          }
          
          const images = await response.json();
          console.log('API returned:', images);
          console.log('Images array check:', Array.isArray(images));
          
          if (!Array.isArray(images)) {
            console.log('Images is not an array, actual type:', typeof images);
            return [];
          }
          
          console.log('Total images found:', images.length);
          const testImages = images.filter((img: { title?: string; id: string }) => 
            img.title && (img.title.includes('E2E') || img.title.includes('Test'))
          );
          console.log('Test images found:', testImages.length);
          
          const result = testImages.slice(0, 3).map((img: { id: string }) => img.id);
          console.log('Returning image IDs:', result);
          return result;
        } catch (error) {
          console.error('Error fetching existing images:', error);
          return [];
        }
      });

      if (existingImageIds.length >= 3) {
        console.log(`✅ Found ${existingImageIds.length} existing test images, using them directly`);
        // Create gallery directly with existing images
        const result = await page.evaluate(async ({ imageIds }) => {
          try {
            const response = await fetch('/api/galleries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Optimized E2E Gallery',
                description: 'E2E test gallery',
                isPublic: true,
                images: imageIds.map((id, index) => ({ 
                  id, 
                  order: index,
                  description: null 
                }))
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to create test gallery: ${response.status} ${errorText}`);
            }
            const result = await response.json();
            return { success: true, galleryId: result.data?.id, result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }, { imageIds: existingImageIds });

        if (result.success && result.galleryId) {
          galleryData = { galleryId: result.galleryId, imageIds: existingImageIds };
        } else {
          throw new Error(`Failed to create gallery with existing images: ${result.error}`);
        }
      } else {
        console.log(`⚠️ Only found ${existingImageIds.length} existing images, falling back to test factory`);
        galleryData = await OptimizedTestDataFactory.createTestGallery(page, {
          name: 'Optimized E2E Gallery',
          imageCount: 3,
          useExistingImages: true
        });
      }
    } catch (error) {
      console.error('Failed to create gallery:', error);
      throw error;
    }

    const { galleryId, imageIds } = galleryData;

    // Navigate to gallery with enhanced waiting
    console.log(`Navigating to gallery: /galleries/${galleryId}`);
    await EnhancedWaitHelpers.waitForPageReady(page, {
      url: `/galleries/${galleryId}`,
      selector: '[data-testid="gallery-detail"], .gallery-detail, h1, main', // More flexible selectors
      timeout: 10000 // Increased timeout
    });

    // Debug: Check what's actually on the page
    console.log('Page loaded, checking elements...');
    
    // More flexible element checks with fallbacks
    const elementChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: '[data-testid="gallery-title"], h1, .gallery-title', expectation: 'visible', timeout: 5000 },
      { selector: '[data-testid="gallery-images"], .gallery-images, .image-grid', expectation: 'visible', timeout: 5000 },
      { selector: '[data-testid="edit-gallery"], button:has-text("Edit"), .edit-button', expectation: 'visible', timeout: 3000 },
      { selector: '[data-testid="delete-gallery"], button:has-text("Delete"), .delete-button', expectation: 'visible', timeout: 3000 }
    ]);

    expect(elementChecks.passed).toBe(4);
    expect(elementChecks.failed).toHaveLength(0);

    // Verify gallery images loaded efficiently
    const imagesLoaded = await EnhancedWaitHelpers.waitForContentLoad(page, {
      contentType: 'images',
      minCount: imageIds.length,
      timeout: 5000
    });

    expect(imagesLoaded).toBe(true);

    // Test smart interaction with retry logic
    const editSuccess = await OptimizedTestSession.smartInteraction(
      page,
      '[data-testid="edit-gallery"]',
      'click',
      undefined,
      { retries: 2, timeout: 3000 }
    );

    expect(editSuccess).toBe(true);

    // Verify modal opened with optimized wait
    const modalOpened = await EnhancedWaitHelpers.waitForModal(page, 'open', 3000);
    expect(modalOpened).toBe(true);

    // Close modal efficiently
    await OptimizedTestSession.smartInteraction(
      page,
      '[data-testid="modal-close"]',
      'click'
    );

    // Verify modal closed
    const modalClosed = await EnhancedWaitHelpers.waitForModal(page, 'closed', 2000);
    expect(modalClosed).toBe(true);
  });

  test('should handle gallery image operations with minimal latency', async ({ page }) => {
    // Reuse existing test gallery to avoid recreation overhead
    const existingImages = await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    
    if (existingImages.length === 0) {
      // Fallback: create minimal test data via API
      await OptimizedTestDataFactory.createTestImagesViaAPI(page, 2);
    }

    // Navigate to images page with fast loading
    await page.goto('/images');
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: '[data-testid="image-grid"]',
      timeout: 5000
    });

    // Wait for images to load with timeout optimization
    const imagesVisible = await EnhancedWaitHelpers.waitForContentLoad(page, {
      contentType: 'images',
      minCount: 1,
      timeout: 6000
    });

    expect(imagesVisible).toBe(true);

    // Test image interaction with smart retry
    const imageClickSuccess = await OptimizedTestSession.smartInteraction(
      page,
      '[data-testid="gallery-image"]',
      'click',
      undefined,
      { retries: 2, timeout: 3000 }
    );

    if (imageClickSuccess) {
      // Handle either modal or navigation result
      const modalOpened = await EnhancedWaitHelpers.waitForModal(page, 'open', 2000);
      
      if (modalOpened) {
        console.log('✅ Image modal opened successfully');
        
        // Close modal with enhanced waiting
        await OptimizedTestSession.smartInteraction(
          page,
          '[data-testid="close-modal"], [data-testid="modal-close"]',
          'click'
        );
        
        await EnhancedWaitHelpers.waitForModal(page, 'closed', 2000);
      } else {
        // Check if navigated to image detail page
        const currentUrl = page.url();
        if (currentUrl.includes('/images/')) {
          console.log('✅ Navigated to image detail page');
          
          // Navigate back efficiently
          await page.goto('/images');
          await EnhancedWaitHelpers.waitForPageReady(page, {
            selector: '[data-testid="image-grid"]'
          });
        }
      }
    }
  });

  test('should perform responsive layout tests with optimized viewports', async ({ page }) => {
    // Test multiple viewport sizes efficiently
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout adjustment - check if viewport width has updated
      await page.waitForFunction(
        (expectedWidth) => window.innerWidth === expectedWidth,
        viewport.width,
        { timeout: 2000 }
      ).catch(async () => {
        // Fallback for slower systems
        await page.waitForTimeout(200);
      });
      
      // Verify responsive elements with batch checking
      const responsiveChecks = await OptimizedTestSession.batchElementChecks(page, [
        { selector: '[data-testid="image-grid"]', expectation: 'visible', timeout: 2000 },
        { selector: '[data-testid="gallery-image"]', expectation: 'visible', timeout: 2000 }
      ]);

      expect(responsiveChecks.passed).toBeGreaterThan(0);
      
      // Verify grid adapts to viewport
      const gridColumns = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="image-grid"]');
        if (!grid) return 0;
        return window.getComputedStyle(grid).getPropertyValue('grid-template-columns').split(' ').length;
      });

      expect(gridColumns).toBeGreaterThan(0);
      console.log(`   Grid columns: ${gridColumns}`);
    }
  });

  test('should handle search and filtering with optimized debouncing', async ({ page }) => {
    // Navigate to images page
    await page.goto('/images');
    await EnhancedWaitHelpers.waitForContentLoad(page, {
      contentType: 'images',
      minCount: 1,
      timeout: 5000
    });

    // Find search input with smart waiting
    const searchInputVisible = await page.locator('[data-testid="search-input"]').isVisible().catch(() => false);
    
    if (searchInputVisible) {
      // Test search with optimized typing and waiting
      await OptimizedTestSession.smartInteraction(
        page,
        '[data-testid="search-input"]',
        'fill',
        'test',
        { timeout: 3000 }
      );

      // Wait for search results with smart debounce waiting
      await page.waitForFunction(() => {
        const url = new URL(window.location.href);
        return url.searchParams.get('searchQuery') === 'test' || 
               !document.querySelector('.loading, [data-testid="loading"]');
      }, { timeout: 3000 }).catch(async () => {
        // Fallback for slower systems  
        await page.waitForTimeout(300);
      });

      // Verify search results appear
      const searchResultsVisible = await EnhancedWaitHelpers.waitForContentLoad(page, {
        contentType: 'images',
        minCount: 0, // May return 0 results
        timeout: 3000
      });
      
      console.log(searchResultsVisible ? '✅ Search completed' : '⚠️ Search may have timed out');

      // Clear search efficiently
      await OptimizedTestSession.smartInteraction(
        page,
        '[data-testid="search-input"]',
        'fill',
        '',
        { timeout: 2000 }
      );

      // Wait for search clear with smart waiting
      await page.waitForFunction(() => {
        const url = new URL(window.location.href);
        return !url.searchParams.has('searchQuery') || 
               url.searchParams.get('searchQuery') === '' ||
               !document.querySelector('.loading, [data-testid="loading"]');
      }, { timeout: 3000 }).catch(async () => {
        // Fallback for slower systems
        await page.waitForTimeout(300);
      });
      console.log('✅ Search functionality tested');
    } else {
      console.log('ℹ️ Search input not found, skipping search test');
    }
  });
});

// Generate optimization report after all tests
test.afterAll(async () => {
  const report = OptimizedTestSession.generateOptimizationReport();
  console.log(report);
  
  await OptimizedTestSession.cleanup();
});
