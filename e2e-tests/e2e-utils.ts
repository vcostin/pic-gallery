/**
 * E2E Test Utilities for Gallery Application
 * 
 * A streamlined collection of utilities for E2E testing with Playwright,
 * focusing on robust element selection and proper waiting strategies.
 */

import { Page, Locator, expect } from '@playwright/test';

/** Interface for basic element information */
interface ElementInfo {
  testId: string | null;
  tagName: string;
  id: string;
  className: string;
  text: string;
  isVisible: boolean;
}

/** Options for click operations */
type ClickWaitType = 'navigation' | 'modal' | 'toast' | string;

export class E2EUtils {
  /**
   * Wait for element to be visible and interactable
   */
  static async waitForElement(page: Page, selector: string, options?: { timeout?: number }): Promise<Locator> {
    const element = page.locator(selector);
    await expect(element).toBeVisible({ timeout: options?.timeout });
    return element;
  }

  /**
   * Wait for element to disappear from the DOM
   */
  static async waitForElementToDisappear(page: Page, selector: string, options?: { timeout?: number }): Promise<void> {
    const element = page.locator(selector);
    await expect(element).not.toBeVisible({ timeout: options?.timeout });
  }

  /**
   * Wait for page navigation to complete with optional URL verification
   */
  static async waitForNavigation(page: Page, expectedUrlPattern?: string | RegExp): Promise<void> {
    await page.waitForLoadState('networkidle');
    if (expectedUrlPattern) {
      await expect(page).toHaveURL(expectedUrlPattern);
    }
  }

  /**
   * Wait for modal to appear and be ready for interaction
   */
  static async waitForModal(page: Page, modalTestId?: string): Promise<Locator> {
    let selector: string;
    
    if (modalTestId) {
      selector = this.buildPrioritizedSelector(modalTestId, ['[role="dialog"]', '.modal']);
    } else {
      selector = '[data-testid*="modal"], [role="dialog"], .modal';
    }
    
    const modal = page.locator(selector);
    await expect(modal).toBeVisible();
    
    // Ensure modal content is ready
    const focusableElement = modal.locator('button, input, [tabindex="0"]').first();
    await expect(focusableElement).toBeVisible().catch(() => {
      // Modal might not have focusable elements - that's okay
    });
    
    return modal;
  }

  /**
   * Wait for form to be ready for interaction
   */
  static async waitForForm(page: Page, formTestId?: string): Promise<Locator> {
    let selector: string;
    
    if (formTestId) {
      selector = this.buildPrioritizedSelector(formTestId, ['form']);
    } else {
      selector = '[data-testid*="form"], form';
    }
    
    const form = page.locator(selector);
    await expect(form).toBeVisible();
    
    // Ensure form is not in loading state
    const loadingIndicators = form.locator('[disabled], .loading, .spinner');
    await expect(loadingIndicators).not.toBeVisible().catch(() => {
      // No loading indicators found - that's okay
    });
    
    return form;
  }

  /**
   * Wait for AJAX requests to complete by checking loading indicators
   */
  static async waitForAjaxComplete(page: Page): Promise<void> {
    const loadingSelectors = [
      '.loading',
      '.spinner', 
      '[data-testid="loading"]',
      '[aria-label*="loading"]',
      '.skeleton'
    ];
    
    for (const selector of loadingSelectors) {
      await expect(page.locator(selector)).not.toBeVisible().catch(() => {
        // Selector might not exist - that's okay
      });
    }
  }

