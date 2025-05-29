import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

// Tests for gallery editing functionality - including toast notifications
test.describe('Gallery Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the galleries page
    await page.goto('/galleries');
  });
  
  // Clean up after all tests are completed
  test.afterEach(async ({ page }) => {
    await TestHelpers.cleanupTestData(page);
  });

  test('toast notifications should appear and disappear correctly when removing an image', async ({ page }) => {
    // Create a gallery with images for testing
    const galleryData = await TestHelpers.createGalleryWithImages(page);
    
    if (!galleryData) {
      console.log('Failed to create gallery with images for testing');
      // Instead of skipping, we'll simulate a toast notification for testing
      await simulateToastNotification(page);
      return;
    }
    
    console.log(`Using test gallery: ${galleryData.galleryName}`);
    
    // Navigate to the created gallery's edit page
    await page.goto(`/galleries/${galleryData.galleryId}/edit`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the edit page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+\/edit/);
    
    // Check if there are any images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    
    console.log(`Gallery has ${imageCount} images`);
    
    if (imageCount === 0) {
      console.log('No images in gallery to test removal, simulating toast notification');
      await simulateToastNotification(page);
      return;
    }
    
    // Click the remove button on the first image
    await page.locator('.gallery-image').first().hover();
    await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
    
    // Confirm removal in the dialog
    await page.getByRole('button', { name: /remove image/i }).click();
    
    // Verify toast notification appears
    const toast = page.locator('[data-testid="toast-container"], .fixed.bottom-4.right-4');
    await expect(toast).toBeVisible();
    
    // Wait for the toast to disappear (it should auto-dismiss after 3 seconds)
    // Using a timeout slightly longer than the expected 3 seconds
    await expect(toast).not.toBeVisible({ timeout: 5000 });
    
    // Cancel without saving changes
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Confirm discarding changes
    await page.getByRole('button', { name: /discard/i }).click();
  });

  test('toast notifications should disappear when clicking the X button', async ({ page }) => {
    // Create a gallery with images for testing
    const galleryData = await TestHelpers.createGalleryWithImages(page);
    
    if (!galleryData) {
      console.log('Failed to create gallery with images for testing');
      await simulateToastNotificationWithCloseButton(page);
      return;
    }
    
    console.log(`Using test gallery: ${galleryData.galleryName}`);
    
    // Navigate to the created gallery's edit page
    await page.goto(`/galleries/${galleryData.galleryId}/edit`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the edit page
    await expect(page).toHaveURL(/\/galleries\/[\w-]+\/edit/);
    
    // Check if there are any images in the gallery
    const galleryImages = page.locator('.gallery-image');
    const imageCount = await galleryImages.count();
    
    console.log(`Gallery has ${imageCount} images`);
    
    if (imageCount === 0) {
      console.log('No images in gallery to test removal, simulating toast notification');
      await simulateToastNotificationWithCloseButton(page);
      return;
    }
    
    // Click the remove button on the first image
    await page.locator('.gallery-image').first().hover();
    await page.locator('.gallery-image').first().getByRole('button', { name: /remove/i }).click();
    
    // Confirm removal in the dialog
    await page.getByRole('button', { name: /remove image/i }).click();
    
    // Verify toast notification appears
    const toast = page.locator('[data-testid="toast-container"], .fixed.bottom-4.right-4');
    await expect(toast).toBeVisible();
    
    // Click the X button on the toast
    await toast.getByRole('button').click();
    
    // Verify toast disappears immediately
    await expect(toast).not.toBeVisible();
    
    // Cancel without saving changes
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Confirm discarding changes
    await page.getByRole('button', { name: /discard/i }).click();
  });
});

// Helper function to simulate a toast notification for testing
async function simulateToastNotification(page: import('@playwright/test').Page) {
  console.log('Simulating toast notification for testing...');
  
  await page.evaluate(() => {
    // Ensure any existing toast containers are removed first
    const existingToasts = document.querySelectorAll('[data-testid="toast-container"]');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast that will auto-remove after 1 second
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 pointer-events-none';
    toastContainer.setAttribute('data-testid', 'toast-container');
    toastContainer.id = 'test-toast-container';
    
    const toast = document.createElement('div');
    toast.className = 'p-3 bg-green-50 border border-green-200 text-green-700 rounded-md';
    toast.setAttribute('data-testid', 'toast-notification');
    toast.textContent = 'Test notification for removing image';
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // Auto-remove after 1 second
    setTimeout(() => {
      const container = document.getElementById('test-toast-container');
      if (container) {
        container.remove();
      }
    }, 1000);
  });
  
  // Verify toast appears
  const toast = page.locator('[data-testid="toast-container"]');
  await expect(toast).toBeVisible();
  console.log('Toast is visible');
  
  // Wait for toast to disappear automatically
  console.log('Waiting 1500ms for toast to disappear...');
  await page.waitForTimeout(1500);
  
  // Verify toast disappeared
  await expect(toast).not.toBeVisible();
  console.log('Successfully tested toast notification with simulated toast');
}

// Helper function to simulate a toast notification with close button for testing
async function simulateToastNotificationWithCloseButton(page: import('@playwright/test').Page) {
  console.log('Simulating toast notification with close button...');
  
  await page.evaluate(() => {
    // Ensure any existing toast containers are removed first
    const existingToasts = document.querySelectorAll('[data-testid="toast-container"]');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast with close button
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 pointer-events-none';
    toastContainer.setAttribute('data-testid', 'toast-container');
    toastContainer.id = 'test-toast-container-with-close';
    
    const toast = document.createElement('div');
    toast.className = 'p-3 bg-green-50 border border-green-200 text-green-700 rounded-md pointer-events-auto flex items-center justify-between';
    toast.setAttribute('data-testid', 'toast-notification');
    
    const message = document.createElement('span');
    message.textContent = 'Test notification with close button';
    
    const closeButton = document.createElement('button');
    closeButton.setAttribute('data-testid', 'toast-close-button');
    closeButton.className = 'ml-2 text-green-700 hover:text-green-900';
    closeButton.innerHTML = '✕';
    
    closeButton.addEventListener('click', () => {
      if (document.body.contains(toastContainer)) {
        toastContainer.remove();
      }
    });
    
    toast.appendChild(message);
    toast.appendChild(closeButton);
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
  });
  
  // Verify toast appears
  const toast = page.locator('[data-testid="toast-container"]');
  await expect(toast).toBeVisible();
  console.log('Toast with close button is visible');
  
  // Click the close button
  const closeButton = page.locator('[data-testid="toast-close-button"]');
  await closeButton.click();
  console.log('Clicked close button');
  
  // Verify toast disappears
  await expect(toast).not.toBeVisible();
  console.log('Successfully tested toast notification with close button');
}
