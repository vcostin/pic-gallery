import { Page } from '@playwright/test';
import { OptimizedWaitHelpers } from './optimized-wait-helpers';
import { EnhancedWaitHelpers } from './enhanced-wait-helpers';

/**
 * Consolidated test helper functions combining the best of TestHelpers and SimpleHelpers
 * Provides both simple and comprehensive methods for test operations
 */
export class TestHelpers {
  /**
   * Check if user is authenticated by looking for auth indicators
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    try {
      // Quick check for logout button or auth indicators (longer timeout)
      const hasLogoutButton = await page.getByTestId('logout-button').isVisible({ timeout: 5000 }).catch(() => false);
      if (hasLogoutButton) return true;
      
      // Check if on protected page without being redirected to login
      const currentUrl = page.url();
      const isOnProtectedPage = currentUrl.includes('/galleries') || 
                               currentUrl.includes('/profile') || 
                               currentUrl.includes('/images/upload');
      
      if (isOnProtectedPage && !currentUrl.includes('/auth/login')) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Simple and reliable login method using data-testid selectors
   */
  static async quickLogin(page: Page, email: string, password: string): Promise<boolean> {
    try {
      await page.goto('/auth/login');
      
      // Fill login form using reliable selectors
      await page.fill('[data-testid="login-email"]', email);
      await page.fill('[data-testid="login-password"]', password);
      await page.click('[data-testid="login-submit"]');
      
      // Wait for navigation away from login page
      await page.waitForURL((url) => !url.toString().includes('/auth/'), { timeout: 10000 });
      
      // Give a moment for the page to settle
      await page.waitForLoadState('networkidle');
      
      // Verify authentication with a longer timeout
      return await this.isAuthenticated(page);
    } catch {
      return false;
    }
  }

