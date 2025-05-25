import { Page } from '@playwright/test';

/**
 * Simplified helper functions for clean test execution
 */
export class SimpleHelpers {
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
   * Simple login without verbose logging
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
   * Clean up test data via API without verbose logging
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
}
