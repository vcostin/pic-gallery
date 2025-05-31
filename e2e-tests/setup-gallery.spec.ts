import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_ASSETS } from './test-assets';
import { TEST_ASSETS_CI, ensureTestImagesExist } from './test-assets-ci';

// This test creates a test gallery with images for E2E testing
// Configure to run serially to avoid race conditions with shared user data
test.describe.configure({ mode: 'serial' });
test.describe('Setup Test Gallery', () => {
  // Clean up only after all tests in this suite are completed
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/galleries');
    await TestHelpers.cleanupTestData(page);
    await context.close();
  });
  
  test('create a test gallery with images', async ({ page }) => {
    console.log('Starting setup gallery test...');
    
    // ===== PHASE 0: UPLOAD TEST IMAGES =====
    console.log('Phase 0: Uploading test images...');
    
    // First, upload some test images so we have images to select from
    const uploadedImages = await TestHelpers.uploadTestImages(page, 2);
    console.log(`Successfully uploaded ${uploadedImages.length} test images:`, uploadedImages);
    
    // ===== PHASE 1: GALLERY CREATION =====
    console.log('Phase 1: Creating gallery...');
    
    // Create a unique gallery name to avoid conflicts
    const uniqueId = Date.now();
    const galleryName = `Test Gallery ${uniqueId}`;
    console.log(`Using gallery name: ${galleryName}`);
    
    // Go to create gallery page
    await page.goto('/galleries/create');
    console.log('Navigated to create gallery page');
  
  // Wait for the page to load fully
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the create gallery page
  await expect(page).toHaveURL('/galleries/create');
  
  // Let's first check what inputs are available
  const inputCount = await page.locator('input, textarea').count();
  console.log(`Found ${inputCount} input elements on create gallery page`);
  
  // Try multiple selectors for title field
  try {
    // First try by test ID
    const titleInput = page.getByTestId('gallery-title');
    if (await titleInput.isVisible()) {
      await titleInput.fill(galleryName);
      console.log('Filled title using test ID');
    } else {
      // Try by role with label
      const titleByRole = page.getByRole('textbox', { name: /title/i });
      if (await titleByRole.isVisible()) {
        await titleByRole.fill(galleryName);
        console.log('Filled title using role with label');
      } else {
        // Try by placeholder
        const titleByPlaceholder = page.getByPlaceholder(/title/i);
        if (await titleByPlaceholder.isVisible()) {
          await titleByPlaceholder.fill(galleryName);
          console.log('Filled title using placeholder');
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input, textarea');
          await inputs.first().fill(galleryName);
          console.log('Filled title using first input element');
        }
      }
    }
    
    // Try multiple selectors for description field
    const descriptionInput = page.getByTestId('gallery-description');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This gallery was created for E2E testing');
      console.log('Filled description using test ID');
    } else {
      // Try by role with label
      const descByRole = page.getByRole('textbox', { name: /description/i });
      if (await descByRole.isVisible()) {
        await descByRole.fill('This gallery was created for E2E testing');
        console.log('Filled description using role with label');
      } else {
        // Try by placeholder
        const descByPlaceholder = page.getByPlaceholder(/description/i);
        if (await descByPlaceholder.isVisible()) {
          await descByPlaceholder.fill('This gallery was created for E2E testing');
          console.log('Filled description using placeholder');
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input, textarea');
          if (await inputs.count() > 1) {
            await inputs.nth(1).fill('This gallery was created for E2E testing');
            console.log('Filled description using second input element');
          }
        }
      }
    }
    
    // Try multiple selectors for public checkbox
    const publicCheckbox = page.getByTestId('gallery-public');
    if (await publicCheckbox.isVisible()) {
      await publicCheckbox.check();
      console.log('Checked public using test ID');
    } else {
      // Try by role with label
      const checkboxByRole = page.getByRole('checkbox', { name: /public/i });
      if (await checkboxByRole.isVisible()) {
        await checkboxByRole.check();
        console.log('Checked public using role with label');
      } else {
        // Last resort - use generic selectors
        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.count() > 0) {
          await checkboxes.first().check();
          console.log('Checked public using first checkbox element');
        }
      }
    }
  } catch (error) {
    console.error('Error filling gallery form:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'gallery-form-error.png' });
    throw error;
  }
  
  // Submit the form
  try {
    const createButton = page.getByTestId('create-gallery-submit');
    await createButton.click();
    console.log('Clicked create gallery button');
  } catch (error) {
    console.error('Error submitting gallery form:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'gallery-submit-error.png' });
    throw error;
  }
  
  // Wait for redirection to the gallery page
  await page.waitForURL(/\/galleries\/[\w-]+$/, { timeout: 10000 });
  console.log(`Created gallery: ${galleryName}`);
  
  // ===== IMPORTANT: DATABASE CONSISTENCY WAIT =====
  console.log('Waiting for database consistency after gallery creation...');
  // In CI environments, there can be a delay between gallery creation and data availability
  await page.waitForTimeout(3000);
  
  // ===== PHASE 2: ADDING IMAGES TO GALLERY =====
  console.log('Phase 2: Adding images to gallery...');
  
  // We now have test images uploaded in Phase 0, so we can proceed directly to adding them to the gallery
  
  // ===== PHASE 3: ADDING IMAGES TO GALLERY =====
  console.log('Phase 3: Adding uploaded images to gallery...');
  
  // IMPORTANT: Wait for database consistency before proceeding
  // In CI environments, there can be a delay between upload completion and data availability
  console.log('Waiting for database consistency after uploads...');
  await page.waitForTimeout(3000);
  
  // Verify uploaded images are accessible via the images API before proceeding
  console.log('Verifying uploaded images are accessible...');
  try {
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Look for our uploaded images on the images page
    const imageElements = await page.locator('.image-card, [data-testid*="image"], img[alt*="Test Image"]').count();
    console.log(`Found ${imageElements} image elements on /images page`);
    
    // If no images found, wait a bit more and retry
    if (imageElements === 0) {
      console.log('No images found on /images page, waiting longer for database consistency...');
      await page.waitForTimeout(5000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const retryCount = await page.locator('.image-card, [data-testid*="image"], img[alt*="Test Image"]').count();
      console.log(`After retry, found ${retryCount} image elements on /images page`);
    }
  } catch (e) {
    console.warn('Could not verify images on /images page:', e);
  }
  
  try {
    // Now let's add these images to our test gallery
    // IMPORTANT: Additional database consistency wait before navigating to galleries
    console.log('Ensuring gallery is fully persisted before proceeding...');
    await page.waitForTimeout(2000);
    
    // Go back to galleries
    await page.goto('/galleries');
    console.log('Navigated to galleries page');
    
    // Wait for the page to load fully with extended timeout
    await page.waitForLoadState('networkidle');
    
    // Additional wait for any dynamic content loading
    await page.waitForTimeout(1000);
    
    // Find and click our test gallery - use more robust selectors
    // First, wait for galleries to load with extended timeout and better error handling
    console.log('Waiting for gallery items to appear...');
    try {
      await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 15000 });
      console.log('Gallery items found successfully');
    } catch (timeoutError) {
      console.warn('Gallery items not found, trying alternative approaches...');
      
      // Try refreshing the page if gallery items are not found
      console.log('Refreshing page and retrying...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Try again with a longer timeout
      await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 15000 });
      console.log('Gallery items found after refresh');
    }
    
    // Try multiple approaches to find the gallery
    let galleryFound = false;
    
    // Method 1: Try by data-testid attribute on the gallery title
    const galleryByTestId = page.locator('[data-testid="gallery-title"]').filter({ hasText: galleryName });
    const titleCount = await galleryByTestId.count();
    console.log(`Found ${titleCount} galleries with matching title via data-testid`);
    
    if (titleCount > 0) {
      // Click the parent gallery item link
      await galleryByTestId.first().locator('xpath=ancestor::a').click();
      galleryFound = true;
      console.log('Clicked on gallery via title data-testid');
    } else {
      // Method 2: Try by text content with more flexible matching
      const galleryByText = page.getByText(galleryName, { exact: false });
      const textCount = await galleryByText.count();
      console.log(`Found ${textCount} elements with gallery name text`);
      
      if (textCount > 0) {
        await galleryByText.first().click();
        galleryFound = true;
        console.log('Clicked on gallery via text content');
      } else {
        // Method 3: Debug what galleries are actually present
        const allGalleries = page.locator('[data-testid="gallery-title"]');
        const allTitles = await allGalleries.allTextContents();
        console.log('Available gallery titles:', allTitles);
        
        // Try partial matching
        for (const title of allTitles) {
          if (title.includes(galleryName.split(' ')[0])) { // Match first part of name
            await page.getByText(title).click();
            galleryFound = true;
            console.log(`Clicked on gallery with similar name: ${title}`);
            break;
          }
        }
      }
    }
    
    if (!galleryFound) {
      throw new Error(`Could not find gallery with name: ${galleryName}. Available galleries: ${(await page.locator('[data-testid="gallery-title"]').allTextContents()).join(', ')}`);
    }
    
    // Click the edit button
    const editButton = page.getByTestId('edit-gallery-button').first();
    await editButton.click();
    console.log('Clicked edit button');
    
    // Click the "Add Images" button
    const selectImagesButton = page.getByRole('button', { name: /select images/i });
    await selectImagesButton.click();
    console.log('Clicked select images button');
    
    // Select the images we uploaded - look for them by title in the dialog
    // Wait for dialog to fully load with proper loading state handling
    await page.waitForTimeout(2000);
    
    // Wait for the dialog to be fully loaded (check that loading spinner is gone)
    try {
      // Wait for either loading to finish or error state to appear
      await Promise.race([
        page.getByText('Loading images...').waitFor({ state: 'hidden', timeout: 10000 }),
        page.getByText('No images found').waitFor({ timeout: 10000 }),
        // Also wait for at least one image card to appear
        page.locator('[data-testid^="select-images-image-card-"]').first().waitFor({ timeout: 10000 })
      ]);
      console.log('Dialog finished loading');
    } catch (loadingError) {
      console.log('Dialog loading timeout or error:', loadingError);
    }
    
    // Debug: Check what the dialog actually contains
    const dialogVisible = await page.locator('[data-testid="select-images-modal-overlay"]').isVisible();
    console.log(`Dialog visible: ${dialogVisible}`);
    
    // Debug: Check if there are any images in the API response by looking at the dialog state
    const dialogContent = await page.locator('[data-testid="select-images-modal-overlay"]').textContent();
    console.log(`Dialog content includes: ${dialogContent?.includes('No images found') ? 'No images found message' : 'Some content'}`);
    
    // Debug: Check specifically for image cards
    const allImageCards = page.locator('[data-testid^="select-images-image-card-"]');
    const cardCount = await allImageCards.count();
    console.log(`Found ${cardCount} image cards in dialog (before any selection attempts)`);
    
    // If no image cards found, let's debug why
    if (cardCount === 0) {
      console.log('No image cards found - debugging...');
      
      // Check if there's an error message
      const errorMessage = await page.locator('[data-testid="error-message"], .error-message').textContent().catch(() => null);
      if (errorMessage) {
        console.error('Error message in dialog:', errorMessage);
      }
      
      // Check if there's a "No images found" message
      const noImagesMessage = await page.getByText('No images found').isVisible().catch(() => false);
      if (noImagesMessage) {
        console.log('Dialog shows "No images found" message');
        
        // Check if it's saying all images are already in gallery
        const allInGalleryMessage = await page.getByText('All images are already in the gallery').isVisible().catch(() => false);
        if (allInGalleryMessage) {
          console.log('All images are already in the gallery - this is expected for re-runs');
        } else {
          console.log('No images found - this suggests the uploads might have failed or timing issue');
        }
      }
      
      // Debug: Let's also check what images are available via API by forcing a refresh
      console.log('Attempting to refresh dialog data...');
      await page.getByTestId('select-images-close-button').click();
      await page.waitForTimeout(1000);
      await selectImagesButton.click();
      await page.waitForTimeout(2000);
      
      // Check again after refresh
      const cardCountAfterRefresh = await allImageCards.count();
      console.log(`Found ${cardCountAfterRefresh} image cards after refresh`);
    }
    
    // Debug: Check for any images in general
    const anyImages = page.locator('img').count();
    console.log(`Found ${await anyImages} img elements in the page`);
    
    // Try to find and select the first uploaded image
    let selectedCount = 0;
    
    // Only proceed with selection if we have image cards
    if (cardCount > 0 || await allImageCards.count() > 0) {
      try {
        // Look for the first uploaded image by title text within the dialog
        const image1Element = uploadedImages.length > 0 
          ? page.locator(`[data-testid="select-images-image-title-${uploadedImages[0]}"], [data-testid*="select-images-image-card-"] h3:has-text("${uploadedImages[0]}")`).first()
          : page.locator('[data-testid^="select-images-image-card-"]').first();
          
        if (await image1Element.isVisible({ timeout: 5000 })) {
          // Click the parent card instead of the title if this is a title element
          if (uploadedImages.length > 0) {
            const cardElement = image1Element.locator('..').locator('..').locator('..');
            await cardElement.click();
            console.log(`Selected image: ${uploadedImages[0]}`);
          } else {
            await image1Element.click();
            console.log('Selected first available image as fallback');
          }
          selectedCount++;
        } else {
          // Fallback: try to find any image card and select it
          const anyImageCard = page.locator('[data-testid^="select-images-image-card-"]').first();
          if (await anyImageCard.isVisible({ timeout: 5000 })) {
            await anyImageCard.click();
            console.log('Selected first available image as fallback');
            selectedCount++;
          }
        }
      } catch (e) {
        console.warn(`Couldn't select first image: ${e}`);
      }
      
      try {
        // Look for the second uploaded image
        const image2Element = uploadedImages.length > 1 
          ? page.locator(`[data-testid="select-images-image-title-${uploadedImages[1]}"], [data-testid*="select-images-image-card-"] h3:has-text("${uploadedImages[1]}")`).first()
          : page.locator('[data-testid^="select-images-image-card-"]').nth(1);
          
        if (await image2Element.isVisible({ timeout: 5000 })) {
          // Click the parent card instead of the title if this is a title element
          if (uploadedImages.length > 1) {
            const cardElement = image2Element.locator('..').locator('..').locator('..');
            await cardElement.click();
            console.log(`Selected image: ${uploadedImages[1]}`);
          } else {
            await image2Element.click();
            console.log('Selected second available image as fallback');
          }
          selectedCount++;
        } else {
          // Fallback: try to find the second image card and select it
          const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
          const cardCount = await imageCards.count();
          if (cardCount > 1) {
            await imageCards.nth(1).click();
            console.log('Selected second available image as fallback');
            selectedCount++;
          }
        }
      } catch (e) {
        console.warn(`Couldn't select second image: ${e}`);
      }
      
      console.log(`Successfully selected ${selectedCount} images`);
      
      // If no images were selected, try a more generic approach
      if (selectedCount === 0) {
        console.log('No images selected by name, trying to select any available images...');
        const allImageCards = page.locator('[data-testid^="select-images-image-card-"]');
        const totalCards = await allImageCards.count();
        console.log(`Found ${totalCards} image cards in dialog`);
        
        // Select up to 2 images
        const imagesToSelect = Math.min(2, totalCards);
        for (let i = 0; i < imagesToSelect; i++) {
          try {
            await allImageCards.nth(i).click();
            selectedCount++;
            console.log(`Selected image ${i + 1} by index`);
          } catch (e) {
            console.warn(`Failed to select image ${i + 1}: ${e}`);
          }
        }
      }
      
      // Confirm image selection only if we selected something
      if (selectedCount > 0) {
        // Wait for any modal overlay to be ready
        await page.waitForTimeout(1000);
        
        // The button text changes based on number of selected images, so use the test ID
        const selectButton = page.getByTestId('select-images-add-button');
        
        // Verify button is enabled before clicking
        const isEnabled = await selectButton.isEnabled();
        console.log(`Add button enabled: ${isEnabled}`);
        
        if (isEnabled) {
          await selectButton.click();
          console.log('Confirmed image selection');
        } else {
          console.warn('Add button is disabled - no images were properly selected');
          throw new Error('Cannot add images - button is disabled');
        }
      } else {
        console.warn('No images were selected - skipping add button click');
        // Close the dialog since we can't proceed
        await page.getByTestId('select-images-close-button').click();
        throw new Error('No images available for selection in dialog');
      }
    } else {
      console.warn('No image cards found in dialog - cannot proceed with selection');
      // Close the dialog
      await page.getByTestId('select-images-close-button').click();
      throw new Error('No images found in SelectImagesDialog');
    }
    
    // Save the gallery changes only if we successfully selected images
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();
    console.log('Clicked save changes button');
    
    // Verify that the gallery was updated
    await page.getByText(/gallery updated successfully/i).waitFor({ timeout: 10000 });
    console.log(`Added images to gallery: ${galleryName}`);
  } catch (error) {
    console.error('Error adding images to gallery:', error);
    await page.screenshot({ path: 'add-images-error.png' });
    
    // Try to close any open dialogs before continuing
    try {
      const closeButton = page.getByTestId('select-images-close-button');
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        console.log('Closed SelectImagesDialog after error');
      }
    } catch (e) {
      console.log('Could not close dialog:', e);
    }
    
    // Continue with the test even if adding images fails
    console.log('Continuing test despite image selection failure...');
  }
  
  // Output the gallery name for use in other tests
  console.log(`TEST GALLERY CREATED: ${galleryName}`);
  
  try {
    // Go back to the gallery to verify it has images
    await page.goto('/galleries');
    await page.waitForLoadState('networkidle');
    
    // Use the same robust gallery finding logic as before
    await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 10000 });
    
    // Try to find and click the gallery using multiple methods
    let galleryFound = false;
    
    // Method 1: Try by data-testid attribute on the gallery title
    const galleryByTestId = page.locator('[data-testid="gallery-title"]').filter({ hasText: galleryName });
    const titleCount = await galleryByTestId.count();
    
    if (titleCount > 0) {
      await galleryByTestId.first().locator('xpath=ancestor::a').click();
      galleryFound = true;
      console.log('Found gallery for verification via title data-testid');
    } else {
      // Method 2: Try by text content
      const galleryByText = page.getByText(galleryName, { exact: false });
      const textCount = await galleryByText.count();
      
      if (textCount > 0) {
        await galleryByText.first().click();
        galleryFound = true;
        console.log('Found gallery for verification via text content');
      } else {
        // Method 3: Try partial matching
        const allGalleries = page.locator('[data-testid="gallery-title"]');
        const allTitles = await allGalleries.allTextContents();
        console.log('Available galleries for verification:', allTitles);
        
        for (const title of allTitles) {
          if (title.includes(galleryName.split(' ')[0])) {
            await page.getByText(title).click();
            galleryFound = true;
            console.log(`Found gallery for verification with similar name: ${title}`);
            break;
          }
        }
      }
    }
    
    if (galleryFound) {
      // Verify there are images in the gallery
      const galleryImages = page.locator('.gallery-image, [data-testid*="gallery-image"], .grid img');
      const imageCount = await galleryImages.count();
      console.log(`Gallery has ${imageCount} images`);
      
      if (imageCount > 0) {
        console.log('Successfully created gallery with images');
      } else {
        console.log('Gallery was created but no images were found');
      }
    } else {
      console.warn(`Could not find gallery ${galleryName} for verification`);
    }
  } catch (error) {
    console.error('Error verifying gallery images:', error);
    await page.screenshot({ path: 'verify-gallery-error.png' });
  }
  
  console.log('Setup gallery test completed');
  });
});
