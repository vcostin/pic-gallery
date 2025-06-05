import { Page } from '@playwright/test';

/**
 * Optimized wait helper functions for better test performance
 */
export class OptimizedWaitHelpers {
  /**
   * Wait for navigation to complete with optimized timeouts
   */
  static async waitForNavigation(page: Page, timeout: number = 10000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Fallback to domcontentloaded if networkidle fails
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    }
  }
}