  /**
   * Wait for toast notification with optional auto-dismiss waiting
   */
  static async waitForToast(
    page: Page, 
    options: { waitForDisappear?: boolean; timeout?: number; testId?: string } = {}
  ): Promise<Locator> {
    const { waitForDisappear = false, timeout = 5000, testId } = options;
    
    let toastSelectors: string[];
    
    if (testId) {
      toastSelectors = [
        `[data-testid="${testId}"]`,
        `[data-testid*="${testId}"]`,
        '[data-testid*="toast"]',
        '.toast',
        '[role="alert"]'
      ];
    } else {
      toastSelectors = [
        '[data-testid*="toast"]', 
        '.toast',
        '[role="alert"]',
        '.notification'
      ];
    }
    
    let toast: Locator | null = null;
    for (const selector of toastSelectors) {
      try {
        toast = page.locator(selector);
        await expect(toast).toBeVisible({ timeout: 2000 });
        break;
      } catch {
        continue;
      }
    }
    
    if (!toast) {
      throw new Error('Toast notification not found');
    }
    
    if (waitForDisappear) {
      await expect(toast).not.toBeVisible({ timeout });
    }
    
    return toast;
  }

  /**
   * Check if user is authenticated using multiple detection strategies
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const authIndicators = [
      '[data-testid="logout-button"]',
      '[data-testid="user-menu"]', 
      '.user-profile',
      'text=/logout/i',
      'text=/sign out/i'
    ];
    
    for (const indicator of authIndicators) {
      try {
        await expect(page.locator(indicator)).toBeVisible({ timeout: 1000 });
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Wait for gallery to be fully loaded with content or empty state
   */
  static async waitForGalleryLoad(page: Page, galleryTestId?: string): Promise<void> {
    // Wait for page to be ready first
    await page.waitForLoadState('domcontentloaded');
    
    let gallerySelector: string;
    
    if (galleryTestId) {
      gallerySelector = this.buildPrioritizedSelector(galleryTestId, ['.gallery', '[role="main"]']);
    } else {
      // Updated selectors to match actual galleries page structure
      gallerySelector = '[data-testid="gallery-item"], [data-testid="create-gallery-button"], .container, [role="main"]';
    }
    
    // Wait for gallery container - use first() to avoid strict mode violations
    await expect(page.locator(gallerySelector).first()).toBeVisible();
    
    // Wait for gallery content to be ready
    await this.waitForGalleryContent(page);
  }

  /**
   * Wait for gallery content (images or empty state) to be displayed
   */
  static async waitForGalleryContent(page: Page): Promise<void> {
    const contentSelectors = [
      '[data-testid="gallery-item"]',        // Individual gallery cards
      '[data-testid="create-gallery-button"]', // Button when no galleries
      '[data-testid="gallery-content"]',
      '[data-testid*="gallery-images"]', 
      '[data-testid="empty-gallery-state"]',
      '.gallery-images',
      '.empty-state'
    ];
    
    const textPatterns = [
      'text=/no images/i',
      'text=/empty gallery/i', 
      'text=/no photos/i',
      'text=/doesn\'t have any galleries/i',
      'text=/Create your first gallery/i',
      'text=/doesn\'t have any images/i'
    ];
    
    // Try content selectors first
    for (const selector of contentSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        return;
      } catch {
        continue;
      }
    }
    
    // Try empty state text patterns
    for (const pattern of textPatterns) {
      try {
        await expect(page.locator(pattern)).toBeVisible({ timeout: 2000 });
        return;
      } catch {
        continue;
      }
    }
    
