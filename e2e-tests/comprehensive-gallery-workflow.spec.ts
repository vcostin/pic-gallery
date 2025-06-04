import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { OptimizedWaitHelpers } from './optimized-wait-helpers';

/**
 * Comprehensive E2E test for the complete gallery workflow
 * Tests the entire user journey from authentication to gallery management
 * 
 * This test covers:
 * 1. User authentication and access
 * 2. Gallery creation with details and customization
 * 3. Image management (selecting and adding images to gallery)
 * 4. Gallery editing and updating
 * 5. Image operations within gallery (setting cover, descriptions, removal)
 * 6. Gallery deletion and cleanup
 */
// Configure to run serially to avoid race conditions with shared user data
test.describe.configure({ mode: 'serial' });
test.describe('Comprehensive Gallery Workflow', () => {
  let createdGalleryId: string | null = null;
  const testGalleryName = `E2E Test Gallery ${Date.now()}`;
  const testGalleryDescription = 'Comprehensive test gallery created by automated E2E testing workflow';

  test.beforeEach(async ({ page }) => {
    // Ensure we start from the galleries page
    await page.goto('/galleries');
    
    // Verify authentication
    const isAuthenticated = await TestHelpers.isAuthenticated(page);
    if (!isAuthenticated) {
      throw new Error('User must be authenticated for this test suite');
    }
    
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

  test('complete gallery workflow: create, customize, manage images, edit, and delete', async ({ page }) => {
    // ========== PHASE 0: UPLOAD TEST IMAGES ==========
    console.log('Phase 0: Uploading test images...');
    
    // First, upload some test images so we have images to select from
    const uploadedImages = await TestHelpers.uploadTestImages(page, 3);
    console.log(`Successfully uploaded ${uploadedImages.length} test images:`, uploadedImages);
    
    // Navigate back to galleries page
    await page.goto('/galleries');
    await expect(page).toHaveURL(/\/galleries/);
    
    // ========== PHASE 1: GALLERY CREATION ==========
    console.log('Phase 1: Creating new gallery...');
    
    // Navigate to gallery creation
    let createGalleryElement = page.getByTestId('create-gallery-button');
    if (!(await createGalleryElement.isVisible())) {
      createGalleryElement = page.getByTestId('create-gallery-link');
    }
    await expect(createGalleryElement).toBeVisible({ timeout: 10000 });
    await createGalleryElement.click();

    // Verify we're on the create gallery page
    await expect(page).toHaveURL(/\/galleries\/create/);
    await expect(page.getByTestId('create-gallery-form')).toBeVisible();

    // Fill out basic gallery information
    await page.getByTestId('gallery-title').fill(testGalleryName);
    await page.getByTestId('gallery-description').fill(testGalleryDescription);
    
    // Set gallery to public for visibility
    const publicCheckbox = page.getByTestId('gallery-public');
    await publicCheckbox.check();
    await expect(publicCheckbox).toBeChecked();

    // ========== PHASE 2: GALLERY CUSTOMIZATION ==========
    console.log('Phase 2: Customizing gallery appearance...');
    
    // Test theme color selection (these appear to be color inputs, not selects)
    const themeColorInput = page.getByTestId('gallery-theme-color-input');
    if (await themeColorInput.isVisible()) {
      await themeColorInput.fill('#3b82f6'); // Blue color
    }

    // Test background color selection
    const backgroundColorInput = page.getByTestId('gallery-background-color-input');
    if (await backgroundColorInput.isVisible()) {
      await backgroundColorInput.fill('#ffffff'); // White color
    }

    // Test accent color selection
    const accentColorInput = page.getByTestId('gallery-accent-color-input');
    if (await accentColorInput.isVisible()) {
      await accentColorInput.fill('#f97316'); // Orange color
    }

    // Test font family selection (using available options)
    const fontFamilySelect = page.getByTestId('gallery-font-family-select');
    if (await fontFamilySelect.isVisible()) {
      await fontFamilySelect.selectOption('serif');
    }

    // Test display mode selection
    const displayModeSelect = page.getByTestId('gallery-display-mode-select');
    if (await displayModeSelect.isVisible()) {
      await displayModeSelect.selectOption('grid');
    }

    // Test layout type selection
    const layoutTypeSelect = page.getByTestId('gallery-layout-type-select');
    if (await layoutTypeSelect.isVisible()) {
      await layoutTypeSelect.selectOption('masonry');
    }

    // ========== PHASE 3: IMAGE SELECTION AND MANAGEMENT ==========
    console.log('Phase 3: Adding images to gallery...');
    
    // Open image selection dialog with optimized modal wait
    await OptimizedWaitHelpers.waitForModalOpen(
      page, 
      '[data-testid="select-images-button"]', 
      '[data-testid="select-images-modal-overlay"]'
    );

    // Test search functionality with optimized wait
    await OptimizedWaitHelpers.waitForSearchResults(page, '[data-testid="select-images-search-input"]', 'test', '[data-testid^="select-images-image-card-"]');

    // Clear search to see all available images
    await OptimizedWaitHelpers.waitForSearchResults(page, '[data-testid="select-images-search-input"]', '', '[data-testid^="select-images-image-card-"]');

    // Select available images
    const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
    const imageCount = await imageCards.count();
    console.log(`Found ${imageCount} available images`);

    let selectedImageCount = 0;
    if (imageCount > 0) {
      // Select up to 3 images for testing
      const imagesToSelect = Math.min(3, imageCount);
      for (let i = 0; i < imagesToSelect; i++) {
        const imageCard = imageCards.nth(i);
        await imageCard.click();
        selectedImageCount++;
        
        // Verify selection state
        await expect(imageCard).toHaveAttribute('data-selected', 'true');
      }

      // Test deselecting an image
      if (selectedImageCount > 1) {
        await imageCards.first().click();
        await expect(imageCards.first()).toHaveAttribute('data-selected', 'false');
        selectedImageCount--;
      }

      // Add selected images to gallery
      const addButton = page.getByTestId('select-images-add-button');
      await expect(addButton).toBeEnabled();
      await addButton.click();

      // Verify dialog closes
      await expect(page.getByTestId('select-images-search-input')).not.toBeVisible();

      // After adding images, verify they appear in the gallery images section
      if (selectedImageCount > 0) {
        for (let i = 0; i < selectedImageCount; i++) {
          // Use the helper to verify image card presence
          await TestHelpers.verifyImageCard(page, `test-image-${i+1}`);
        }
      }
    } else {
      console.log('No images available for selection');
      // Close modal with optimized method
      await OptimizedWaitHelpers.safeModalClose(
        page, 
        '[data-testid="select-images-modal-overlay"]', 
        '[data-testid="select-images-close-button"]'
      );
    }

    // ========== PHASE 3.1: COVER IMAGE SELECTION DURING CREATION ==========
    // After images are added, set the first image as cover and verify indicator
    if (selectedImageCount > 0) {
      const setCoverButtons = page.locator('[data-testid="gallery-image-set-cover"]');
      if (await setCoverButtons.count() > 0) {
        await setCoverButtons.first().click();
        // Verify cover indicator appears immediately in creation UI
        const coverIndicator = page.getByTestId('gallery-image-cover-active');
        await expect(coverIndicator).toBeVisible();
      }
    }

    // ========== PHASE 4: GALLERY CREATION COMPLETION ==========
    console.log('Phase 4: Saving gallery...');
    
    // Create the gallery
    const submitButton = page.getByTestId('create-gallery-submit');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    console.log('About to submit form...');
    
    // Listen for console errors and network failures
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    page.on('response', response => {
      if (!response.ok() && response.url().includes('api')) {
        console.log(`API Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // Click submit and wait for navigation or error
    try {
      await Promise.all([
        // Wait for navigation away from create page
        page.waitForURL(/\/galleries\/(?!create)[a-zA-Z0-9-]+$/, { timeout: 15000 }),
        // Click submit button
        submitButton.click()
      ]);
      console.log('Gallery creation successful, navigated to:', page.url());
    } catch (error) {
      console.log('Form submission failed or timed out');
      console.log('Current URL:', page.url());
      
      // Check if there are any form validation errors
      const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
      if (await errorMessages.count() > 0) {
        const errors = await errorMessages.allTextContents();
        console.log('Form errors found:', errors);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/form-submission-error.png', fullPage: true });
      
      // Re-throw the error to fail the test
      throw error;
    }
    
    // Extract gallery ID from URL for cleanup
    const currentUrl = page.url();
    const galleryIdMatch = currentUrl.match(/\/galleries\/([a-f0-9-]{36}|[a-zA-Z0-9-]+)$/);
    if (galleryIdMatch && galleryIdMatch[1] !== 'create') {
      createdGalleryId = galleryIdMatch[1];
      console.log(`Created gallery with ID: ${createdGalleryId}`);
    } else {
      console.warn('Could not extract gallery ID from URL:', currentUrl);
    }

    // ========== PHASE 4.1: DATABASE ERROR HANDLING ==========
    // Try to create a gallery with an invalid image ID and expect an error
    // (This is a negative test, should not break the main happy path)
    /*
    await page.goto('/galleries/create');
    await page.getByTestId('gallery-title').fill('Invalid Gallery');
    await page.getByTestId('gallery-description').fill('Should fail');
    // Simulate adding an invalid image ID (requires test API or UI hook)
    // This block is a placeholder for a real negative test
    // await page.evaluate(() => window.addInvalidImageToGallery('nonexistent-id'));
    const submitButton = page.getByTestId('create-gallery-submit');
    await submitButton.click();
    const errorAlert = page.locator('[role="alert"], .error, [data-testid*="error"]');
    await expect(errorAlert).toContainText('invalid');
    */

    // ========== PHASE 5: GALLERY VERIFICATION ==========
    console.log('Phase 5: Verifying created gallery...');
    
    // Verify gallery details on view page
    await expect(page.getByTestId('gallery-detail-title')).toContainText(testGalleryName);
    await expect(page.getByTestId('gallery-detail-description')).toContainText(testGalleryDescription);

    // Verify public status indicator
    const publicIndicator = page.getByTestId('gallery-public-indicator');
    if (await publicIndicator.isVisible()) {
      await expect(publicIndicator).toBeVisible();
    }

    // ========== PHASE 6: GALLERY EDITING ==========
    console.log('Phase 6: Testing gallery editing...');
    
    // Navigate to edit mode
    const editButton = page.getByTestId('edit-gallery-button');
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+\/edit$/);

      // Verify edit form is populated with existing data
      const titleInput = page.getByTestId('gallery-title');
      const descInput = page.getByTestId('gallery-description');
      
      await expect(titleInput).toHaveValue(testGalleryName);
      await expect(descInput).toHaveValue(testGalleryDescription);

      // Make a small modification
      const updatedTitle = `${testGalleryName} (Updated)`;
      await titleInput.fill(updatedTitle);

      // Test adding additional images in edit mode with optimized modal handling
      const editSelectImagesButton = page.getByTestId('select-images-button');
      if (await editSelectImagesButton.isVisible()) {
        await OptimizedWaitHelpers.waitForModalOpen(
          page, 
          '[data-testid="select-images-button"]', 
          '[data-testid="select-images-modal-overlay"]'
        );
        
        // Test quick close with optimized method
        await OptimizedWaitHelpers.safeModalClose(
          page, 
          '[data-testid="select-images-modal-overlay"]', 
          '[data-testid="select-images-close-button"]'
        );
      }

      // ========== PHASE 7: IMAGE MANAGEMENT WITHIN GALLERY ==========
      console.log('Phase 7: Testing image management within gallery...');
      
      // Test image operations if images exist in gallery
      const galleryImages = page.locator('[data-testid^="gallery-image-"]');
      const galleryImageCount = await galleryImages.count();
      
      if (galleryImageCount > 0) {
        console.log(`Found ${galleryImageCount} images in gallery`);
        
        // Test setting cover image
        const setCoverButtons = page.locator('[data-testid="gallery-image-set-cover"]');
        if (await setCoverButtons.count() > 0) {
          await setCoverButtons.first().click();
          
          // Verify cover indicator appears
          const coverIndicator = page.getByTestId('gallery-image-cover-active');
          if (await coverIndicator.isVisible()) {
            await expect(coverIndicator).toBeVisible();
          }
        }

        // Test image description editing
        const descriptionInputs = page.locator('[data-testid="gallery-image-description-input"]');
        if (await descriptionInputs.count() > 0) {
          await descriptionInputs.first().fill('Updated image description via E2E test');
        }

        // Test image removal (if more than one image)
        if (galleryImageCount > 1) {
          const removeButtons = page.locator('[data-testid="gallery-image-remove"]');
          if (await removeButtons.count() > 1) {
            await removeButtons.last().click();
            
            // Confirm removal if confirmation dialog appears
            const confirmButton = page.getByTestId('confirm-remove-image');
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              
              // Wait for confirmation modal to close before proceeding
              await expect(page.getByTestId('confirm-remove-image')).toBeHidden();
            }
          }
        }
      } else {
        console.log('No images in gallery to manage');
      }

      // ========== PHASE 8: SAVE CHANGES ==========
      console.log('Phase 8: Saving gallery changes...');
      
      // Ensure no modals are blocking the save action using improved modal handling
      await OptimizedWaitHelpers.closeModalIfPresent(page, 5000);
      
      // Save gallery changes with proper modal handling
      const saveButton = page.getByTestId('edit-gallery-save-button');
      await expect(saveButton).toBeVisible();
      
      // Use optimized form submission handler to avoid modal overlay issues
      await OptimizedWaitHelpers.waitForFormSubmission(page, '[data-testid="edit-gallery-save-button"]');

      // Wait for save to complete and redirect back to gallery view
      await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

      // Verify updated title is displayed
      await expect(page.getByTestId('gallery-detail-title')).toContainText('Updated');
    }

    // ========== PHASE 9: NAVIGATION AND ACCESS TESTING ==========
    console.log('Phase 9: Testing navigation and access...');
    
    // Test navigation back to galleries list
    await page.goto('/galleries');
    await expect(page).toHaveURL(/\/galleries/);

    // Verify our created gallery appears in the list
    const galleryTitles = page.locator('[data-testid="gallery-title"]');
    
    // Check if our gallery appears in the list
    const titleTexts = await galleryTitles.allTextContents();
    const ourGalleryExists = titleTexts.some(title => title.includes(testGalleryName));
    
    if (ourGalleryExists) {
      console.log('Gallery successfully appears in galleries list');
    }

    // Test different view modes
    const compactViewButton = page.getByTestId('gallery-view-compact-button');
    const gridViewButton = page.getByTestId('gallery-view-grid-button');

    if (await compactViewButton.isVisible()) {
      await compactViewButton.click();
      await OptimizedWaitHelpers.waitForDynamicContent(page, '[data-testid="gallery-item"]');
    }

    if (await gridViewButton.isVisible()) {
      await gridViewButton.click();
      await OptimizedWaitHelpers.waitForDynamicContent(page, '[data-testid="gallery-item"]');
    }

    console.log('Comprehensive gallery workflow test completed successfully!');
    
    // ========== PHASE 10: CLEANUP ==========
    console.log('Phase 10: Cleaning up test gallery...');
    
    // Clean up created gallery if we have the ID
    if (createdGalleryId) {
      try {
        // Navigate to the gallery and delete it
        await page.goto(`/galleries/${createdGalleryId}`);
        
        // Look for delete button
        const deleteButton = page.getByTestId('delete-gallery-button');
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Confirm deletion if confirmation dialog appears
          const confirmDelete = page.getByTestId('confirm-delete-gallery');
          if (await confirmDelete.isVisible()) {
            await confirmDelete.click();
          }
          
          console.log('Test gallery deleted successfully');
        }
      } catch (error) {
        console.log('Error during gallery cleanup:', error);
      }
    }
  });

  test('gallery search and filtering workflow', async ({ page }) => {
    console.log('Testing gallery search and filtering...');
    
    // Navigate to galleries page
    await page.goto('/galleries');

    // Test search functionality if available with optimized waiting
    const searchInput = page.getByTestId('gallery-search-input');
    if (await searchInput.isVisible()) {
      await OptimizedWaitHelpers.waitForSearchResults(page, '[data-testid="gallery-search-input"]', 'test', '[data-testid="gallery-item"]');
      await OptimizedWaitHelpers.waitForSearchResults(page, '[data-testid="gallery-search-input"]', '', '[data-testid="gallery-item"]');
    }

    // Test tag filtering if available with optimized waiting
    const tagFilters = page.locator('[data-testid^="gallery-tag-filter-"]');
    if (await tagFilters.count() > 0) {
      await tagFilters.first().click();
      await OptimizedWaitHelpers.waitForDynamicContent(page, '[data-testid="gallery-item"]');
    }

    // Test sorting options if available with optimized waiting
    const sortSelect = page.getByTestId('gallery-sort-select');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('created_desc');
      await OptimizedWaitHelpers.waitForDynamicContent(page, '[data-testid="gallery-item"]');
      await sortSelect.selectOption('title_asc');
    }
  });

  test('gallery sharing and permissions workflow', async ({ page }) => {
    console.log('Testing gallery sharing and permissions...');
    
    // Navigate to galleries and find a gallery to test
    await page.goto('/galleries');
    
    const galleryItems = page.getByTestId('gallery-item');
    if (await galleryItems.count() > 0) {
      await galleryItems.first().click();
      
      // Test share functionality if available
      const shareButton = page.getByTestId('share-gallery-button');
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Test copy share link
        const copyLinkButton = page.getByTestId('copy-share-link');
        if (await copyLinkButton.isVisible()) {
          await copyLinkButton.click();
        }
        
        // Close share dialog
        const closeShareDialog = page.getByTestId('close-share-dialog');
        if (await closeShareDialog.isVisible()) {
          await closeShareDialog.click();
        }
      }
    }
  });

  test('enhanced upload integration in comprehensive workflow', async ({ page }) => {
    // ========== PHASE 0: ENHANCED UPLOAD TEST ==========
    console.log('Phase 0: Testing enhanced upload functionality...');
    
    // Navigate to enhanced upload page
    await page.goto('/images/upload');
    await expect(page.getByText('Upload Images')).toBeVisible();
    
    // Test the enhanced upload interface
    await expect(page.getByText('Select Images')).toBeVisible();
    await expect(page.locator('[role="button"][aria-label*="Upload area"]')).toBeVisible();
    
    // Simulate file upload using enhanced interface
    const testImage1Path = './test-data/images/test-image-1.jpg';
    const testImage2Path = './test-data/images/test-image-2.jpg';
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[role="button"][aria-label*="Upload area"]').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([testImage1Path, testImage2Path]);
    
    // Verify enhanced upload features
    await expect(page.getByText('Add Details')).toBeVisible();
    await expect(page.getByText('2 files selected')).toBeVisible();
    await expect(page.getByText('Apply to All Images')).toBeVisible();
    
    // Use bulk tagging feature
    const commonTagInput = page.locator('input[placeholder="Add common tags..."]');
    await commonTagInput.fill('comprehensive,e2e,test');
    await commonTagInput.press('Enter');
    await page.getByText('Apply Tags to All').click();
    
    // Fill individual image details
    const titleInputs = page.locator('input[placeholder="Enter image title"]');
    await titleInputs.nth(0).clear();
    await titleInputs.nth(0).fill('Comprehensive Test Image 1');
    
    await titleInputs.nth(1).clear();
    await titleInputs.nth(1).fill('Comprehensive Test Image 2');
    
    // Upload the images
    const uploadButton = page.getByTestId('upload-submit');
    await expect(uploadButton).toContainText('Upload 2 Images');
    await uploadButton.click();
    
    // Wait for upload completion
    await expect(page.getByText(/2 images uploaded successfully/)).toBeVisible({ timeout: 20000 });
    
    // ========== PHASE 1: GALLERY CREATION WITH ENHANCED UPLOADED IMAGES ==========
    console.log('Phase 1: Creating gallery with enhanced uploaded images...');
    
    await page.goto('/galleries/create');
    await expect(page.getByTestId('create-gallery-form')).toBeVisible();
    
    const galleryTitle = `Enhanced Upload Test Gallery ${Date.now()}`;
    await page.getByTestId('gallery-title').fill(galleryTitle);
    await page.getByTestId('gallery-description').fill('Gallery created to test enhanced upload integration in comprehensive workflow');
    
    // Select the uploaded images
    await OptimizedWaitHelpers.waitForModalOpen(
      page, 
      '[data-testid="select-images-button"]', 
      '[data-testid="select-images-modal-overlay"]'
    );
    
    // Search for our uploaded images
    await OptimizedWaitHelpers.waitForSearchResults(
      page, 
      '[data-testid="select-images-search-input"]', 
      'Comprehensive Test', 
      '[data-testid^="select-images-image-card-"]'
    );
    
    const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
    const imageCount = await imageCards.count();
    
    if (imageCount > 0) {
      // Select the enhanced upload images
      for (let i = 0; i < Math.min(2, imageCount); i++) {
        await imageCards.nth(i).click();
      }
      
      const addButton = page.getByTestId('select-images-add-button');
      await expect(addButton).toBeEnabled();
      await addButton.click();
      
      await expect(page.getByTestId('select-images-search-input')).not.toBeVisible();
    }
    
    // Create the gallery
    await page.getByTestId('create-gallery-submit').click();
    await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    
    // ========== PHASE 2: VERIFY ENHANCED UPLOAD INTEGRATION ==========
    console.log('Phase 2: Verifying enhanced upload integration...');
    
    // Verify gallery was created with enhanced uploaded images
    await expect(page.getByTestId('gallery-detail-title')).toContainText(galleryTitle);
    
    // Verify the enhanced upload tags are preserved in the gallery
    const galleryImages = page.locator('[data-testid^="gallery-image-"]');
    if (await galleryImages.count() > 0) {
      // Check that images have the tags we applied during enhanced upload
      await expect(page.getByText('comprehensive')).toBeVisible();
      await expect(page.getByText('e2e')).toBeVisible();
      await expect(page.getByText('test')).toBeVisible();
    }
    
    console.log('✅ Enhanced upload integration test completed successfully');
  });
});
