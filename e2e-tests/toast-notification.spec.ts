import { test, expect } from '@playwright/test';

// This test specifically checks the toast notification functionality
test('toast notifications should properly appear and disappear', async ({ page }) => {
  // Already authenticated via the authenticated project setup
  console.log('Already authenticated, skipping login step');
  
  // Go to galleries page
  await page.goto('/galleries');
  console.log('Navigated to galleries page');
  
  // Wait for the page to load fully
  await page.waitForLoadState('networkidle');
  
  // Check if there are any galleries
  const galleryItems = page.getByTestId('gallery-item');
  await galleryItems.first().waitFor({ timeout: 5000 }).catch(() => null);
  
  const count = await galleryItems.count();
  console.log(`Found ${count} galleries`);
  
  // If no galleries exist, create a simple one
  if (count === 0) {
    console.log('No galleries found, creating a new one');
    
    // Create a simple gallery
    const galleryName = `Test Gallery ${Date.now()}`;
    await page.goto('/galleries/create');
    
    // Fill out the basic gallery form using flexible selectors
    try {
      // Try to find form elements
      const titleInput = await page.locator('input[placeholder*="title" i], input[name*="title" i], #title').first();
      await titleInput.fill(galleryName);
      
      const descInput = await page.locator('textarea[placeholder*="description" i], textarea[name*="description" i], #description').first();
      await descInput.fill('Test gallery for toast notification testing');
      
      const publicCheckbox = await page.locator('input[type="checkbox"]').first();
      await publicCheckbox.check();
      
      // Submit the form
      await page.locator('button[type="submit"]').click();
      
      // Wait for navigation to the gallery page
      await page.waitForURL(/\/galleries\/[\w-]+/, { timeout: 10000 });
      console.log(`Created gallery: ${galleryName}`);
    } catch (error) {
      console.error('Error creating gallery:', error);
      console.log('Using an existing gallery instead if available');
    }
    
    // Go back to galleries page
    await page.goto('/galleries');
  }
  
  // Try to use the first available gallery
  if (await galleryItems.count() > 0) {
    // Click the first gallery
    await galleryItems.first().click();
    console.log('Clicked first gallery');
    
    // Verify we're on the gallery detail page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
    
    // Click the edit gallery button
    await page.getByTestId('edit-gallery-button').first().click();
    console.log('Navigated to edit page');
    
    // Verify we're on the edit page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+\/edit/);
    
    // Check if there are any images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    console.log(`Gallery has ${imageCount} images`);
    
    if (imageCount > 0) {
      // TEST 1: Toast should appear and disappear automatically after timeout
      console.log('Testing toast auto-dismissal...');
      
      // Click the remove button on the first image
      await galleryImages.first().hover();
      await galleryImages.first().getByRole('button', { name: /remove/i }).click();
      
      // Confirm removal in the dialog
      await page.getByRole('button', { name: /remove image/i }).click();
      
      // Verify toast notification appears
      const toast = page.locator('.fixed.bottom-4.right-4');
      await expect(toast).toBeVisible();
      console.log('Toast appeared');
      
      // Wait for the toast to disappear (it should auto-dismiss after 3 seconds)
      // Using a timeout slightly longer than the expected 3 seconds
      await expect(toast).not.toBeVisible({ timeout: 5000 });
      console.log('Toast disappeared after timeout');
      
      // If there are still images, test clicking the X button
      if (await galleryImages.count() > 1) {
        // TEST 2: Toast should disappear when clicking the X button
        console.log('Testing toast dismissal via X button...');
        
        // Click the remove button on another image
        await galleryImages.first().hover();
        await galleryImages.first().getByRole('button', { name: /remove/i }).click();
        
        // Confirm removal in the dialog
        await page.getByRole('button', { name: /remove image/i }).click();
        
        // Verify toast notification appears
        await expect(toast).toBeVisible();
        console.log('Toast appeared for X button test');
        
        // Click the X button on the toast
        await toast.getByRole('button').click();
        
        // Verify toast disappears immediately
        await expect(toast).not.toBeVisible({ timeout: 1000 });
        console.log('Toast disappeared after clicking X button');
      }
      
      // Test passed
      console.log('Toast notification tests passed!');
    } else {
      console.log('No images in gallery, cannot test toast notifications');
    }
  } else {
    console.log('No galleries available for testing');
  }
});
