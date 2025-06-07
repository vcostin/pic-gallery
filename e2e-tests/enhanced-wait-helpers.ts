import { Page, Locator, expect } from '@playwright/test';

/**
 * Enhanced wait helpers for optimal E2E test performance
 * Replaces slow networkidle waits with targeted element/state-based waits
 */
export class EnhancedWaitHelpers {
  /**
   * Fast navigation wait - waits for specific page indicators instead of networkidle
   */
  static async waitForPageReady(page: Page, options: {
    url?: string | RegExp;
    selector?: string;
    timeout?: number;
  } = {}): Promise<void> {
    const { url, selector, timeout = 10000 } = options;

    try {
      // Wait for URL change if specified
      if (url) {
        await page.waitForURL(url, { timeout: Math.min(timeout, 5000) });
      }

      // Wait for specific selector if provided
      if (selector) {
        await page.waitForSelector(selector, { timeout: Math.min(timeout, 5000) });
      } else {
        // Default: wait for DOM to be ready (faster than networkidle)
        await page.waitForLoadState('domcontentloaded', { timeout: 3000 });
      }

      // Quick check for basic interactivity
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 }).catch(() => {
        // Continue if readyState check fails - page might still be usable
      });
    } catch (error) {
      console.warn(`⚠️ Page ready wait timed out: ${error}`);
      // Don't throw - let the test continue and fail on actual assertions if needed
    }
  }

  /**
   * Optimized authentication wait - checks for auth state without slow waits
   */
  static async waitForAuthState(page: Page, expectedAuth: boolean = true, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Quick check for auth indicators
        const hasLogoutButton = await page.getByTestId('logout-button').isVisible({ timeout: 500 }).catch(() => false);
        const hasLoginButton = await page.getByTestId('login-button').isVisible({ timeout: 500 }).catch(() => false);
        const currentUrl = page.url();
        
        const isAuthenticated = hasLogoutButton || 
          (currentUrl.includes('/galleries') || currentUrl.includes('/profile') || currentUrl.includes('/images'));
        
        if (isAuthenticated === expectedAuth) {
          return true;
        }
        
        // Short wait before retry
        await page.waitForTimeout(100);
      } catch {
        // Continue checking
      }
    }
    
    return false;
  }

  /**
   * Smart element wait - waits for element to be actionable, not just visible
   */
  static async waitForActionableElement(
    locator: Locator, 
    action: 'click' | 'fill' | 'hover' = 'click',
    timeout: number = 5000
  ): Promise<boolean> {
    try {
      switch (action) {
        case 'click':
          await expect(locator).toBeEnabled({ timeout });
          break;
        case 'fill':
          await expect(locator).toBeEditable({ timeout });
          break;
        case 'hover':
          await expect(locator).toBeVisible({ timeout });
          break;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gallery/grid content wait - waits for actual content, not just page load
   */
  static async waitForContentLoad(page: Page, options: {
    contentType: 'images' | 'galleries' | 'forms';
    minCount?: number;
    timeout?: number;
  }): Promise<boolean> {
    const { contentType, minCount = 1, timeout = 8000 } = options;
    
    let selector: string;
    switch (contentType) {
      case 'images':
        selector = '[data-testid="gallery-image"], .gallery-image, img[src*="/uploads/"]';
        break;
      case 'galleries':
        selector = '[data-testid="gallery-card"], .gallery-card';
        break;
      case 'forms':
        selector = 'form, [data-testid="form"]';
        break;
    }

    try {
      // Wait for at least minimum count of elements
      await page.waitForFunction(
        ({ selector, minCount }) => {
          const elements = document.querySelectorAll(selector);
          return elements.length >= minCount;
        },
        { selector, minCount },
        { timeout }
      );
      return true;
    } catch {
      // Check if any content loaded
      const elements = await page.locator(selector).count();
      return elements > 0;
    }
  }

  /**
   * Form submission wait - waits for form submission completion
   */
  static async waitForFormSubmission(page: Page, options: {
    successUrl?: string | RegExp;
    successSelector?: string;
    errorSelector?: string;
    timeout?: number;
  } = {}): Promise<'success' | 'error' | 'timeout'> {
    const { successUrl, successSelector, errorSelector, timeout = 10000 } = options;
    
    try {
      await Promise.race([
        // Wait for success URL
        successUrl ? page.waitForURL(successUrl, { timeout }) : Promise.reject(),
        // Wait for success indicator
        successSelector ? page.waitForSelector(successSelector, { timeout }) : Promise.reject(),
        // Wait for error indicator
        errorSelector ? page.waitForSelector(errorSelector, { timeout }).then(() => Promise.reject('error')) : Promise.reject(),
      ]);
      return 'success';
    } catch (result) {
      if (result === 'error') return 'error';
      return 'timeout';
    }
  }

  /**
   * Modal wait - optimized waiting for modals to appear/disappear
   */
  static async waitForModal(page: Page, state: 'open' | 'closed' = 'open', timeout: number = 3000): Promise<boolean> {
    const modalSelectors = [
      '[data-testid="modal"]',
      '[data-testid="image-modal"]', 
      '[data-testid="image-viewer-modal"]',
      '.modal',
      '[role="dialog"]'
    ];

    try {
      if (state === 'open') {
        await page.waitForSelector(modalSelectors.join(', '), { state: 'visible', timeout });
      } else {
        await page.waitForSelector(modalSelectors.join(', '), { state: 'hidden', timeout });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performance-aware wait with metrics
   */
  static async timedWait<T>(
    operation: () => Promise<T>,
    label: string,
    logPerformance: boolean = process.env.PLAYWRIGHT_PERF_LOG === 'true'
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      if (logPerformance) {
        const duration = Date.now() - startTime;
        console.log(`⏱️ ${label}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      if (logPerformance) {
        const duration = Date.now() - startTime;
        console.log(`❌ ${label} failed after ${duration}ms`);
      }
      throw error;
    }
  }

  /**
   * Batch wait operations for parallel execution
   */
  static async waitForMultiple(
    waits: Array<{
      operation: () => Promise<any>;
      label: string;
      required?: boolean;
    }>,
    timeout: number = 5000
  ): Promise<{ success: any[], failed: string[] }> {
    const results = await Promise.allSettled(
      waits.map(async ({ operation, label }) => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${label} timeout`)), timeout)
        );
        
        return Promise.race([operation(), timeoutPromise]);
      })
    );

    const success: any[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        failed.push(waits[index].label);
        if (waits[index].required) {
          throw new Error(`Required wait failed: ${waits[index].label}`);
        }
      }
    });

    return { success, failed };
  }
}
