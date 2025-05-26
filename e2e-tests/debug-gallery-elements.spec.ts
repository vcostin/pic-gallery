import { test, expect } from '@playwright/test';

test.describe('Debug Gallery Elements', () => {
  test('check what elements are available on galleries page', async ({ page }) => {
    // Navigate to galleries page
    await page.goto('/galleries');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/galleries-page-debug.png' });
    
    // Check for various create gallery elements
    const createButton = page.getByTestId('create-gallery-button');
    const createLink = page.getByTestId('create-gallery-link');
    const createGalleryText = page.locator('text=Create');
    
    console.log('Create Gallery Button visible:', await createButton.isVisible());
    console.log('Create Gallery Link visible:', await createLink.isVisible());
    console.log('Any Create text visible:', await createGalleryText.count());
    
    // List all data-testid elements
    const allTestIds = await page.locator('[data-testid]').allTextContents();
    console.log('All elements with data-testid:', allTestIds);
    
    // Check if we can find any create elements by text
    const createTexts = await page.locator('text=Create').allTextContents();
    console.log('Elements with "Create" text:', createTexts);
  });
});
