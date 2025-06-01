import { Page } from '@playwright/test';
import { OptimizedWaitHelpers } from './optimized-wait-helpers';

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
      // Quick check for logout button or auth indicators
      const hasLogoutButton = await page.getByTestId('logout-button').isVisible({ timeout: 1000 }).catch(() => false);
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
      
      // Wait for navigation
      await page.waitForURL(/\/galleries|\/home|\/dashboard|\//,
        { timeout: 10000 });
      
      // Verify authentication
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
   * Create a gallery with test images (from original TestHelpers)
   */
  static async createGalleryWithImages(page: Page): Promise<{ galleryId: string, galleryName: string } | null> {
    try {
      // Navigate to galleries page
      await page.goto('/galleries');
      await page.waitForLoadState('networkidle');
      
      // Create a new gallery
      const galleryName = `Test Gallery ${Date.now()}`;
      
      // Look for create gallery button
      const createButton = page.getByTestId('create-gallery-button').or(
        page.getByRole('button', { name: /create|new gallery/i })
      );
      
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        
        // Fill gallery form
        await page.fill('[data-testid="gallery-title"]', galleryName);
        await page.fill('[data-testid="gallery-description"]', 'Test gallery description');
        
        // Submit form with optimized wait
        await OptimizedWaitHelpers.waitForFormSubmission(page, '[data-testid="create-gallery-submit"]');
        
        // Get gallery ID from URL or response
        const url = page.url();
        const galleryIdMatch = url.match(/\/galleries\/([^\/]+)/);
        const galleryId = galleryIdMatch ? galleryIdMatch[1] : Date.now().toString();
        
        return { galleryId, galleryName };
      }
      
      return null;
    } catch (error) {
      console.log('Failed to create gallery:', error);
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
      await page.waitForLoadState('networkidle');
      
      const galleryLinks = page.getByTestId('gallery-link').or(
        page.locator('a[href*="/galleries/"]')
      );
      
      const galleryCount = await galleryLinks.count();
      if (galleryCount > galleryIndex) {
        await galleryLinks.nth(galleryIndex).click();
        await page.waitForLoadState('networkidle');
        
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
      await page.waitForLoadState('networkidle');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload test images to ensure images exist for selection
   */
  static async uploadTestImages(page: Page, count: number = 2): Promise<string[]> {
    // Import test assets using require to avoid ES module issues
    const testAssetsPath = require('path').resolve(__dirname, './test-assets');
    const { TEST_ASSETS } = require(testAssetsPath);
    
    // For CI, use fallback paths since the dynamic import has ES module issues
    let TEST_ASSETS_CI: any = null;
    let ensureTestImagesExist: any = null;
    
    if (process.env.CI) {
      try {
        // Try to use CI assets if available, fallback to regular assets
        const testAssetsCiPath = require('path').resolve(__dirname, './test-assets-ci');
        const ciModule = require(testAssetsCiPath);
        TEST_ASSETS_CI = ciModule.TEST_ASSETS_CI;
        ensureTestImagesExist = ciModule.ensureTestImagesExist;
        
        if (ensureTestImagesExist) {
          await ensureTestImagesExist();
        }
      } catch (e) {
        console.warn('Could not load CI test assets, falling back to regular assets:', e);
        TEST_ASSETS_CI = TEST_ASSETS; // Fallback to regular assets
      }
    }
    
    const uploadedImageNames: string[] = [];
    const uniqueId = Date.now();
    
    for (let i = 0; i < count; i++) {
      try {
        console.log(`Uploading test image ${i + 1} of ${count}...`);
        
        // Navigate to upload page
        await page.goto('/images/upload');
        await page.waitForLoadState('networkidle');
        
        // Generate unique image name
        const imageName = `E2E Test Image ${uniqueId}-${i + 1}`;
        
        // Use appropriate image path
        const imagePath = process.env.CI && TEST_ASSETS_CI
          ? (i === 0 ? TEST_ASSETS_CI.images.testImage1 : TEST_ASSETS_CI.images.testImage2)
          : (i === 0 ? TEST_ASSETS.images.testImage1 : TEST_ASSETS.images.testImage2);
        
        // Fill upload form
        await page.getByTestId('upload-file').setInputFiles(imagePath);
        await page.getByTestId('upload-title').fill(imageName);
        await page.getByTestId('upload-description').fill(`Test image ${i + 1} for E2E testing`);
        await page.getByTestId('upload-tags').fill('e2e, test, automation');
        
        // Submit form
        await page.getByTestId('upload-submit').click();
        
        // Wait for success indicators
        try {
          await Promise.race([
            page.getByText(/uploaded successfully/i).waitFor({ timeout: 15000 }),
            page.getByText(/upload complete/i).waitFor({ timeout: 15000 }),
            page.getByText(/image uploaded/i).waitFor({ timeout: 15000 }),
            page.waitForURL(url => !url.pathname.includes('/upload'), { timeout: 15000 })
          ]);
          
          uploadedImageNames.push(imageName);
          console.log(`Successfully uploaded: ${imageName}`);
        } catch (error) {
          console.warn(`Upload may have failed for image ${i + 1}:`, error);
          // Still add the name in case upload succeeded but success message didn't appear
          uploadedImageNames.push(imageName);
        }
      } catch (error) {
        console.error(`Failed to upload test image ${i + 1}:`, error);
      }
    }
    
    // Wait for database consistency after uploads with optimized wait
    console.log('Waiting for database consistency after uploads...');
    await OptimizedWaitHelpers.waitForNavigation(page);
    
    return uploadedImageNames;
  }
}
