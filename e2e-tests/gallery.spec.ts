import { test, expect } from '@playwright/test';

test.describe('Gallery Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the homepage before each test
    await page.goto('/');
  });

  test('should display the homepage with galleries', async ({ page }) => {
    // Check that the page has loaded
    await expect(page).toHaveTitle(/Pic Gallery/);
    
    // Verify that the page contains the gallery elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should navigate to gallery details when clicking on a gallery', async ({ page }) => {
    // Find and click on the first gallery item
    const firstGallery = page.locator('.gallery-item').first();
    
    // Store the gallery title for later comparison
    const galleryTitle = await firstGallery.locator('h2, h3, .title').textContent();
    
    // Click on the gallery
    await firstGallery.click();
    
    // Verify we've navigated to the gallery details page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
    
    // Verify the gallery title is displayed in the details page
    if (galleryTitle) {
      await expect(page.getByText(galleryTitle, { exact: false })).toBeVisible();
    }
  });

  test('should display images within a gallery', async ({ page }) => {
    // Navigate to the first gallery
    const firstGallery = page.locator('.gallery-item').first();
    await firstGallery.click();
    
    // Verify that images are loaded in the gallery
    await expect(page.locator('.gallery-image, img')).toBeVisible();
  });
});

test.describe('Image Upload Functionality', () => {
  test('should navigate to upload page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on upload button/link
    await page.getByRole('link', { name: /upload|add/i }).click();
    
    // Verify we're on the upload page
    await expect(page).toHaveURL(/\/upload|\/images\/new/);
    
    // Check for upload form
    await expect(page.locator('form')).toBeVisible();
  });
});
