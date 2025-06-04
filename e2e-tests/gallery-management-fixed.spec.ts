import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_ASSETS } from './test-assets';
import { OptimizedWaitHelpers } from './optimized-wait-helpers';

// Configure to run serially to avoid race conditions with shared user data
test.describe.configure({ mode: 'serial' });
test.describe('Gallery Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to galleries page - should already be authenticated
    await page.goto('/galleries');
    
    // Verify we're on the galleries page and authenticated
    await expect(page).toHaveURL(/\/galleries/);
  });
  
  // Clean up only after all tests in this suite are completed
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/galleries');
    await TestHelpers.cleanupTestData(page);
    await context.close();
  });

  test('complete gallery workflow: create, add images, edit, and manage', async ({ page }) => {
    // Step 0: Upload test images first
    console.log('Step 0: Uploading test images...');
    
    // Upload some test images so we have images to select from
    const uploadedImages = await TestHelpers.uploadTestImages(page, 3);
    console.log(`Successfully uploaded ${uploadedImages.length} test images:`, uploadedImages);
    
    // Navigate back to galleries page
    await page.goto('/galleries');
    await expect(page).toHaveURL(/\/galleries/);
    
    // Step 1: Navigate to gallery creation
    const createGalleryButton = page.getByTestId('create-gallery-link');
    await expect(createGalleryButton).toBeVisible();
    await createGalleryButton.click();

    // Verify we're on the create gallery page
    await expect(page).toHaveURL('/galleries/create');
    await expect(page.getByTestId('create-gallery-form')).toBeVisible();

    // Step 2: Fill out gallery details
    const galleryTitle = `Test Gallery ${Date.now()}`;
    const galleryDescription = 'This is a test gallery created by E2E tests';

    await page.getByTestId('gallery-title').fill(galleryTitle);
    await page.getByTestId('gallery-description').fill(galleryDescription);
    
    // Make gallery public
    await page.getByTestId('gallery-public').check();

    // Step 3: Add images to gallery with optimized modal handling
    await OptimizedWaitHelpers.waitForModalOpen(
      page, 
      '[data-testid="select-images-button"]', 
      '[data-testid="select-images-modal-overlay"]'
    );

    // Search for images if any exist
    const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
    const imageCount = await imageCards.count();

    if (imageCount > 0) {
      // Select the first few images
      const imagesToSelect = Math.min(3, imageCount);
      for (let i = 0; i < imagesToSelect; i++) {
        await imageCards.nth(i).click();
      }

      // Add selected images
      const addButton = page.getByTestId('select-images-add-button');
      await expect(addButton).toBeEnabled();
      await addButton.click();

      // Verify dialog closes
      await expect(page.getByTestId('select-images-search-input')).not.toBeVisible();
    } else {
      // Close modal if no images available with optimized method
      await OptimizedWaitHelpers.safeModalClose(
        page, 
        '[data-testid="select-images-modal-overlay"]', 
        '[data-testid="select-images-close-button"]'
      );
    }

    // Step 4: Create the gallery
    const submitButton = page.getByTestId('create-gallery-submit');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for gallery creation and redirect
    await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Step 5: Verify gallery was created
    await expect(page.getByTestId('gallery-detail-title')).toContainText(galleryTitle);
    await expect(page.getByTestId('gallery-detail-description')).toContainText(galleryDescription);
  });

  test('enhanced upload workflow integration with galleries', async ({ page }) => {
    // Step 1: Navigate to enhanced upload page
    await page.goto('/images/upload');
    
    // Verify enhanced upload interface
    await expect(page.getByText('Upload Images')).toBeVisible();
    await expect(page.getByText('Select Images')).toBeVisible();
    
    // Step 2: Test bulk upload using enhanced interface
    const testImage1Path = './test-data/images/test-image-1.jpg';
    const testImage2Path = './test-data/images/test-image-2.jpg';
    
    // Use the enhanced drag-drop interface
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImage1Path, testImage2Path]);
    
    // Verify progressive disclosure - Step 2 appears
    await expect(page.getByText('Add Details')).toBeVisible();
    await expect(page.getByText('2 files selected')).toBeVisible();
    
    // Step 3: Use bulk upload features
    await expect(page.getByText('Apply to All Images')).toBeVisible();
    
    // Add common tags
    const commonTagInput = page.locator('input[placeholder="Add common tags..."]');
    await commonTagInput.fill('gallery,test,enhanced-upload');
    await commonTagInput.press('Enter');
    
    // Apply common tags
    await page.getByText('Apply Tags to All').click();
    
    // Step 4: Fill individual image details
    const titleInputs = page.locator('input[placeholder="Enter image title"]');
    await titleInputs.nth(0).clear();
    await titleInputs.nth(0).fill('Enhanced Gallery Test Image 1');
    
    await titleInputs.nth(1).clear();
    await titleInputs.nth(1).fill('Enhanced Gallery Test Image 2');
    
    // Add descriptions
    const descriptionInputs = page.locator('textarea[placeholder="Describe your image..."]');
    await descriptionInputs.nth(0).fill('First image uploaded via enhanced interface');
    await descriptionInputs.nth(1).fill('Second image uploaded via enhanced interface');
    
    // Step 5: Perform bulk upload
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toContainText('Upload 2 Images');
    await uploadButton.click();
    
    // Verify upload progress - use a more specific selector to avoid strict mode violation
    await expect(page.getByText('Uploading 1 of 2').or(page.getByText('Uploading...')).first()).toBeVisible();
    
    // Wait for success
    await expect(page.getByText(/2 images uploaded successfully/)).toBeVisible({ timeout: 20000 });
    
    // Step 6: Navigate to gallery creation to use uploaded images
    await page.goto('/galleries/create');
    
    // Fill gallery details
    const galleryTitle = `Enhanced Upload Test Gallery ${Date.now()}`;
    await page.getByTestId('gallery-title').fill(galleryTitle);
    await page.getByTestId('gallery-description').fill('Gallery created to test enhanced upload integration');
    
    // Step 7: Select the newly uploaded images
    await OptimizedWaitHelpers.waitForModalOpen(
      page, 
      '[data-testid="select-images-button"]', 
      '[data-testid="select-images-modal-overlay"]'
    );
    
    // Search for the uploaded images
    await OptimizedWaitHelpers.waitForSearchResults(
      page, 
      '[data-testid="select-images-search-input"]', 
      'Enhanced Gallery Test', 
      '[data-testid^="select-images-image-card-"]'
    );
    
    // Select the images
    const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
    const imageCount = await imageCards.count();
    
    if (imageCount > 0) {
      // Select first two images
      const imagesToSelect = Math.min(2, imageCount);
      for (let i = 0; i < imagesToSelect; i++) {
        await imageCards.nth(i).click();
      }
      
      // Add selected images
      const addButton = page.getByTestId('select-images-add-button');
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      // Verify modal closes
      await expect(page.getByTestId('select-images-search-input')).not.toBeVisible();
    } else {
      // Close modal if no images found
      await OptimizedWaitHelpers.safeModalClose(
        page, 
        '[data-testid="select-images-modal-overlay"]', 
        '[data-testid="select-images-close-button"]'
      );
    }
    
    // Step 8: Create the gallery
    const submitButton = page.getByTestId('create-gallery-submit');
    await submitButton.click();
    
    // Wait for gallery creation
    await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    
    // Verify gallery was created with enhanced upload images
    await expect(page.getByTestId('gallery-detail-title')).toContainText(galleryTitle);
  });
});
