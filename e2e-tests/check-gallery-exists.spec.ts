import { test, expect } from '@playwright/test';

// This is a simple test to check if we can navigate to the galleries page
// and if there's at least one gallery available for testing
test('should check if a gallery exists for testing', async ({ page }) => {
  // Already authenticated via the authenticated project setup
  console.log('Already authenticated, skipping login step');
  
  // Go to galleries page
  await page.goto('/galleries');
  console.log('Navigated to galleries page');
  
  // Wait for the page to load fully
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the galleries page
  await expect(page).toHaveURL('/galleries');
  
  // Check if there are any galleries
  const galleryItems = page.getByTestId('gallery-item');
  await galleryItems.first().waitFor({ timeout: 5000 }).catch(() => null);
  
  const count = await galleryItems.count();
  console.log(`Found ${count} galleries`);
  
  if (count > 0) {
    // Get the title of the first gallery
    const firstGallery = galleryItems.first();
    const titleElement = firstGallery.getByTestId('gallery-title');
    
    if (await titleElement.isVisible()) {
      const galleryTitle = await titleElement.textContent();
      console.log(`First gallery title: ${galleryTitle}`);
    } else {
      console.log('Gallery title element not found');
    }
    
    // Take a screenshot of the galleries page
    await page.screenshot({ path: 'galleries-page.png' });
    
    // Try to navigate to the first gallery
    await firstGallery.click();
    console.log('Clicked on first gallery');
    
    // Verify we navigated to a gallery detail page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
    console.log('Successfully navigated to gallery detail page');
    
    // Check if the gallery has any images
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    console.log(`Gallery has ${imageCount} images`);
  } else {
    console.log('No galleries found, creating a new one');
    
    // Navigate to create gallery page
    await page.goto('/galleries/create');
    console.log('Navigated to create gallery page');
    
    // Wait for the page to load fully
    await page.waitForLoadState('networkidle');
    
    // Create a simple gallery for testing
    const galleryName = `Test Gallery ${Date.now()}`;
    
    // Fill the gallery form - attempting multiple selector strategies
    try {
      // Try data-testid selectors first
      await page.getByTestId('gallery-title').fill(galleryName);
      await page.getByTestId('gallery-description').fill('This gallery was created for E2E testing');
      await page.getByTestId('gallery-public').check();
    } catch {
      console.log('Could not use data-testid selectors, trying role selectors');
      try {
        // Try role selectors
        await page.getByRole('textbox', { name: /title/i }).fill(galleryName);
        await page.getByRole('textbox', { name: /description/i }).fill('This gallery was created for E2E testing');
        await page.getByRole('checkbox', { name: /public/i }).check();
      } catch {
        console.log('Could not use role selectors, trying basic selectors');
        // Try basic selectors
        const inputs = page.locator('input[type="text"], textarea');
        await inputs.first().fill(galleryName);
        if (await inputs.count() > 1) {
          await inputs.nth(1).fill('This gallery was created for E2E testing');
        }
        
        const checkbox = page.locator('input[type="checkbox"]');
        if (await checkbox.count() > 0) {
          await checkbox.first().check();
        }
      }
    }
    
    // Submit the form
    try {
      await page.getByRole('button', { name: /create/i }).click();
    } catch {
      console.log('Could not use role selector for submit button, trying basic selector');
      await page.locator('button[type="submit"]').click();
    }
    
    // Verify that a gallery was created
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/, { timeout: 10000 });
    console.log(`Successfully created gallery: ${galleryName}`);
  }
});
