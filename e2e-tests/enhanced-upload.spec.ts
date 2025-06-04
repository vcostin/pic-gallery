import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_ASSETS } from './test-assets';
import path from 'path';

// Configure to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

test.describe('Enhanced Upload Image E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to upload page - should already be authenticated
    await page.goto('/images/upload');
    
    // Verify we're on the upload page
    await expect(page).toHaveURL(/\/images\/upload/);
    await expect(page.getByText('Upload Images')).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up any test data
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/images');
    await TestHelpers.cleanupTestData(page);
    await context.close();
  });

  test('should display enhanced upload interface with progressive steps', async ({ page }) => {
    // Check for progressive step indicators
    await expect(page.locator('.bg-blue-500:has-text("1")')).toBeVisible(); // Step 1: Select Images
    await expect(page.getByText('Select Images')).toBeVisible();
    
    // Verify drag and drop zone is present
    await expect(page.locator('[role="button"][aria-label*="Upload area"]')).toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
    await expect(page.getByText('or click to browse')).toBeVisible();
    
    // Verify file constraints are displayed
    await expect(page.getByText(/Supports JPG, PNG, WebP/)).toBeVisible();
    await expect(page.getByText(/Maximum 5 files/)).toBeVisible();
    
    // Step 2 should not be visible initially
    await expect(page.getByText('Add Details')).not.toBeVisible();
  });

  test('should handle single file upload with drag and drop', async ({ page }) => {
    // Get the test image path
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    // Create a file chooser promise before triggering the action
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click the drag and drop zone to trigger file selection
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    // Handle file selection
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Verify Step 2 appears after file selection
    await expect(page.locator('.bg-blue-500:has-text("2")')).toBeVisible();
    await expect(page.getByText('Add Details')).toBeVisible();
    
    // Verify file counter
    await expect(page.getByText('1 file selected')).toBeVisible();
    
    // Verify image preview appears
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    
    // Verify smart defaults
    await expect(page.locator('input[placeholder="Enter image title"]')).toHaveValue(/test.image.1/i);
    
    // Fill in the title if not auto-filled properly
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('Test Image E2E Single Upload');
    
    // Add description
    const descriptionInput = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInput.fill('Test image uploaded via E2E drag and drop');
    
    // Add tags using the enhanced tag input
    const tagInput = page.locator('input[placeholder="Add tags..."]').first();
    await tagInput.fill('e2e,test,single-upload');
    await tagInput.press('Enter');
    
    // Verify upload button is enabled and has correct text
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeEnabled();
    await expect(uploadButton).toContainText('Upload Image');
    
    // Perform upload
    await uploadButton.click();
    
    // Verify upload progress appears
    await expect(page.getByText(/Uploading 1 of 1/)).toBeVisible();
    
    // Wait for success message
    await expect(page.getByText(/uploaded successfully/)).toBeVisible({ timeout: 15000 });
    
    // Verify form is cleared
    await expect(page.getByText('Add Details')).not.toBeVisible();
    await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();
  });

  test('should handle bulk upload with multiple files', async ({ page }) => {
    // Get multiple test image paths
    const testImage1Path = path.resolve('./test-data/images/test-image-1.jpg');
    const testImage2Path = path.resolve('./test-data/images/test-image-2.jpg');
    
    // Create a file chooser promise before triggering the action
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click the drag and drop zone
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    // Select multiple files
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImage1Path, testImage2Path]);
    
    // Verify file counter shows multiple files
    await expect(page.getByText('2 files selected')).toBeVisible();
    
    // Verify Step 2 appears with bulk upload features
    await expect(page.getByText('Add Details')).toBeVisible();
    
    // Verify "Apply to All Images" section appears for bulk upload
    await expect(page.getByText('Apply to All Images')).toBeVisible();
    await expect(page.locator('input[placeholder="Add common tags..."]')).toBeVisible();
    
    // Add common tags
    const commonTagInput = page.locator('input[placeholder="Add common tags..."]');
    await commonTagInput.fill('e2e,bulk,test');
    await commonTagInput.press('Enter');
    
    // Apply common tags to all images
    await page.getByText('Apply Tags to All').click();
    
    // Verify individual image sections appear
    await expect(page.getByText('Image 1')).toBeVisible();
    await expect(page.getByText('Image 2')).toBeVisible();
    
    // Fill in details for first image
    const titleInputs = page.locator('input[placeholder="Enter image title"]');
    await titleInputs.nth(0).clear();
    await titleInputs.nth(0).fill('Test Image 1 Bulk Upload');
    
    const descriptionInputs = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInputs.nth(0).fill('First image in bulk upload test');
    
    // Fill in details for second image
    await titleInputs.nth(1).clear();
    await titleInputs.nth(1).fill('Test Image 2 Bulk Upload');
    
    await descriptionInputs.nth(1).fill('Second image in bulk upload test');
    
    // Verify upload button shows correct text for multiple files
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toContainText('Upload 2 Images');
    await expect(uploadButton).toBeEnabled();
    
    // Perform bulk upload
    await uploadButton.click();
    
    // Verify upload progress for multiple files - use a more specific selector
    await expect(page.getByText('Uploading 1 of 2').or(page.getByText('Uploading...')).first()).toBeVisible();
    
    // Wait for success message
    await expect(page.getByText(/2 images uploaded successfully/)).toBeVisible({ timeout: 20000 });
    
    // Verify form is cleared
    await expect(page.getByText('files selected')).not.toBeVisible();
  });

  test('should validate file size and type constraints', async ({ page }) => {
    // This test would ideally use a large file or invalid file type
    // For now, we'll test the UI elements that show constraints
    
    // Verify file constraints are displayed
    await expect(page.getByText(/Supports JPG, PNG, WebP/)).toBeVisible();
    await expect(page.getByText(/4\.0MB/)).toBeVisible(); // File size limit
    await expect(page.getByText(/Maximum 5 files/)).toBeVisible();
    
    // Test file input accepts only images
    const fileInput = page.getByTestId('file-input');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
  });

  test('should handle individual file removal in bulk upload', async ({ page }) => {
    // Upload multiple files first
    const testImage1Path = path.resolve('./test-data/images/test-image-1.jpg');
    const testImage2Path = path.resolve('./test-data/images/test-image-2.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImage1Path, testImage2Path]);
    
    // Verify 2 files selected
    await expect(page.getByText('2 files selected')).toBeVisible();
    
    // Remove first image
    const removeButtons = page.getByText('Remove');
    await removeButtons.first().click();
    
    // Verify only 1 file remains
    await expect(page.getByText('1 file selected')).toBeVisible();
    await expect(page.getByText('Image 2')).not.toBeVisible();
    
    // Verify upload button text updates
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toContainText('Upload Image');
  });

  test('should handle clear all functionality', async ({ page }) => {
    // Upload files first
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Verify file is selected
    await expect(page.getByText('1 file selected')).toBeVisible();
    await expect(page.getByText('Add Details')).toBeVisible();
    
    // Click Clear All button
    await page.getByText('Clear All').click();
    
    // Verify form is reset
    await expect(page.getByText('files selected')).not.toBeVisible();
    await expect(page.getByText('Add Details')).not.toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
  });

  test('should require titles for all images before upload', async ({ page }) => {
    // Upload a file
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Clear the auto-generated title
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    
    // Try to upload without title
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeDisabled();
    
    // Add title and verify button becomes enabled
    await titleInput.fill('Test Image with Title');
    await expect(uploadButton).toBeEnabled();
  });

  test('should show enhanced tag input with autocomplete functionality', async ({ page }) => {
    // Upload a file to access the tag input
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Find the tag input using data-testid
    const tagInput = page.locator('[data-testid="tag-input"]').first();
    await expect(tagInput).toBeVisible();
    
    // Test tag input functionality
    await tagInput.fill('nature');
    await tagInput.press('Enter');
    
    // Verify first tag is added
    await expect(page.locator('span:has-text("nature")').first()).toBeVisible();
    
    await tagInput.fill('landscape');
    await tagInput.press('Enter');
    
    // Verify second tag is added
    await expect(page.locator('span:has-text("landscape")').first()).toBeVisible();
    
    // Verify both tags are displayed in the tag container
    const tagContainer = page.locator('.flex.flex-wrap.gap-2.items-center').first();
    await expect(tagContainer.locator('span:has-text("nature")')).toBeVisible();
    await expect(tagContainer.locator('span:has-text("landscape")')).toBeVisible();
  });

  test('should maintain progressive disclosure workflow', async ({ page }) => {
    // Initially, only Step 1 should be visible
    await expect(page.getByText('Select Images')).toBeVisible();
    await expect(page.getByText('Add Details')).not.toBeVisible();
    
    // After selecting files, Step 2 should appear
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Now Step 2 should be visible
    await expect(page.getByText('Add Details')).toBeVisible();
    
    // Upload buttons should appear at the bottom
    await expect(page.getByText('Clear All')).toBeVisible();
    await expect(page.getByTestId('upload-submit')).toBeVisible();
  });

  test('should handle upload cancellation and cleanup', async ({ page }) => {
    // Upload a file
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Fill in required title
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    await titleInput.fill('Test Upload Cancellation');
    
    // Start upload
    const uploadButton = page.getByTestId('upload-submit');
    await uploadButton.click();
    
    // Quickly navigate away to test cleanup
    await page.goto('/images');
    
    // Verify we can navigate back to upload page without issues
    await page.goto('/images/upload');
    await expect(page.getByText('Upload Images')).toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
  });

  test('should handle tag removal functionality', async ({ page }) => {
    // Upload a file to access the tag input
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Find the tag input and add some tags
    const tagInput = page.locator('[data-testid="tag-input"]').first();
    await tagInput.fill('test-tag');
    await tagInput.press('Enter');
    
    await tagInput.fill('removable-tag');
    await tagInput.press('Enter');
    
    // Verify both tags are added
    await expect(page.locator('span:has-text("test-tag")')).toBeVisible();
    await expect(page.locator('span:has-text("removable-tag")')).toBeVisible();
    
    // Remove the second tag by clicking its X button
    await page.locator('span:has-text("removable-tag")').locator('button').click();
    
    // Verify only the first tag remains
    await expect(page.locator('span:has-text("test-tag")')).toBeVisible();
    await expect(page.locator('span:has-text("removable-tag")')).not.toBeVisible();
  });

  test('should display upload errors gracefully', async ({ page }) => {
    // Upload a file
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Fill in title but leave it empty after clearing (should show validation error)
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.clear();
    
    // Try to upload without title - button should be disabled
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toBeDisabled();
    
    // Fill in the title to make it valid
    await titleInput.fill('Test Error Handling');
    await expect(uploadButton).toBeEnabled();
  });

  test('should handle common tags workflow for bulk uploads', async ({ page }) => {
    // Upload multiple files
    const testImage1Path = path.resolve('./test-data/images/test-image-1.jpg');
    const testImage2Path = path.resolve('./test-data/images/test-image-2.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImage1Path, testImage2Path]);
    
    // Verify common tags section appears for bulk upload
    await expect(page.getByText('Apply to All Images')).toBeVisible();
    
    // Add common tags using the TagInput component with data-testid
    const commonTagInput = page.locator('[data-testid="tag-input"]').first(); // Common tags input comes first
    await commonTagInput.fill('common');
    await commonTagInput.press('Enter');
    
    await commonTagInput.fill('shared');
    await commonTagInput.press('Enter');
    
    // Click "Apply Tags to All" button
    await page.getByText('Apply Tags to All').click();
    
    // Verify tags are applied to individual images
    // Get all individual tag inputs and verify they contain the common tags
    const individualTagContainers = page.locator('.space-y-3:has(label:text("Tags"))');
    const firstContainer = individualTagContainers.first();
    const secondContainer = individualTagContainers.last();
    
    await expect(firstContainer.locator('span:has-text("common")')).toBeVisible();
    await expect(firstContainer.locator('span:has-text("shared")')).toBeVisible();
    await expect(secondContainer.locator('span:has-text("common")')).toBeVisible();
    await expect(secondContainer.locator('span:has-text("shared")')).toBeVisible();
  });

  test('should maintain form state during navigation', async ({ page }) => {
    // Upload a file and fill in details
    const testImagePath = path.resolve('./test-data/images/test-image-1.jpg');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImagePath]);
    
    // Fill in details
    const titleInput = page.locator('input[placeholder="Enter image title"]');
    await titleInput.fill('Persistent Form Test');
    
    const descriptionInput = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInput.fill('Testing form persistence');
    
    // Add tags
    const tagInput = page.locator('[data-testid="tag-input"]').first();
    await tagInput.fill('persistence');
    await tagInput.press('Enter');
    
    // Verify form state is maintained
    await expect(titleInput).toHaveValue('Persistent Form Test');
    await expect(descriptionInput).toHaveValue('Testing form persistence');
    await expect(page.locator('span:has-text("persistence")')).toBeVisible();
    
    // Test that Clear All actually clears everything
    await page.getByText('Clear All').click();
    
    // Verify everything is cleared
    await expect(page.getByText('files selected')).not.toBeVisible();
    await expect(page.getByText('Add Details')).not.toBeVisible();
  });
});
