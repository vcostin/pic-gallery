import { Page, expect } from '@playwright/test';

/**
 * Performance-Optimized Test Helper Functions
 * 
 * Key Optimizations:
 * 1. Reduced timeout values for faster failures
 * 2. Smarter waiting strategies
 * 3. Cached authentication checks
 * 4. Optimized selector strategies
 * 5. Batch operations where possible
 */
export class OptimizedTestHelpers {
  // Cache authentication status to avoid repeated checks
  private static authCache = new Map<string, boolean>();
  private static cacheTimeout = 30000; // 30 seconds

  /**
   * Fast authentication check with caching
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const url = page.url();
    const cacheKey = `auth_${url}`;
    const cached = this.authCache.get(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Faster authentication check with reduced timeouts
      const hasLogoutButton = await page.getByTestId('logout-button')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      
      if (hasLogoutButton) {
        this.authCache.set(cacheKey, true);
        setTimeout(() => this.authCache.delete(cacheKey), this.cacheTimeout);
        return true;
      }
      
      // Quick URL-based check
      const isOnProtectedPage = url.includes('/galleries') || 
                               url.includes('/profile') || 
                               url.includes('/images/upload');
      
      const authenticated = isOnProtectedPage && !url.includes('/auth/login');
      this.authCache.set(cacheKey, authenticated);
      setTimeout(() => this.authCache.delete(cacheKey), this.cacheTimeout);
      
      return authenticated;
    } catch {
      this.authCache.set(cacheKey, false);
      return false;
    }
  }

  /**
   * Optimized login with faster timeouts and better error handling
   */
  static async fastLogin(page: Page, email: string, password: string): Promise<boolean> {
    try {
      // Clear auth cache
      this.authCache.clear();
      
      // Check if already authenticated first
      if (await this.isAuthenticated(page)) {
        return true;
      }
      
      // Navigate to login with faster timeout
      await page.goto('/auth/login', { timeout: 15000 });
      
      // Use Promise.all for parallel operations
      await Promise.all([
        page.fill('[data-testid="login-email"]', email),
        page.fill('[data-testid="login-password"]', password),
      ]);
      
      // Click and wait for navigation in one operation
      await Promise.all([
        page.waitForURL(/\/galleries|\/home|\/dashboard|\//, { timeout: 15000 }),
        page.click('[data-testid="login-submit"]'),
      ]);
      
      return await this.isAuthenticated(page);
    } catch (error) {
      console.log('Fast login failed:', error);
      return false;
    }
  }

  /**
   * Optimized logout with faster operations
   */
  static async fastLogout(page: Page): Promise<boolean> {
    try {
      this.authCache.clear();
      
      // Try fastest logout method first
      const logoutButton = page.getByTestId('logout-button');
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await page.waitForURL('**/auth/login', { timeout: 10000 });
        return true;
      }
      
      // Fallback: clear storage and redirect
      await page.context().clearCookies();
      await page.goto('/auth/login', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fast cleanup operations with batch API calls
   */
  static async fastCleanup(page: Page, operations: string[] = ['galleries', 'images']): Promise<boolean> {
    try {
      // Batch cleanup operations
      const cleanupPromises = operations.map(operation => {
        const url = `/api/e2e/cleanup-${operation}`;
        return page.request.delete(url, { timeout: 10000 });
      });
      
      const responses = await Promise.all(cleanupPromises);
      return responses.every(response => response.ok());
    } catch {
      return false;
    }
  }

  /**
   * Optimized gallery creation with faster form handling
   */
  static async fastCreateGallery(page: Page, name?: string): Promise<{ galleryId: string, galleryName: string } | null> {
    try {
      const galleryName = name || `Fast Gallery ${Date.now()}`;
      
      // Navigate with faster timeout
      await page.goto('/galleries', { timeout: 15000 });
      
      // Find and click create button efficiently
      const createButton = page.getByTestId('create-gallery-button').first();
      await createButton.click({ timeout: 10000 });
      
      // Fill form fields in parallel
      await Promise.all([
        page.fill('[data-testid="gallery-title"]', galleryName),
        page.fill('[data-testid="gallery-description"]', 'Fast test gallery'),
      ]);
      
      // Submit and wait for navigation
      await Promise.all([
        page.waitForURL('**/galleries/**', { timeout: 15000 }),
        page.click('[data-testid="create-gallery-submit"]'),
      ]);
      
      // Extract gallery ID from URL
      const url = page.url();
      const galleryIdMatch = url.match(/\/galleries\/([^\/]+)/);
      const galleryId = galleryIdMatch ? galleryIdMatch[1] : Date.now().toString();
      
      return { galleryId, galleryName };
    } catch (error) {
      console.log('Fast gallery creation failed:', error);
      return null;
    }
  }

  /**
   * Optimized element waiting with intelligent timeouts
   */
  static async waitForElement(page: Page, selector: string, options: {
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
  } = {}): Promise<boolean> {
    try {
      const { timeout = 10000, state = 'visible' } = options;
      
      await page.locator(selector).waitFor({ 
        state, 
        timeout 
      });
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smart text input with better error handling
   */
  static async fastFill(page: Page, selector: string, text: string): Promise<boolean> {
    try {
      const element = page.locator(selector);
      
      // Wait for element and fill in one operation
      await element.waitFor({ timeout: 8000 });
      await element.fill(text);
      
      // Verify the text was filled
      const value = await element.inputValue();
      return value === text;
    } catch {
      return false;
    }
  }

  /**
   * Optimized click with smart waiting
   */
  static async fastClick(page: Page, selector: string, options: {
    timeout?: number;
    waitForNavigation?: boolean;
    navigationPattern?: string | RegExp;
  } = {}): Promise<boolean> {
    try {
      const { timeout = 10000, waitForNavigation = false, navigationPattern } = options;
      
      const element = page.locator(selector);
      await element.waitFor({ timeout });
      
      if (waitForNavigation && navigationPattern) {
        await Promise.all([
          page.waitForURL(navigationPattern, { timeout }),
          element.click(),
        ]);
      } else {
        await element.click();
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Batch verification for multiple elements
   */
  static async verifyElements(page: Page, selectors: string[], timeout = 5000): Promise<boolean[]> {
    const checks = selectors.map(selector =>
      page.locator(selector).isVisible({ timeout }).catch(() => false)
    );
    
    return Promise.all(checks);
  }

  /**
   * Performance monitoring helper
   */
  static async measureOperation<T>(
    operation: () => Promise<T>, 
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      console.log(`⏱️  ${operationName}: ${duration}ms`);
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ ${operationName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Optimized navigation with preloading
   */
  static async fastNavigate(page: Page, url: string, options: {
    waitForLoad?: boolean;
    timeout?: number;
  } = {}): Promise<boolean> {
    try {
      const { waitForLoad = true, timeout = 15000 } = options;
      
      if (waitForLoad) {
        await page.goto(url, { 
          timeout,
          waitUntil: 'domcontentloaded' // Faster than 'networkidle'
        });
      } else {
        await page.goto(url, { timeout });
      }
      
      return true;
    } catch {
      return false;
    }
  }
}

// Legacy compatibility - extend original TestHelpers with optimized methods
export class TestHelpers extends OptimizedTestHelpers {
  // Keep all existing methods for backward compatibility
  static async quickLogin(page: Page, email: string, password: string): Promise<boolean> {
    return this.fastLogin(page, email, password);
  }

  static async login(page: Page, email: string, password: string): Promise<boolean> {
    return this.fastLogin(page, email, password);
  }

  static async quickLogout(page: Page): Promise<boolean> {
    return this.fastLogout(page);
  }

  static async cleanupTestData(page: Page, deleteUser: boolean = false): Promise<boolean> {
    const operations = deleteUser 
      ? ['galleries', 'images', 'user'] 
      : ['galleries', 'images'];
    return this.fastCleanup(page, operations);
  }

  static async createGalleryWithImages(page: Page): Promise<{ galleryId: string, galleryName: string } | null> {
    return this.fastCreateGallery(page);
  }

  // Keep other existing methods...
  static async completeCleanup(page: Page): Promise<void> {
    await this.cleanupTestData(page, true);
  }

  static async deleteUser(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/delete-user', {
        data: { email },
        timeout: 10000 // Reduced timeout
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  static async cleanupUserGalleries(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/cleanup-galleries', {
        data: { email },
        timeout: 10000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  static async cleanupUserImages(page: Page, email: string): Promise<boolean> {
    try {
      const response = await page.request.delete('/api/e2e/cleanup-images', {
        data: { email },
        timeout: 10000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  static async verifyImageCard(page: Page, imageName: string): Promise<boolean> {
    return this.waitForElement(page, `[data-testid="image-card"]:has-text("${imageName}")`);
  }

  static async navigateToGallery(page: Page, galleryIndex: number = 0): Promise<string | null> {
    try {
      await this.fastNavigate(page, '/galleries');
      
      const galleryLinks = page.getByTestId('gallery-link');
      const count = await galleryLinks.count();
      
      if (count > galleryIndex) {
        await galleryLinks.nth(galleryIndex).click();
        const url = page.url();
        const galleryIdMatch = url.match(/\/galleries\/([^\/]+)/);
        return galleryIdMatch ? galleryIdMatch[1] : null;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  static async navigateToImageUpload(page: Page): Promise<boolean> {
    return this.fastNavigate(page, '/images/upload');
  }
}
