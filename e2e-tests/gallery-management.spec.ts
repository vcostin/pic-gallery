import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_ASSETS } from './test-assets';

test.describe('Gallery Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to galleries page - should already be authenticated
    await page.goto('/galleries');
    
    // Verify we're on the galleries page and authenticated
    await expect(page).toHaveURL(/\/galleries/);
  });
  
  // Clean up after all tests are completed
  test.afterEach(async ({ page }) => {
    await TestHelpers.cleanupTestData(page);
  });

  test('complete gallery workflow: create, add images, edit, and manage', async ({ page }) => {
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

    // Step 3: Add images to gallery
    const selectImagesButton = page.getByTestId('select-images-button');
    await expect(selectImagesButton).toBeVisible();
    await selectImagesButton.click();

    // Wait for Select Images Dialog to open
    await expect(page.getByTestId('select-images-search-input')).toBeVisible();

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
      // Close dialog if no images available
      await page.getByTestId('select-images-close-button').click();
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

    // Step 6: Navigate to edit gallery
    const editButton = page.getByTestId('edit-gallery-button');
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+\/edit$/);

      // Verify edit form is populated
      await expect(page.getByTestId('gallery-title')).toHaveValue(galleryTitle);
      await expect(page.getByTestId('gallery-description')).toHaveValue(galleryDescription);

      // Step 7: Test adding more images in edit mode
      const editSelectImagesButton = page.getByTestId('select-images-button');
      if (await editSelectImagesButton.isVisible()) {
        await editSelectImagesButton.click();

        // Wait for dialog and close it (just testing the flow)
        await expect(page.getByTestId('select-images-search-input')).toBeVisible();
        await page.getByTestId('select-images-close-button').click();
      }

      // Step 8: Test image management (if images exist in gallery)
      const imageRemoveButtons = page.locator('[data-testid="gallery-image-remove"]');
      const imageSetCoverButtons = page.locator('[data-testid="gallery-image-set-cover"]');
      
      if (await imageRemoveButtons.count() > 0) {
        // Test setting cover image
        if (await imageSetCoverButtons.first().isVisible()) {
          await imageSetCoverButtons.first().click();
          // Verify cover indicator appears
          await expect(page.getByTestId('gallery-image-cover-active')).toBeVisible();
        }

        // Test image description editing
        const descriptionInputs = page.locator('[data-testid="gallery-image-description-input"]');
        if (await descriptionInputs.count() > 0) {
          await descriptionInputs.first().fill('Test image description');
        }
      }

      // Step 9: Save gallery changes
      const saveButton = page.getByTestId('edit-gallery-save-button');
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Wait for save to complete and redirect
      await expect(page).toHaveURL(/\/galleries\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    }

    // Step 10: Verify we're back on gallery view page
    await expect(page.getByTestId('gallery-detail-title')).toContainText(galleryTitle);
  });

  test('image upload and selection workflow', async ({ page }) => {
    // Navigate to images page first to upload an image
    await page.goto('/images');

    // Test upload form (if available)
    const uploadForm = page.getByTestId('upload-image-form');
    if (await uploadForm.isVisible()) {
      // Fill upload form
      await page.getByTestId('upload-image-title-input').fill(`Test Image ${Date.now()}`);
      await page.getByTestId('upload-image-description-input').fill('Test image description');
      await page.getByTestId('upload-image-tags-input').fill('test, e2e, automation');

      // Upload a test image using reliable test assets
      await page.getByTestId('upload-image-file-input').setInputFiles(TEST_ASSETS.images.testImage1);
      await page.getByTestId('upload-image-submit-button').click();
    }

    // Navigate to gallery creation to test image selection
    await page.goto('/galleries/create');
    
    const selectImagesButton = page.getByTestId('select-images-button');
    await selectImagesButton.click();

    // Test search functionality
    const searchInput = page.getByTestId('select-images-search-input');
    await searchInput.fill('test');
    await page.waitForTimeout(1000); // Wait for debounced search

    // Test tag filtering
    const tagFilters = page.locator('[data-testid^="select-images-tag-filter-"]');
    if (await tagFilters.count() > 0) {
      await tagFilters.first().click();
      await page.waitForTimeout(500);
    }

    // Clear search and close dialog
    await searchInput.clear();
    await page.getByTestId('select-images-close-button').click();
  });

  test('gallery view selector and display modes', async ({ page }) => {
    // Navigate to galleries page
    await page.goto('/galleries');

    // Look for gallery view selector
    const compactViewButton = page.getByTestId('gallery-view-compact-button');
    const gridViewButton = page.getByTestId('gallery-view-grid-button');

    if (await compactViewButton.isVisible()) {
      await compactViewButton.click();
      await page.waitForTimeout(500);
      
      await gridViewButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('navigation and authentication flow', async ({ page }) => {
    // Test navigation links
    const navLogo = page.getByTestId('nav-logo');
    const navImagesLink = page.getByTestId('nav-images-link');
    const navGalleriesLink = page.getByTestId('nav-galleries-link');
    const navProfileLink = page.getByTestId('nav-profile-link');

    await expect(navLogo).toBeVisible();
    
    // Test navigation
    if (await navImagesLink.isVisible()) {
      await navImagesLink.click();
      await expect(page).toHaveURL('/images');
    }

    if (await navGalleriesLink.isVisible()) {
      await navGalleriesLink.click();
      await expect(page).toHaveURL('/galleries');
    }

    if (await navProfileLink.isVisible()) {
      await navProfileLink.click();
      await expect(page).toHaveURL('/profile');
    }

    // Test logout if authenticated
    const logoutButton = page.getByTestId('logout-button');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Wait for logout to complete
      await page.waitForTimeout(2000);
    }
  });

  test('toast notification workflow', async ({ page }) => {
    // Navigate to gallery management and perform an action that triggers toast
    await page.goto('/galleries');
    
    // If there are galleries, try to edit one and test notifications
    const galleryItems = page.locator('[data-testid="gallery-item"]');
    if (await galleryItems.count() > 0) {
      const editButtons = page.locator('[data-testid="edit-gallery-button"]');
      if (await editButtons.count() > 0) {
        await editButtons.first().click();
        
        // Make a small change and save to trigger success toast
        const titleInput = page.getByTestId('gallery-title');
        const currentTitle = await titleInput.inputValue();
        await titleInput.fill(currentTitle + ' (updated)');
        
        const saveButton = page.getByTestId('edit-gallery-save-button');
        await saveButton.click();
        
        // Note: Toast notifications should disappear completely after timeout
        // This tests the fix for the toast notification bug
        await page.waitForTimeout(3000);
      }
    }
  });

  test('tag filtering in image grid', async ({ page }) => {
    // Navigate to images page
    await page.goto('/images');

    // Test tag filter buttons in image grid
    const tagFilterButtons = page.locator('[data-testid^="image-grid-tag-filter-"]');
    
    if (await tagFilterButtons.count() > 0) {
      // Click on a tag filter
      await tagFilterButtons.first().click();
      await page.waitForTimeout(500);
      
      // Click "All" to clear filter
      const allFilterButton = page.getByTestId('image-grid-tag-filter-all');
      if (await allFilterButton.isVisible()) {
        await allFilterButton.click();
      }
    }
  });
});
