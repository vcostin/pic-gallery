import { test, expect } from '@playwright/test';
import { EnhancedWaitHelpers } from './enhanced-wait-helpers';
import { OptimizedTestSession } from './optimized-test-session';
import { TestPerformanceMetrics } from './test-performance-metrics';
import path from 'path';

test.describe('Optimized Upload Workflow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    OptimizedTestSession.initializeTestSession('upload-workflow');
    
    // Setup optimized page for upload testing
    await OptimizedTestSession.setupOptimizedPage(page, {
      route: '/images/upload',
      waitForAuth: true,
      disableAnimations: true
    });
  });

  test.afterEach(async ({ page }) => {
    await OptimizedTestSession.completeTestSession('upload-workflow', page, {
      cleanupLevel: 'full', // Clean up uploaded files
      logPerformance: true
    });
  });

  test('should complete single file upload with optimized workflow', async ({ page }) => {
    // Verify upload interface loads quickly
    const interfaceChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: '[data-testid="upload-area"]', expectation: 'visible', timeout: 3000 },
      { selector: 'text=Select Images', expectation: 'visible', timeout: 2000 },
      { selector: 'text=Drag and drop your images here', expectation: 'visible', timeout: 2000 }
    ]);

    expect(interfaceChecks.passed).toBe(3);

    // Optimized file selection
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    await TestPerformanceMetrics.measureElementWait(
      async () => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await OptimizedTestSession.smartInteraction(
          page,
          '[role="button"][aria-label*="Upload area"]',
          'click',
          undefined,
          { timeout: 3000 }
        );
        
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([testImagePath]);
      },
      'File selection'
    );

    // Wait for step 2 to appear with enhanced waiting
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: 'text=Add Details',
      timeout: 4000
    });

    // Batch form filling for efficiency
    const formOperations = [
      {
        operation: () => OptimizedTestSession.smartInteraction(
          page,
          'input[placeholder="Enter image title"]',
          'fill',
          'Optimized E2E Upload Test'
        ),
        label: 'Title input',
        required: true
      },
      {
        operation: () => OptimizedTestSession.smartInteraction(
          page,
          'textarea[placeholder="Describe your image..."]',
          'fill',
          'Test image uploaded via optimized E2E workflow'
        ),
        label: 'Description input',
        required: false
      }
    ];

    const formResults = await EnhancedWaitHelpers.waitForMultiple(
      formOperations,
      5000
    );

    expect(formResults.failed.length).toBe(0);

    // Optimized tag input
    const tagInputSuccess = await OptimizedTestSession.smartInteraction(
      page,
      '[data-testid="tag-input"]',
      'fill',
      'optimized,e2e,performance'
    );

    if (tagInputSuccess) {
      await page.keyboard.press('Enter');
    }

    // Verify upload button state
    await EnhancedWaitHelpers.waitForActionableElement(
      page.getByTestId('upload-submit'),
      'click',
      3000
    );

    // Perform upload with performance measurement
    await TestPerformanceMetrics.measureNavigation(
      page,
      async () => {
        await page.getByTestId('upload-submit').click();
        
        // Wait for upload progress
        await page.waitForSelector('text=/Uploading 1 of 1/', { 
          state: 'visible', 
          timeout: 5000 
        }).catch(() => {
          // Upload might be too fast to catch progress
        });
        
        // Wait for success message with optimized timeout
        await page.waitForSelector('text=/uploaded successfully/', { 
          state: 'visible', 
          timeout: 15000 
        });
      },
      'Upload completion'
    );

    // Verify form reset efficiently
    const resetChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: 'text=Add Details', expectation: 'hidden', timeout: 2000 },
      { selector: 'img[alt="Preview"]', expectation: 'hidden', timeout: 2000 },
      { selector: 'text=Drag and drop your images here', expectation: 'visible', timeout: 2000 }
    ]);

    expect(resetChecks.passed).toBeGreaterThanOrEqual(2);
  });

  test('should handle bulk upload with optimized performance', async ({ page }) => {
    // Prepare multiple test files
    const testFiles = [
      path.resolve('./test-data/images/test-image-1.jpg'),
      path.resolve('./test-data/images/test-image-2.jpg')
    ];

    // Optimized multi-file selection
    await TestPerformanceMetrics.measureElementWait(
      async () => {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('[role="button"][aria-label*="Upload area"]').click();
        
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(testFiles);
      },
      'Bulk file selection'
    );

    // Wait for bulk upload interface
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: 'text=2 files selected',
      timeout: 4000
    });

    // Verify bulk upload features appear
    const bulkFeatureChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: 'text=Apply to All Images', expectation: 'visible', timeout: 3000 },
      { selector: 'input[placeholder="Add common tags..."]', expectation: 'visible', timeout: 3000 },
      { selector: 'text=Image 1', expectation: 'visible', timeout: 3000 },
      { selector: 'text=Image 2', expectation: 'visible', timeout: 3000 }
    ]);

    expect(bulkFeatureChecks.passed).toBeGreaterThanOrEqual(3);

    // Add common tags efficiently
    await OptimizedTestSession.smartInteraction(
      page,
      'input[placeholder="Add common tags..."]',
      'fill',
      'bulk,optimized,test'
    );
    
    await page.keyboard.press('Enter');
    
    // Apply tags to all
    await OptimizedTestSession.smartInteraction(
      page,
      'text=Apply Tags to All',
      'click'
    );

    // Fill individual titles quickly
    const titleInputs = page.locator('input[placeholder="Enter image title"]');
    await titleInputs.nth(0).fill('Optimized Bulk Upload 1');
    await titleInputs.nth(1).fill('Optimized Bulk Upload 2');

    // Verify upload button shows correct count
    await expect(page.getByText('Upload 2 Images')).toBeVisible({ timeout: 3000 });

    // Perform bulk upload with measurement
    await TestPerformanceMetrics.measureNavigation(
      page,
      async () => {
        await page.getByTestId('upload-submit').click();
        
        // Wait for bulk upload completion
        await page.waitForSelector('text=/2 images uploaded successfully/', { 
          state: 'visible', 
          timeout: 25000 
        });
      },
      'Bulk upload completion'
    );

    console.log('✅ Bulk upload completed successfully');
  });

  test('should validate file constraints with minimal overhead', async ({ page }) => {
    // Test file type validation efficiently
    const constraintChecks = await OptimizedTestSession.batchElementChecks(page, [
      { selector: 'text=/Supports JPG, PNG, WebP/', expectation: 'visible', timeout: 2000 },
      { selector: 'text=/Maximum 5 files/', expectation: 'visible', timeout: 2000 },
      { selector: 'text=/4\\.0MB/', expectation: 'visible', timeout: 2000 }
    ]);

    expect(constraintChecks.passed).toBeGreaterThanOrEqual(2);

    // Test file input attributes
    const fileInput = page.getByTestId('file-input');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
    
    console.log('✅ File constraints validated');
  });

  test('should handle upload errors gracefully with optimized recovery', async ({ page }) => {
    // Upload a file to trigger form
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);

    // Wait for form to appear
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: 'text=Add Details',
      timeout: 4000
    });

    // Clear title to trigger validation error
    await OptimizedTestSession.smartInteraction(
      page,
      'input[placeholder="Enter image title"]',
      'fill',
      ''
    );

    // Verify upload button is disabled
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeDisabled({ timeout: 2000 });

    // Fix the error quickly
    await OptimizedTestSession.smartInteraction(
      page,
      'input[placeholder="Enter image title"]',
      'fill',
      'Error Recovery Test'
    );

    // Verify button becomes enabled
    await expect(uploadButton).toBeEnabled({ timeout: 2000 });
    
    console.log('✅ Error handling validated');
  });

  test('should handle form state persistence during navigation', async ({ page }) => {
    // Upload file and fill form
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);

    // Fill form data
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: 'text=Add Details',
      timeout: 4000
    });

    await OptimizedTestSession.smartInteraction(
      page,
      'input[placeholder="Enter image title"]',
      'fill',
      'Persistence Test'
    );

    // Navigate away and back quickly
    await page.goto('/images');
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: '[data-testid="images-page"]',
      timeout: 4000
    });

    await page.goto('/images/upload');
    await EnhancedWaitHelpers.waitForPageReady(page, {
      selector: 'text=Upload Images',
      timeout: 4000
    });

    // Verify form is reset (expected behavior)
    await expect(page.getByText('Drag and drop your images here')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Form state navigation tested');
  });
});

// Performance report after upload tests
test.afterAll(async () => {
  const report = OptimizedTestSession.generateOptimizationReport();
  console.log('\n🎯 Upload Workflow Optimization Results:');
  console.log(report);
});
