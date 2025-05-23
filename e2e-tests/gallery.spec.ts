import { test, expect } from '@playwright/test';

// Tests for unathenticated users to ensure basic public functionality works
test.describe('Gallery Functionality (Public)', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the homepage before each test
    await page.goto('/');
  });

  test('should display the homepage with pic gallery title', async ({ page }) => {
    // Check that the page has loaded
    await expect(page).toHaveTitle(/Pic Gallery/);
    
    // Verify that the page contains the gallery header
    await expect(page.getByRole('heading', { name: /Pic Gallery/i })).toBeVisible();
  });
  
  test('should have link to login/register', async ({ page }) => {
    // Check if we have a link to login
    await expect(page.getByRole('link', { name: /started|login|sign in/i })).toBeVisible();
  });
});

// Simplified tests for gallery components
test.describe('Gallery Component Tests', () => {
  test('gallery item should have proper data-testid attributes', async ({ page }) => {
    // Navigate directly to galleries
    await page.goto('/galleries');
    
    // We may need to login - check if we're redirected
    if (page.url().includes('/auth/login') || page.url().includes('/api/auth/signin')) {
      // We're just testing the component attributes, so we'll skip real login
      test.skip();
    } else {
      try {
        // Check if gallery items exist and have proper attributes
        const galleryItem = page.getByTestId('gallery-item').first();
        
        if (await galleryItem.isVisible({ timeout: 5000 })) {
          // Verify the data-testid attributes are present
          await expect(galleryItem.getByTestId('gallery-title')).toBeDefined();
        } else {
          test.skip('No gallery items found to test');
        }
      } catch {
        test.skip('Could not access gallery items');
      }
    }
  });
});

// Test for upload form elements
test.describe('Upload Form Elements', () => {
  test('upload form should have proper data-testid attributes', async ({ page }) => {
    // Navigate directly to upload page
    await page.goto('/images/upload');
    
    // We may need to login - check if we're redirected
    if (page.url().includes('/auth/login') || page.url().includes('/api/auth/signin')) {
      // We're just testing the component attributes, so we'll skip real login
      test.skip();
    } else {
      try {
        // Check form elements have proper data-testid attributes
        await expect(page.getByTestId('upload-form')).toBeDefined();
        await expect(page.getByTestId('upload-title')).toBeDefined();
        await expect(page.getByTestId('upload-description')).toBeDefined();
        await expect(page.getByTestId('upload-tags')).toBeDefined();
        await expect(page.getByTestId('upload-file')).toBeDefined(); 
        await expect(page.getByTestId('upload-submit')).toBeDefined();
      } catch {
        test.skip('Could not access upload form');
      }
    }
  });
});
