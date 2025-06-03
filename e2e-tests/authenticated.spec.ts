import { test, expect } from '@playwright/test';

// These tests will use the authenticated state
// They're designed specifically for the authenticated project
// Skip these tests when running in any project other than 'authenticated'

test.describe('Authenticated Gallery Features', () => {
  test('should display user galleries when authenticated', async ({ page }) => {
    // Skip if we're not using the AUTH_ONLY environment variable
    if (!process.env.AUTH_ONLY) {
      console.log('Skipping test - requires authenticated project');
      return;
    }
    
    // Go directly to galleries page - we should already be authenticated
    await page.goto('/galleries');
    
    // Verify we're on the galleries page
    await expect(page).toHaveURL(/\/galleries/);
    
    // Verify we can see the create gallery button (only visible to authenticated users)
    await expect(page.getByTestId('create-gallery-link')).toBeVisible();
    
    // Check if we have any galleries
    const galleries = page.getByTestId('gallery-item');
    const count = await galleries.count();
    
    // Log the number of galleries (informational)
    console.log(`Found ${count} galleries`);
    
    if (count > 0) {
      // If we have galleries, verify we can click one
      await galleries.first().click();
      await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
      await expect(page.getByTestId('gallery-detail-title')).toBeVisible();
    }
  });
  
  test('should be able to access the upload image page', async ({ page }) => {
    // Skip if we're not using the AUTH_ONLY environment variable
    if (!process.env.AUTH_ONLY) {
      console.log('Skipping test - requires authenticated project');
      return;
    }
    
    // Go to the images upload page
    await page.goto('/images/upload');
    
    // Verify we're on the upload page (no redirect to login)
    await expect(page).toHaveURL(/\/images\/upload/);
    
    // Verify we can see the enhanced upload interface
    await expect(page.getByText('Upload Images')).toBeVisible();
    await expect(page.getByText('Select Images')).toBeVisible();
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
    await expect(page.getByTestId('upload-submit')).not.toBeVisible(); // Should not be visible until files are selected
  });

  test('should be able to use enhanced upload with progressive disclosure', async ({ page }) => {
    // Skip if we're not using the AUTH_ONLY environment variable
    if (!process.env.AUTH_ONLY) {
      console.log('Skipping test - requires authenticated project');
      return;
    }
    
    // Go to the images upload page
    await page.goto('/images/upload');
    
    // Verify enhanced upload interface
    await expect(page.getByText('1')).toBeVisible(); // Step indicator
    await expect(page.getByText('Select Images')).toBeVisible();
    await expect(page.locator('[role="button"][aria-label*="Upload area"]')).toBeVisible();
    
    // Verify drag and drop features
    await expect(page.getByText('Drag and drop your images here')).toBeVisible();
    await expect(page.getByText('or click to browse')).toBeVisible();
    await expect(page.getByText(/Supports JPG, PNG, WebP/)).toBeVisible();
    await expect(page.getByText(/Maximum 5 files/)).toBeVisible();
    
    // Step 2 should not be visible initially (progressive disclosure)
    await expect(page.getByText('Add Details')).not.toBeVisible();
  });
});
