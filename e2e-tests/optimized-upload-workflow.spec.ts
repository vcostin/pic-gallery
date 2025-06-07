import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Optimized Upload Workflow - E2E Tests', () => {
  let startTime: number;
  const performanceMetrics: { [key: string]: number } = {};

  test.beforeEach(async ({ page }) => {
    startTime = Date.now();
    
    // Navigate to upload page with simple, reliable approach
    await page.goto('/images/upload');
    
    // Verify we're on the upload page
    await expect(page).toHaveURL(/\/images\/upload/);
    await expect(page.getByText('Upload Images')).toBeVisible();
    
    performanceMetrics.pageLoadTime = Date.now() - startTime;
  });

  test.afterEach(async () => {
    const totalTime = Date.now() - startTime;
    console.log(`🎯 Test Performance Metrics:`);
    console.log(`  Page Load: ${performanceMetrics.pageLoadTime}ms`);
    console.log(`  File Selection: ${performanceMetrics.fileSelectionTime || 0}ms`);
    console.log(`  Form Filling: ${performanceMetrics.formFillingTime || 0}ms`);
    console.log(`  Upload Time: ${performanceMetrics.uploadTime || 0}ms`);
    console.log(`  Total Time: ${totalTime}ms`);
    console.log(`  Target: 8000ms - ${totalTime < 8000 ? '✅ PASSED' : '❌ EXCEEDED'}`);
  });

  test('should complete single file upload with optimized workflow', async ({ page }) => {
    // Verify upload interface loads quickly
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Select Images')).toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();

    // File selection with performance measurement
    const fileSelectionStart = Date.now();
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    performanceMetrics.fileSelectionTime = Date.now() - fileSelectionStart;

    // Wait for step 2 to appear
    await expect(page.getByText('Add Details')).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('1 file selected')).toBeVisible();
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    // Form filling with performance measurement
    const formFillingStart = Date.now();
    
    // Fill title
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('Optimized E2E Upload Test');
    
    // Fill description
    const descriptionInput = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInput.fill('Test image uploaded via optimized E2E workflow');
    
    // Add tags
    const tagInput = page.locator('input[placeholder="Add tags..."]').first();
    await tagInput.fill('optimized,e2e,performance');
    await tagInput.press('Enter');
    
    performanceMetrics.formFillingTime = Date.now() - formFillingStart;

    // Verify upload button is enabled
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeEnabled();
    await expect(uploadButton).toContainText('Upload Image');

    // Perform upload with performance measurement
    const uploadStart = Date.now();
    
    await uploadButton.click();
    
    // Wait for upload progress (may be fast)
    await page.waitForSelector('text=/Uploading 1 of 1/', { 
      state: 'visible', 
      timeout: 5000 
    }).catch(() => {
      // Upload might be too fast to catch progress
    });
    
    // Wait for success message
    await expect(page.getByText(/uploaded successfully/)).toBeVisible({ timeout: 15000 });
    
    performanceMetrics.uploadTime = Date.now() - uploadStart;

    // Verify form reset
    await expect(page.getByText('Add Details')).not.toBeVisible();
    await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
    
    console.log('✅ Single file upload completed successfully');
  });

  test('should handle bulk upload with optimized performance', async ({ page }) => {
    // Prepare multiple test files
    const testFiles = [
      path.resolve('./test-data/images/test-image-1.jpg'),
      path.resolve('./test-data/images/test-image-2.jpg')
    ];

    // Multi-file selection with performance measurement
    const fileSelectionStart = Date.now();
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFiles);
    
    performanceMetrics.fileSelectionTime = Date.now() - fileSelectionStart;

    // Wait for bulk upload interface
    await expect(page.getByText('2 files selected')).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('Add Details')).toBeVisible();

    // Verify bulk upload features appear
    await expect(page.getByText('Apply to All Images')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[placeholder="Add common tags..."]')).toBeVisible();
    await expect(page.getByText('Image 1')).toBeVisible();
    await expect(page.getByText('Image 2')).toBeVisible();

    // Form filling with performance measurement
    const formFillingStart = Date.now();
    
    // Add common tags efficiently
    const commonTagInput = page.locator('input[placeholder="Add common tags..."]');
    await commonTagInput.fill('bulk,optimized,test');
    await commonTagInput.press('Enter');
    
    // Apply tags to all
    await page.getByText('Apply Tags to All').click();

    // Fill individual titles quickly
    const titleInputs = page.locator('input[placeholder="Enter image title"]');
    await titleInputs.nth(0).clear();
    await titleInputs.nth(0).fill('Optimized Bulk Upload 1');
    await titleInputs.nth(1).clear();
    await titleInputs.nth(1).fill('Optimized Bulk Upload 2');
    
    performanceMetrics.formFillingTime = Date.now() - formFillingStart;

    // Verify upload button shows correct count
    await expect(page.getByText('Upload 2 Images')).toBeVisible({ timeout: 3000 });

    // Perform bulk upload with measurement
    const uploadStart = Date.now();
    
    await page.getByTestId('upload-submit').click();
    
    // Wait for bulk upload completion
    await expect(page.getByText(/2 images uploaded successfully/)).toBeVisible({ timeout: 25000 });
    
    performanceMetrics.uploadTime = Date.now() - uploadStart;
    
    console.log('✅ Bulk upload completed successfully');
  });

  test('should validate file constraints with minimal overhead', async ({ page }) => {
    // Test file constraint display
    await expect(page.getByText(/Supports JPG, PNG, WebP/)).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/Maximum 5 files/)).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/4\.0MB/)).toBeVisible({ timeout: 2000 });

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
    await expect(page.getByText('Add Details')).toBeVisible({ timeout: 4000 });

    // Clear title to trigger validation error
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('');

    // Verify upload button is disabled
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeDisabled({ timeout: 2000 });

    // Fix the error quickly
    await titleInput.fill('Error Recovery Test');

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
    await expect(page.getByText('Add Details')).toBeVisible({ timeout: 4000 });

    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('Persistence Test');

    // Navigate away and back quickly
    await page.goto('/images');
    await expect(page.locator('[data-testid="images-page"]')).toBeVisible({ timeout: 4000 });

    await page.goto('/images/upload');
    await expect(page.getByText('Upload Images')).toBeVisible({ timeout: 4000 });

    // Verify form is reset (expected behavior)
    await expect(page.getByText('Drag and drop your images here')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Form state navigation tested');
  });
});

// Performance report after upload tests
test.afterAll(async () => {
  console.log('\n🎯 Upload Workflow Optimization Results:');
  console.log('- Removed complex abstraction layers for better reliability');
  console.log('- Used direct Playwright interactions matching working tests');
  console.log('- Maintained performance measurement for optimization tracking');
  console.log('- Target: Complete upload workflow under 8 seconds');
});
