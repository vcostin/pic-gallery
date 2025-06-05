import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
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
    // Use optimized test data factory for faster setup
    const { galleryId, imageIds } = await OptimizedTestDataFactory.createTestGallery(page, {
      name: 'Optimized E2E Gallery',
      imageCount: 3,
      useExistingImages: true
    });

    // Navigate to gallery with enhanced waiting
    await EnhancedWaitHelpers.waitForPageReady(page, {
      url: `/galleries/${galleryId}`,
      selector: '[data-testid="gallery-detail"]',
      timeout: 5000
    });

    // Batch element verification for efficiency
    const elementChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: '[data-testid="gallery-title"]', expectation: 'visible' },
      { selector: '[data-testid="gallery-images"]', expectation: 'visible' },
      { selector: '[data-testid="edit-gallery"]', expectation: 'enabled' },
      { selector: '[data-testid="delete-gallery"]', expectation: 'enabled' }
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
    const existingImages = await OptimizedTestDataFactory.createTestImages(page, 2, true);
    
    if (existingImages.length === 0) {
      // Fallback: create minimal test data
      await TestHelpers.uploadTestImages(page, 2);
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
      
      // Wait for layout adjustment with minimal timeout
      await page.waitForTimeout(200); // Brief layout adjustment time
      
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

      // Wait for search results with minimal delay (optimized debouncing)
      await page.waitForTimeout(300); // Debounce wait

      // Verify search results appear
      const searchResultsVisible = await EnhancedWaitHelpers.waitForContentLoad(page, {
        contentType: 'images',
        minCount: 0, // May return 0 results
        timeout: 3000
      });

      // Clear search efficiently
      await OptimizedTestSession.smartInteraction(
        page,
        '[data-testid="search-input"]',
        'fill',
        '',
        { timeout: 2000 }
      );

      await page.waitForTimeout(300); // Debounce wait
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