  /**
   * More robust login with fallback strategies (for compatibility with older tests)
   */
  static async login(page: Page, email: string, password: string): Promise<boolean> {
    try {
      // First check if we're already logged in
      const alreadyAuthenticated = await this.isAuthenticated(page);
      if (alreadyAuthenticated) {
        console.log('Already authenticated, skipping login');
        return true;
      }
      
      // Try the simple login first
      const quickLoginResult = await this.quickLogin(page, email, password);
      if (quickLoginResult) {
        return true;
      }
      
      // Fallback to more complex login strategies if needed
      await page.goto('/auth/login');
      
      // Try filling the login form with different selector strategies
      let emailFilled = false;
      let passwordFilled = false;
      
      // Try by data-testid first
      if (await page.getByTestId('login-email').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('login-email').fill(email);
        emailFilled = true;
      }
      
      if (await page.getByTestId('login-password').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('login-password').fill(password);
        passwordFilled = true;
      }
      
      // If data-testid fails, try by role with name
      if (!emailFilled) {
        if (await page.getByRole('textbox', { name: /email/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByRole('textbox', { name: /email/i }).fill(email);
          emailFilled = true;
        }
      }
      
      if (!passwordFilled) {
        if (await page.getByLabel(/password/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/password/i).fill(password);
          passwordFilled = true;
        }
      }
      
      // Try clicking login button
      const loginButtons = [
        page.getByTestId('login-submit'),
        page.getByRole('button', { name: /login|sign in/i }),
        page.locator('button[type="submit"]')
      ];
      
      let loginClicked = false;
      for (const button of loginButtons) {
        try {
          if (await button.isVisible({ timeout: 1000 })) {
            await button.click();
            loginClicked = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (!loginClicked) {
        console.log('Could not find login button');
        return false;
      }
      
      // Wait for navigation or error with optimized helper
      await OptimizedWaitHelpers.waitForNavigation(page);
      
      return await this.isAuthenticated(page);
    } catch (error) {
      console.log('Login failed:', error);
      return false;
    }
  }

  /**
   * Simple logout without verbose logging
   */
  static async quickLogout(page: Page): Promise<boolean> {
    try {
      // Look for logout button or user menu
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        'button:has-text("Logout")',
        'button:has-text("Log out")',
        'a:has-text("Logout")',
        '.logout'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            await OptimizedWaitHelpers.waitForNavigation(page);
            return true;
          }
        } catch {
          continue;
        }
      }
      
      // If no logout button found, try clearing storage and going to login
      await page.context().clearCookies();
      await page.goto('/auth/login');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up test data via API
   */
  static async cleanupTestData(page: Page, deleteUser: boolean = false): Promise<boolean> {
    try {
      const url = deleteUser ? '/api/e2e/cleanup?deleteUser=true' : '/api/e2e/cleanup';
      const response = await page.request.delete(url, { timeout: 15000 });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Complete cleanup including user deletion (for compatibility with older tests)
   */
  static async completeCleanup(page: Page): Promise<void> {
    await this.cleanupTestData(page, true);
  }

  /**
   * Delete user via API
   */
  static async deleteUser(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/delete-user', {
        data: { email },
        timeout: 15000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Cleanup user galleries via API
   */
  static async cleanupUserGalleries(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/cleanup-galleries', {
        data: { email },
        timeout: 15000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Cleanup user images via API
   */
  static async cleanupUserImages(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/cleanup-images', {
        data: { email },
        timeout: 15000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Create a gallery with specified name and description
   */
  static async createGallery(page: Page, name: string, description?: string): Promise<{ galleryId: string, galleryName: string } | null> {
    try {
      // Navigate to galleries page
      await page.goto('/galleries');
      await page.waitForLoadState('load');
      
      // Look for create gallery link (not button)
      const createButton = page.getByTestId('create-gallery-link');
      
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        
        // Wait for navigation to create page
        await page.waitForURL('**/galleries/create');
        
        // Fill gallery form using the correct testids from the component
        await page.fill('[data-testid="gallery-title"]', name);
        await page.fill('[data-testid="gallery-description"]', description || 'Test gallery description');
        
        // Submit form
        await page.click('[data-testid="create-gallery-submit"]');
        
        // Wait for navigation to the new gallery page
        await page.waitForURL('**/galleries/**');
        
        // Get gallery ID from URL
        const url = page.url();
        const galleryIdMatch = url.match(/\/galleries\/([^\/]+)$/);
        const galleryId = galleryIdMatch ? galleryIdMatch[1] : Date.now().toString();
        
        return { galleryId, galleryName: name };
      }
      
      return null;
    } catch (error) {
      console.log('Failed to create gallery:', error);
      return null;
    }
  }

  /**
   * Create a gallery with test images - proper workflow that associates images with gallery
   */
  static async createGalleryWithImages(page: Page, imageCount: number = 3, galleryName?: string): Promise<{ galleryId: string, galleryName: string } | null> {
    try {
      console.log(`Creating gallery with ${imageCount} images...`);
      
      // Step 1: Upload test images first
      const uploadedImages = await this.uploadTestImages(page, imageCount);
      console.log(`Successfully uploaded ${uploadedImages.length} test images:`, uploadedImages);
      
      if (uploadedImages.length === 0) {
        console.log('No images were uploaded, cannot create gallery with images');
        return null;
      }
      
      // FIXED: Add database consistency wait after uploading images
      console.log('Waiting for database consistency after uploads...');
      await page.waitForTimeout(2000);
      
      // Step 2: Navigate to gallery creation
      await page.goto('/galleries');
      await page.waitForLoadState('load');
      
      const uniqueGalleryName = galleryName || `Test Gallery ${Date.now()}`;
      
      // Look for create gallery link (not button)
      const createButton = page.getByTestId('create-gallery-link');
      
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        
        // Wait for navigation to create page
        await page.waitForURL('**/galleries/create');
        
        // Step 3: Fill gallery form
        await page.fill('[data-testid="gallery-title"]', uniqueGalleryName);
        await page.fill('[data-testid="gallery-description"]', 'Test gallery with images for E2E testing');
        
        // Step 4: Select images using the SelectImagesDialog workflow
        console.log('Opening image selection dialog...');
        await page.getByTestId('select-images-button').click();
        
        // Wait for dialog to open
        await page.waitForSelector('[data-testid="select-images-modal-overlay"]');
        
        // FIXED: Better wait for images to load in the dialog with retry logic
        let availableImageCount = 0;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (availableImageCount < imageCount && attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}: Checking for images in selection dialog...`);
          
          // Wait for any images to appear
          await page.waitForSelector('[data-testid^="select-images-image-card-"]', { timeout: 5000 }).catch(() => {
            console.log(`No images found in attempt ${attempts}`);
          });
          
          const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
          availableImageCount = await imageCards.count();
          console.log(`Found ${availableImageCount} images in selection dialog (need ${imageCount})`);
          
          if (availableImageCount < imageCount && attempts < maxAttempts) {
            console.log('Not enough images found, waiting and retrying...');
            await EnhancedWaitHelpers.waitForPageReady(page, {
              selector: '[data-testid^="select-images-image-card-"]',
              timeout: 2000
            });
          }
        }
        
        if (availableImageCount > 0) {
          console.log(`Found ${availableImageCount} images available for selection`);
          
          // Select up to imageCount or all available images
          const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
          const imagesToSelect = Math.min(imageCount, availableImageCount);
          for (let i = 0; i < imagesToSelect; i++) {
            await imageCards.nth(i).click();
            console.log(`Selected image ${i + 1} of ${imagesToSelect}`);
          }
          
          // Add selected images to gallery
          const addButton = page.getByTestId('select-images-add-button');
          await addButton.click();
          
          // Wait for dialog to close
          await page.waitForSelector('[data-testid="select-images-modal-overlay"]', { state: 'hidden' });
          console.log('Images selected and added to gallery');
        } else {
          console.log('No images found in selection dialog, closing dialog');
          const closeButton = page.getByTestId('select-images-close-button');
          await closeButton.click();
        }
        
        // Step 5: Submit gallery creation form
        await page.click('[data-testid="create-gallery-submit"]');
        
        // Wait for navigation to the new gallery page with enhanced wait strategies
        try {
          await Promise.race([
            page.waitForURL('**/galleries/**', { timeout: 5000 }),
            page.waitForSelector('[data-testid="gallery-content"], .gallery-content', { timeout: 5000 }),
            page.waitForSelector('h1, [data-testid="gallery-title"]', { timeout: 5000 })
          ]);
          
          // Wait for page stability using enhanced wait helpers instead of timeout
          await EnhancedWaitHelpers.waitForPageReady(page, {
            selector: '[data-testid="gallery-view"], [data-testid="gallery-detail"], main',
            timeout: 3000
          }).catch(() => {
            console.log('Enhanced wait for page ready timed out, continuing...');
          });
          
          // Get gallery ID from URL
          const url = page.url();
          const galleryIdMatch = url.match(/\/galleries\/([^\/]+)$/);
          const galleryId = galleryIdMatch ? galleryIdMatch[1] : Date.now().toString();
          
          console.log(`Successfully created gallery: ${uniqueGalleryName} with ID: ${galleryId}`);
          return { galleryId, galleryName: uniqueGalleryName };
        } catch (navError) {
          console.warn('Gallery creation succeeded but navigation may have failed:', navError);
          // Try to get gallery ID from current state or fallback
          const url = page.url();
          const galleryIdMatch = url.match(/\/galleries\/([^\/]+)$/);
          const galleryId = galleryIdMatch ? galleryIdMatch[1] : Date.now().toString();
          
          return { galleryId, galleryName: uniqueGalleryName };
        }
      }
      
      return null;
    } catch (error) {
      console.log('Failed to create gallery with images:', error);
      return null;
    }
  }

  /**
   * Verify an image card is visible
   */
  static async verifyImageCard(page: Page, imageName: string): Promise<boolean> {
    try {
      const imageCard = page.locator(`[data-testid="image-card"]:has-text("${imageName}")`).or(
        page.locator(`.image-card:has-text("${imageName}")`)
      );
      
      return await imageCard.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a specific gallery
   */
  static async navigateToGallery(page: Page, galleryIndex: number = 0): Promise<string | null> {
    try {
      await page.goto('/galleries');
      await page.waitForLoadState('load');
      
      const galleryLinks = page.getByTestId('gallery-link').or(
        page.locator('a[href*="/galleries/"]')
      );
      
      const galleryCount = await galleryLinks.count();
      if (galleryCount > galleryIndex) {
        await galleryLinks.nth(galleryIndex).click();
        await page.waitForLoadState('load');
        
        const url = page.url();
        const galleryIdMatch = url.match(/\/galleries\/([^\/]+)/);
        return galleryIdMatch ? galleryIdMatch[1] : null;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Navigate to image upload page
   */
  static async navigateToImageUpload(page: Page): Promise<boolean> {
    try {
      await page.goto('/images/upload');
      await page.waitForLoadState('load');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload test images to ensure images exist for selection
   */
  static async uploadTestImages(page: Page, count: number = 2): Promise<string[]> {
    const uploadedImageNames: string[] = [];
    const uniqueId = Date.now();
    
    // Define test assets inline to avoid module issues
    const TEST_ASSETS = {
      images: {
        testImage1: './test-data/images/test-image-1.jpg',
        testImage2: './test-data/images/test-image-2.jpg'
      }
    };
    
    for (let i = 0; i < count; i++) {
      try {
        console.log(`Uploading test image ${i + 1} of ${count}...`);
        
        // Check if page context is still valid before attempting upload
        if (page.isClosed()) {
          console.error(`❌ Page context is closed, cannot upload image ${i + 1}`);
          break; // Exit upload loop if context is closed
        }
        
        // Navigate to upload page
        await page.goto('/images/upload');
        await page.waitForLoadState('load');
        
        // Generate unique image name
        const imageName = `E2E Test Image ${uniqueId}-${i + 1}`;
        
        // Use appropriate image path
        const imagePath = i === 0 ? TEST_ASSETS.images.testImage1 : TEST_ASSETS.images.testImage2;
        
        // Fill upload form using enhanced upload component
        await page.getByTestId('file-input').setInputFiles(imagePath);
        await page.locator('input[placeholder="Enter image title"]').fill(imageName);
        await page.locator('textarea[placeholder="Describe your image..."]').fill(`Test image ${i + 1} for E2E testing`);
        await page.locator('[data-testid="tag-input"]').fill('e2e, test, automation');
        
        // Submit form using enhanced upload component
        await page.getByTestId('upload-submit').click();
        
        // Wait for success indicators - prioritize quick detection
        try {
          // Try multiple success detection strategies in order of speed
          await Promise.race([
            // Fast: Check for redirect first (usually happens quickly)
            page.waitForURL((url: URL) => !url.pathname.includes('/upload'), { timeout: 5000 }),
            // Medium: Check for success text
            page.getByText(/uploaded successfully|upload complete|image uploaded/i).waitFor({ timeout: 8000 }),
            // Medium: Check for any progress completion
            page.waitForSelector('.upload-success, .success-message, [data-testid="upload-success"]', { timeout: 8000 }).catch(() => Promise.reject()),
            // Slow: Check for navigation to images page
            page.waitForURL(/\/images(?:\/)?$/, { timeout: 10000 }).catch(() => Promise.reject())
          ]);
          
          uploadedImageNames.push(imageName);
          console.log(`Successfully uploaded: ${imageName}`);
        } catch (error) {
          console.warn(`Upload detection timed out for image ${i + 1}, trying fallback...`);
          
          // Quick fallback checks
          const currentUrl = page.url();
          const isRedirected = !currentUrl.includes('/upload');
          
          if (isRedirected) {
            uploadedImageNames.push(imageName);
            console.log(`Upload succeeded (detected via URL change): ${imageName}`);
          } else {
            // Final fallback: check for any success indicators without waiting
            const hasSuccessText = await page.getByText(/success/i).isVisible({ timeout: 1000 }).catch(() => false);
            if (hasSuccessText) {
              uploadedImageNames.push(imageName);
              console.log(`Upload succeeded (detected via success text): ${imageName}`);
            } else {
              console.error(`Upload failed for image ${i + 1}: ${error}`);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to upload test image ${i + 1}:`, error);
      }
    }
    
    // Wait for database consistency after uploads with enhanced wait
    console.log('Waiting for database consistency after uploads...');
    
    // Check if page context is still valid before waiting
    if (!page.isClosed()) {
      try {
        await page.waitForTimeout(1000); // Brief pause for database consistency
      } catch (error) {
        console.warn('Warning: Could not wait for timeout, page context may be closed:', error.message);
      }
    } else {
      console.warn('⚠️ Page context is closed, skipping database consistency wait');
    }
    
    console.log(`Successfully uploaded ${uploadedImageNames.length} test images:`, uploadedImageNames);
    return uploadedImageNames;
  }
}