    throw new Error('Gallery content not found - neither images nor empty state detected');
  }

  /**
   * Enhanced click with automatic waiting for common post-click states
   */
  static async clickAndWait(
    element: Locator,
    page: Page, 
    waitFor: ClickWaitType = 'navigation'
  ): Promise<void> {
    await expect(element).toBeEnabled();
    await element.click();
    
    switch (waitFor) {
      case 'navigation':
        await page.waitForLoadState('networkidle');
        break;
      case 'modal':
        await this.waitForModal(page);
        break;
      case 'toast':
        await this.waitForToast(page);
        break;
      default:
        await expect(page.locator(waitFor)).toBeVisible();
    }
  }

  /**
   * Fill form field with validation
   */
  static async fillAndValidate(page: Page, selector: string, value: string): Promise<void> {
    const field = page.locator(selector);
    await expect(field).toBeVisible();
    await expect(field).toBeEnabled();
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Build selector with data-testid priority
   */
  static buildPrioritizedSelector(testId?: string, fallbackSelectors: string[] = []): string {
    const selectors: string[] = [];
    
    if (testId) {
      selectors.push(`[data-testid="${testId}"]`);
      selectors.push(`[data-testid*="${testId}"]`);
    }
    
    if (fallbackSelectors.length > 0) {
      selectors.push(...fallbackSelectors);
    }
    
    return selectors.join(', ');
  }

  /**
   * Wait for element using data-testid with fallback selectors
   */
  static async waitForElementByTestId(
    page: Page,
    testId: string,
    fallbackSelectors: string[] = [],
    options?: { timeout?: number }
  ): Promise<Locator> {
    const selector = this.buildPrioritizedSelector(testId, fallbackSelectors);
    return this.waitForElement(page, selector, options);
  }

  /**
   * Find element with data-testid priority, returning first match
   */
  static async findElementWithPriority(
    page: Page,
    testId?: string,
    fallbackSelectors: string[] = [],
    textPatterns: string[] = []
  ): Promise<Locator | null> {
    // Try data-testid first
    if (testId) {
      const exactSelector = `[data-testid="${testId}"]`;
      if (await page.locator(exactSelector).count() > 0) {
        return page.locator(exactSelector).first();
      }
      
      const partialSelector = `[data-testid*="${testId}"]`;
      if (await page.locator(partialSelector).count() > 0) {
        return page.locator(partialSelector).first();
      }
    }
    
    // Try CSS fallback selectors
    const cssSelectors = fallbackSelectors.filter(s => !s.startsWith('text='));
    for (const selector of cssSelectors) {
      if (await page.locator(selector).count() > 0) {
        return page.locator(selector).first();
      }
    }
    
    // Try text patterns
    for (const pattern of textPatterns) {
      if (await page.locator(pattern).count() > 0) {
        return page.locator(pattern).first();
      }
    }
    
    return null;
  }

  /**
   * Click element by data-testid with fallback selectors
   */
  static async clickByTestId(
    page: Page,
    testId: string,
    fallbackSelectors: string[] = [],
    waitFor: ClickWaitType = 'navigation'
  ): Promise<void> {
    const element = await this.waitForElementByTestId(page, testId, fallbackSelectors);
    await this.clickAndWait(element, page, waitFor);
  }

  /**
   * Fill form field by data-testid with fallback selectors  
   */
  static async fillByTestId(
    page: Page,
    testId: string,
    value: string,
    fallbackSelectors: string[] = []
  ): Promise<void> {
    const selector = this.buildPrioritizedSelector(testId, fallbackSelectors);
    await this.fillAndValidate(page, selector, value);
  }

  /**
   * Validate that expected data-testid attributes exist (simplified)
   */
  static async validateTestIds(
    page: Page,
    expectedTestIds: string[]
  ): Promise<{ valid: string[]; missing: string[] }> {
    const valid: string[] = [];
    const missing: string[] = [];
    
    for (const testId of expectedTestIds) {
      const count = await page.locator(`[data-testid="${testId}"]`).count();
      if (count > 0) {
        valid.push(testId);
      } else {
        missing.push(testId);
      }
    }
    
    return { valid, missing };
  }

  /**
   * Get all elements with data-testid attributes (simplified debugging)
   */
  static async getAllTestIds(page: Page): Promise<ElementInfo[]> {
    return page.locator('[data-testid]').evaluateAll(elements =>
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName.toLowerCase(),
          id: (el as HTMLElement).id,
          className: (el as HTMLElement).className,
          text: el.textContent?.slice(0, 50) || '',
          isVisible: rect.width > 0 && rect.height > 0
        };
      })
    );
  }

  /**
   * Simple page readiness check
   */
  static async isPageReady(page: Page): Promise<boolean> {
    try {
      await page.waitForLoadState('domcontentloaded');
      const hasBody = await page.locator('body').count() > 0;
      return hasBody;
    } catch {
      return false;
    }
  }
}
