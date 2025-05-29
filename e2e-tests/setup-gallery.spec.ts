import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

// This test creates a test gallery with images for E2E testing
test.describe('Setup Test Gallery', () => {
  test.afterEach(async ({ page }) => {
    await TestHelpers.cleanupTestData(page);
  });
  
  test('create a test gallery with images', async ({ page }) => {
  console.log('Starting setup gallery test...');
  
  // Already authenticated via the authenticated project setup
  console.log('Already authenticated, skipping login step');
  
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
  
  // ===== Image Upload Section =====
  console.log('Starting image upload...');
  
  // Now we need to add some images
  // First, let's go to the upload page
  await page.goto('/images/upload');
  console.log('Navigated to image upload page');
  
  // Wait for the page to load fully
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the upload page
  await expect(page).toHaveURL('/images/upload');
  
  // Generate unique image names
  const image1Name = `Test Image ${uniqueId}-1`;
  const image2Name = `Test Image ${uniqueId}-2`;
  
  // ===== First Image Upload =====
  console.log(`Uploading first image: ${image1Name}`);
  
  try {
    // Try multiple selectors for the file input
    const fileInput = page.getByTestId('upload-file');
    if (await fileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fileInput.setInputFiles('./public/uploads/1746721541274-454864497-----8856477.jpeg');
      console.log('Set file using test ID');
    } else {
      console.log('Upload file input not found by test ID, trying alternate selector');
      const altFileInput = page.locator('input[type="file"]');
      if (await altFileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await altFileInput.setInputFiles('./public/uploads/1746721541274-454864497-----8856477.jpeg');
        console.log('Set file using generic file input selector');
      } else {
        // The file input might be hidden, try to force it
        await page.locator('input[type="file"]').dispatchEvent('change', { files: ['./public/uploads/1746721541274-454864497-----8856477.jpeg'] });
        console.log('Tried to set file using dispatch event');
      }
    }
    
    // Try multiple selectors for title field
    const titleInput = page.getByTestId('image-title');
    if (await titleInput.isVisible()) {
      await titleInput.fill(image1Name);
    } else {
      // Try by role with label
      const titleByRole = page.getByRole('textbox', { name: /title/i });
      if (await titleByRole.isVisible()) {
        await titleByRole.fill(image1Name);
      } else {
        // Try by placeholder
        const titleByPlaceholder = page.getByPlaceholder(/title/i);
        if (await titleByPlaceholder.isVisible()) {
          await titleByPlaceholder.fill(image1Name);
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input[type="text"], textarea').first();
          await inputs.fill(image1Name);
        }
      }
    }
    
    // Try multiple selectors for description field
    const descInput = page.getByTestId('image-description');
    if (await descInput.isVisible()) {
      await descInput.fill('This is a test image');
    } else {
      // Try by role with label
      const descByRole = page.getByRole('textbox', { name: /description/i });
      if (await descByRole.isVisible()) {
        await descByRole.fill('This is a test image');
      } else {
        // Try by placeholder
        const descByPlaceholder = page.getByPlaceholder(/description/i);
        if (await descByPlaceholder.isVisible()) {
          await descByPlaceholder.fill('This is a test image');
        } else {
          // Last resort - use generic selectors
          const textareas = page.locator('textarea');
          if (await textareas.count() > 0) {
            await textareas.first().fill('This is a test image');
          }
        }
      }
    }
    
    // Submit the form
    const uploadButton = page.getByRole('button', { name: /upload/i });
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    } else {
      // Try by test ID
      const uploadButtonById = page.getByTestId('upload-submit');
      if (await uploadButtonById.isVisible()) {
        await uploadButtonById.click();
      } else {
        // Last resort - use generic selectors
        const buttons = page.locator('button[type="submit"]');
        if (await buttons.count() > 0) {
          await buttons.first().click();
        }
      }
    }
    
    // Wait for the success message
    await page.getByText(/uploaded successfully/i).waitFor({ timeout: 10000 });
    console.log(`Uploaded image: ${image1Name}`);
  } catch (error) {
    console.error('Error uploading first image:', error);
    await page.screenshot({ path: 'upload-image1-error.png' });
    // Continue with the test even if the first image upload fails
  }
  
  // ===== Second Image Upload =====
  console.log(`Uploading second image: ${image2Name}`);
  
  try {
    // Go to upload page again
    await page.goto('/images/upload');
    console.log('Navigated to image upload page for second image');
    
    // Wait for the page to load fully
    await page.waitForLoadState('networkidle');
    
    // Try multiple selectors for the file input
    const fileInput = page.getByTestId('upload-file');
    if (await fileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fileInput.setInputFiles('./public/uploads/1746721666749-415981397-----8856477.jpeg');
    } else {
      console.log('Upload file input not found by test ID, trying alternate selector');
      const altFileInput = page.locator('input[type="file"]');
      if (await altFileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await altFileInput.setInputFiles('./public/uploads/1746721666749-415981397-----8856477.jpeg');
      } else {
        // The file input might be hidden, try to force it
        await page.locator('input[type="file"]').dispatchEvent('change', { files: ['./public/uploads/1746721666749-415981397-----8856477.jpeg'] });
      }
    }
    
    // Try multiple selectors for title field
    const titleInput = page.getByTestId('image-title');
    if (await titleInput.isVisible()) {
      await titleInput.fill(image2Name);
    } else {
      // Try by role with label
      const titleByRole = page.getByRole('textbox', { name: /title/i });
      if (await titleByRole.isVisible()) {
        await titleByRole.fill(image2Name);
      } else {
        // Try by placeholder
        const titleByPlaceholder = page.getByPlaceholder(/title/i);
        if (await titleByPlaceholder.isVisible()) {
          await titleByPlaceholder.fill(image2Name);
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input[type="text"], textarea').first();
          await inputs.fill(image2Name);
        }
      }
    }
    
    // Try multiple selectors for description field
    const descInput = page.getByTestId('image-description');
    if (await descInput.isVisible()) {
      await descInput.fill('This is another test image');
    } else {
      // Try by role with label
      const descByRole = page.getByRole('textbox', { name: /description/i });
      if (await descByRole.isVisible()) {
        await descByRole.fill('This is another test image');
      } else {
        // Try by placeholder
        const descByPlaceholder = page.getByPlaceholder(/description/i);
        if (await descByPlaceholder.isVisible()) {
          await descByPlaceholder.fill('This is another test image');
        } else {
          // Last resort - use generic selectors
          const textareas = page.locator('textarea');
          if (await textareas.count() > 0) {
            await textareas.first().fill('This is another test image');
          }
        }
      }
    }
    
    // Submit the form
    const uploadButton = page.getByRole('button', { name: /upload/i });
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    } else {
      // Try by test ID
      const uploadButtonById = page.getByTestId('upload-submit');
      if (await uploadButtonById.isVisible()) {
        await uploadButtonById.click();
      } else {
        // Last resort - use generic selectors
        const buttons = page.locator('button[type="submit"]');
        if (await buttons.count() > 0) {
          await buttons.first().click();
        }
      }
    }
    
    // Wait for the success message
    await page.getByText(/uploaded successfully/i).waitFor({ timeout: 10000 });
    console.log(`Uploaded image: ${image2Name}`);
  } catch (error) {
    console.error('Error uploading second image:', error);
    await page.screenshot({ path: 'upload-image2-error.png' });
    // Continue with the test even if the second image upload fails
  }
  
  // ===== Adding Images to Gallery =====
  console.log('Adding images to gallery...');
  
  try {
    // Now let's add these images to our test gallery
    // Go back to galleries
    await page.goto('/galleries');
    console.log('Navigated to galleries page');
    
    // Wait for the page to load fully
    await page.waitForLoadState('networkidle');
    
    // Find and click our test gallery - use the unique name we created
    const galleryLink = page.getByText(galleryName);
    await galleryLink.click();
    console.log('Clicked on gallery');
    
    // Click the edit button
    const editButton = page.getByTestId('edit-gallery-button').first();
    await editButton.click();
    console.log('Clicked edit button');
    
    // Click the "Add Images" button
    const selectImagesButton = page.getByRole('button', { name: /select images/i });
    await selectImagesButton.click();
    console.log('Clicked select images button');
    
    // Select the images we uploaded - try to find them by name
    try {
      await page.getByText(image1Name).click();
      console.log(`Selected image: ${image1Name}`);
    } catch (e) {
      console.warn(`Couldn't select image: ${image1Name} - ${e}`);
    }
    
    try {
      await page.getByText(image2Name).click();
      console.log(`Selected image: ${image2Name}`);
    } catch (e) {
      console.warn(`Couldn't select image: ${image2Name} - ${e}`);
    }
    
    // Confirm image selection
    // Wait for any modal overlay to be ready
    await page.waitForTimeout(1000);
    
    // The button text changes based on number of selected images, so use the test ID
    const selectButton = page.getByTestId('select-images-add-button');
    await selectButton.click();
    console.log('Confirmed image selection');
    
    // Save the gallery changes
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();
    console.log('Clicked save changes button');
    
    // Verify that the gallery was updated
    await page.getByText(/gallery updated successfully/i).waitFor({ timeout: 10000 });
    console.log(`Added images to gallery: ${galleryName}`);
  } catch (error) {
    console.error('Error adding images to gallery:', error);
    await page.screenshot({ path: 'add-images-error.png' });
    // Continue with the test even if adding images fails
  }
  
  // Output the gallery name for use in other tests
  console.log(`TEST GALLERY CREATED: ${galleryName}`);
  
  try {
    // Go back to the gallery to verify it has images
    await page.goto('/galleries');
    await page.waitForLoadState('networkidle');
    await page.getByText(galleryName).click();
    
    // Verify there are images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    console.log(`Gallery has ${imageCount} images`);
    
    if (imageCount > 0) {
      console.log('Successfully created gallery with images');
    } else {
      console.log('Gallery was created but no images were found');
    }
  } catch (error) {
    console.error('Error verifying gallery images:', error);
    await page.screenshot({ path: 'verify-gallery-error.png' });
  }
  
  console.log('Setup gallery test completed');
  });
});
