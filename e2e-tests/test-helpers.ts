import { Page } from '@playwright/test';

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
      
      // Wait for navigation or error
      await page.waitForTimeout(2000);
      
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
            await page.waitForTimeout(1000);
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
        await page.fill('[data-testid="gallery-name"]', galleryName);
        await page.fill('[data-testid="gallery-description"]', 'Test gallery description');
        
        // Submit form
        await page.click('[data-testid="create-gallery-submit"]');
        await page.waitForTimeout(2000);
        
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
}
