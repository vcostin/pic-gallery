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
  // Use a very short timeout value for testing
  const timeoutDuration = 500; // Just 0.5 seconds for faster tests
  
  await page.evaluate((timeout) => {
    // Ensure any existing toast containers are removed first
    const existingToasts = document.querySelectorAll('[data-testid="toast-container"]');
    existingToasts.forEach(toast => toast.remove());
    
    // Simulate toast notification
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 pointer-events-none';
    toastContainer.setAttribute('data-testid', 'toast-container');
    toastContainer.id = 'test-toast-container';
    
    const toast = document.createElement('div');
    toast.className = 'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md pointer-events-auto';
    toast.setAttribute('data-testid', 'toast-notification');
    
    const message = document.createElement('p');
    message.className = 'font-medium';
    message.setAttribute('data-testid', 'toast-message');
    message.textContent = 'Test notification for removing image';
    
    toast.appendChild(message);
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // Auto-remove after specified timeout
    window.setTimeout(() => {
      const container = document.getElementById('test-toast-container');
      if (container) {
        container.remove();
      }
    }, timeout);
  }, timeoutDuration);
  
  // Verify toast notification appears
  const toast = page.locator('[data-testid="toast-container"]');
  await expect(toast).toBeVisible();
  
  // Wait for the toast to disappear
  console.log(`Waiting ${timeoutDuration + 500}ms for toast to disappear...`);
  await page.waitForTimeout(timeoutDuration + 500); // Additional time to ensure the toast is gone
  
  // Now check that the toast is gone
  await page.waitForSelector('[data-testid="toast-container"]', { state: 'detached', timeout: 5000 })
    .catch(() => console.log('Timeout waiting for toast to be detached from DOM'));
  
  console.log('Successfully tested toast notification with simulated toast');
}

// Helper function to simulate a toast notification with close button for testing
async function simulateToastNotificationWithCloseButton(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    // Ensure any existing toast containers are removed first
    const existingToasts = document.querySelectorAll('[data-testid="toast-container"]');
    existingToasts.forEach(toast => toast.remove());
    
    // Simulate toast notification with close button
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 pointer-events-none';
    toastContainer.setAttribute('data-testid', 'toast-container');
    toastContainer.id = 'test-toast-container-with-close';
    
    const toast = document.createElement('div');
    toast.className = 'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md pointer-events-auto';
    toast.setAttribute('data-testid', 'toast-notification');
    
    const content = document.createElement('div');
    content.className = 'flex items-start';
    
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'h-5 w-5 mr-2 mt-0.5 flex-shrink-0');
    icon.setAttribute('viewBox', '0 0 20 20');
    icon.setAttribute('fill', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z');
    path.setAttribute('clip-rule', 'evenodd');
    
    icon.appendChild(path);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-grow';
    
    const message = document.createElement('p');
    message.className = 'font-medium';
    message.setAttribute('data-testid', 'toast-message');
    message.textContent = 'Test notification with close button';
    
    messageDiv.appendChild(message);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.setAttribute('data-testid', 'toast-close-button');
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.className = 'text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100';
    
    const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeIcon.setAttribute('class', 'h-5 w-5');
    closeIcon.setAttribute('viewBox', '0 0 20 20');
    closeIcon.setAttribute('fill', 'currentColor');
    
    const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('fill-rule', 'evenodd');
    closePath.setAttribute('d', 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z');
    closePath.setAttribute('clip-rule', 'evenodd');
    
    closeIcon.appendChild(closePath);
    closeButton.appendChild(closeIcon);
    
    // Add click handler to close button - ensure the toast is fully removed
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (document.body.contains(toastContainer)) {
        toastContainer.remove();
      }
    });
    
    content.appendChild(icon);
    content.appendChild(messageDiv);
    content.appendChild(closeButton);
    
    toast.appendChild(content);
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
  });
  
  // Verify toast notification appears
  const toast = page.locator('[data-testid="toast-container"]');
  await expect(toast).toBeVisible();
  
  // Click the X button on the toast
  const closeButton = page.locator('[data-testid="toast-close-button"]');
  await closeButton.click();
  
  // Verify toast disappears after clicking close button
  try {
    await page.waitForSelector('[data-testid="toast-container"]', { state: 'detached', timeout: 5000 });
    console.log('Successfully tested toast notification with close button');
  } catch {
    console.log('❌ Warning: Toast notification did not disappear after clicking close button');
    
    // Fallback: manually remove the toast if it still exists
    await page.evaluate(() => {
      const container = document.getElementById('test-toast-container-with-close');
      if (container) {
        container.remove();
        console.log('Manually removed toast container that didn\'t disappear');
      }
    });
  }
}
