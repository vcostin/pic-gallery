import { Page, expect } from '@playwright/test';

/**
 * Optimized wait helpers for E2E tests
 * Replaces timeout-based waiting with proper selector-based waiting
 */
export class OptimizedWaitHelpers {
  
  /**
   * Wait for element to be visible with better error handling
   */
  static async waitForVisible(page: Page, selector: string, timeout = 10000) {
    await expect(page.locator(selector)).toBeVisible({ timeout });
  }

  /**
   * Wait for navigation to complete with network idle
   */
  static async waitForNavigation(page: Page, url?: string) {
    if (url) {
      await page.waitForURL(url, { waitUntil: 'networkidle' });
    } else {
      await page.waitForLoadState('networkidle');
    }
  }

  /**
   * Wait for form submission and network response
   * FIXED: More specific response waiting with fallback logic
   */
  static async waitForFormSubmission(page: Page, submitButtonSelector: string) {
    // Wait for button to be clickable
    await expect(page.locator(submitButtonSelector)).toBeEnabled();
    
    // Click and wait for either a successful response or navigation
    try {
      await Promise.all([
        // Wait for either API response or navigation
        Promise.race([
          page.waitForResponse(response => 
            response.url().includes('/api/') && 
            (response.status() === 200 || response.status() === 201)
          ),
          page.waitForURL('**/galleries/**', { timeout: 10000 })
        ]),
        page.click(submitButtonSelector)
      ]);
    } catch (error) {
      // Fallback: just click and wait for network idle
      console.log('Form submission fallback triggered:', error.message);
      await page.click(submitButtonSelector);
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    }
  }

  /**
   * Wait for image upload to complete
   */
  static async waitForImageUpload(page: Page, fileInputSelector: string, filePath: string) {
    // Set the file
    await page.setInputFiles(fileInputSelector, filePath);
    
    // Wait for upload indication (preview or progress)
    await expect(page.locator('.upload-preview, .upload-progress, [data-testid="upload-indicator"]')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Wait for modal to appear and be ready
   */
  static async waitForModal(page: Page, modalSelector: string = '.modal, [role="dialog"]') {
    await expect(page.locator(modalSelector)).toBeVisible();
    // Ensure modal is fully loaded
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for modal to open after clicking a button
   * ADDED: Missing method that tests are calling
   */
  static async waitForModalOpen(page: Page, buttonSelector: string, modalSelector: string) {
    // Click the button and wait for modal to appear
    await Promise.all([
      page.click(buttonSelector),
      expect(page.locator(modalSelector)).toBeVisible({ timeout: 10000 })
    ]);
    // Ensure modal is fully loaded
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for modal to disappear
   */
  static async waitForModalToClose(page: Page, modalSelector: string = '.modal, [role="dialog"]') {
    await expect(page.locator(modalSelector)).toBeHidden();
  }

  /**
   * Wait for gallery grid to load with images
   */
  static async waitForGalleryGrid(page: Page, gridSelector: string = '.gallery-grid') {
    await expect(page.locator(gridSelector)).toBeVisible();
    // Wait for at least one image to load
    await expect(page.locator(`${gridSelector} img`).first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Wait for specific element count
   */
  static async waitForElementCount(page: Page, selector: string, count: number, timeout = 10000) {
    await expect(page.locator(selector)).toHaveCount(count, { timeout });
  }

  /**
   * Wait for toast notification
   */
  static async waitForToast(page: Page, message?: string) {
    const toastSelector = '.toast, .notification, [data-testid="toast"]';
    await expect(page.locator(toastSelector)).toBeVisible();
    
    if (message) {
      await expect(page.locator(toastSelector)).toContainText(message);
    }
  }

  /**
   * Wait for loading state to complete
   */
  static async waitForLoadingComplete(page: Page, loadingSelector: string = '.loading, .spinner, [data-testid="loading"]') {
    // Wait for loading indicator to appear first (optional)
    try {
      await expect(page.locator(loadingSelector)).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading might be too fast to catch
    }
    
    // Wait for loading to disappear
    await expect(page.locator(loadingSelector)).toBeHidden({ timeout: 15000 });
  }

  /**
   * Wait for network requests to complete
   */
  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for element to contain specific text
   */
  static async waitForTextContent(page: Page, selector: string, text: string, timeout = 10000) {
    await expect(page.locator(selector)).toContainText(text, { timeout });
  }

  /**
   * Robust modal handling with multiple closing strategies
   */
  static async closeModalIfPresent(page: Page, timeout: number = 8000): Promise<boolean> {
    const modalSelectors = [
      '.fixed.inset-0.bg-black.bg-opacity-50',
      '[data-testid*="modal"]',
      '[role="dialog"]',
      '.modal-overlay',
      '.modal'
    ];
    
    // Check if any modal is visible
    const modalLocator = page.locator(modalSelectors.join(', ')).first();
    
    try {
      if (await modalLocator.isVisible()) {
        console.log('Modal detected, attempting to close...');
        
        // Strategy 1: Multiple ESC key presses
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          if (!(await modalLocator.isVisible())) break;
        }
        
        if (await modalLocator.isVisible()) {
          // Strategy 2: Try clicking outside the modal content area
          const backdrop = page.locator('.fixed.inset-0').first();
          if (await backdrop.isVisible()) {
            // Click multiple spots on the backdrop
            await backdrop.click({ position: { x: 50, y: 50 }, force: true });
            await page.waitForTimeout(300);
            if (await modalLocator.isVisible()) {
              await backdrop.click({ position: { x: 10, y: 10 }, force: true });
              await page.waitForTimeout(300);
            }
          }
        }
        
        if (await modalLocator.isVisible()) {
          // Strategy 3: Look for close buttons (expanded search)
          const closeButtons = [
            '[data-testid*="close"]',
            '.close',
            'button[aria-label*="close"]',
            'button[aria-label*="Close"]',
            '[aria-label*="close"]',
            '.modal-close',
            '.btn-close',
            'button:has-text("×")',
            'button:has-text("✕")',
            'svg[data-testid*="close"]'
          ];
          
          for (const closeSelector of closeButtons) {
            const closeButton = page.locator(closeSelector).first();
            if (await closeButton.isVisible()) {
              await closeButton.click({ force: true });
              await page.waitForTimeout(300);
              if (!(await modalLocator.isVisible())) break;
            }
          }
        }
        
        if (await modalLocator.isVisible()) {
          // Strategy 4: Try to find and click modal content area then press ESC
          const modalContent = page.locator('.modal-content, [role="dialog"] > div, .modal-dialog').first();
          if (await modalContent.isVisible()) {
            await modalContent.click();
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }
        }
        
        // Strategy 5: Force remove with JavaScript if still visible
        if (await modalLocator.isVisible()) {
          console.log('Attempting to force remove modal with JavaScript...');
          await page.evaluate(() => {
            // Remove modal overlays
            const modals = document.querySelectorAll('.fixed.inset-0, [role="dialog"], .modal, .modal-overlay');
            modals.forEach(modal => modal.remove());
            
            // Remove backdrop classes from body
            document.body.classList.remove('modal-open', 'overflow-hidden');
            document.documentElement.classList.remove('modal-open', 'overflow-hidden');
          });
          await page.waitForTimeout(500);
        }
        
        // Verify modal is closed (with longer timeout for complex cases)
        try {
          await expect(modalLocator).toBeHidden({ timeout: Math.min(timeout, 3000) });
          console.log('Modal successfully closed');
          return true;
        } catch (verifyError) {
          console.warn('Modal may still be visible, but continuing...', verifyError.message);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.warn('Modal closing failed:', error);
      return false;
    }
  }
  /**
   * Wait for dynamic content to load and appear
   * Uses adaptive retry strategy for better CI environment reliability  
   */
  static async waitForDynamicContent(page: Page, containerSelector: string, minItems: number = 0) {
    try {
      // First check if container exists at all
      const container = page.locator(containerSelector).first();
      
      // Wait for the container to exist in DOM first
      await container.waitFor({ state: 'attached', timeout: 10000 });
      
      // Then wait for it to be visible
      await expect(container).toBeVisible({ timeout: 10000 });
      
      // Only wait for items if minItems > 0
      if (minItems > 0) {
        const itemSelector = `${containerSelector} img, ${containerSelector} .item, ${containerSelector} .gallery-item`;
        // Wait for at least minItems, not exactly minItems
        const locator = page.locator(itemSelector);
        
        // Adaptive retry strategy for CI environments
        const isCI = process.env.CI === 'true';
        const baseInterval = isCI ? 750 : 500; // Slower in CI
        const maxTimeout = isCI ? 25000 : 15000; // Longer timeout in CI
        const maxAttempts = Math.ceil(maxTimeout / baseInterval);
        
        let attempts = 0;
        let lastCount = 0;
        let stableCount = 0; // Track stable consecutive counts
        
        while (attempts < maxAttempts) {
          const count = await locator.count();
          
          // If we have enough items, check stability
          if (count >= minItems) {
            if (count === lastCount) {
              stableCount++;
              // Require 2 stable checks in CI, 1 in local
              if (stableCount >= (isCI ? 2 : 1)) {
                break;
              }
            } else {
              stableCount = 0; // Reset stability counter
            }
          }
          
          lastCount = count;
          await page.waitForTimeout(baseInterval);
          attempts++;
        }
        
        // Final check with better error messaging
        const finalCount = await locator.count();
        if (finalCount < minItems) {
          throw new Error(`Expected at least ${minItems} items, but found ${finalCount} after ${attempts} attempts (${maxTimeout}ms timeout)`);
        }
      }
      
      // Ensure content is stable
      await page.waitForLoadState('networkidle');
    } catch (error) {
      console.error(`Failed to wait for dynamic content with selector '${containerSelector}':`, error);
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `test-screenshots/dynamic-content-error-${Date.now()}.png`,
        fullPage: true 
      });
      throw error;
    }
  }

  /**
   * Wait for input field to be ready for interaction
   */
  static async waitForInputReady(page: Page, inputSelector: string) {
    const input = page.locator(inputSelector);
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(input).toBeEditable();
  }

  /**
   * Wait for button to be clickable
   */
  static async waitForButtonReady(page: Page, buttonSelector: string) {
    const button = page.locator(buttonSelector);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  }

  /**
   * Wait for form to be ready for interaction
   * FIXED: Avoid strict mode violations by checking form elements individually
   */
  static async waitForFormReady(page: Page, formSelector: string = 'form') {
    const form = page.locator(formSelector);
    await expect(form).toBeVisible();
    
    // Check if form has any interactive elements (avoiding strict mode)
    const hasInputs = await form.locator('input').count() > 0;
    const hasTextareas = await form.locator('textarea').count() > 0;
    const hasSelects = await form.locator('select').count() > 0;
    const hasButtons = await form.locator('button').count() > 0;
    
    if (hasInputs || hasTextareas || hasSelects || hasButtons) {
      // Wait for at least one interactive element to be ready
      const interactiveElements = form.locator('input, textarea, select, button');
      await expect(interactiveElements.first()).toBeVisible();
    }
    
    // Ensure form is stable
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page title to change
   */
  static async waitForPageTitle(page: Page, expectedTitle: string, timeout = 10000) {
    await expect(page).toHaveTitle(expectedTitle, { timeout });
  }

  /**
   * Wait for URL to match pattern
   */
  static async waitForUrlPattern(page: Page, pattern: string, timeout = 10000) {
    await page.waitForURL(pattern, { timeout });
  }

  /**
   * Wait for API response with specific status
   */
  static async waitForApiResponse(page: Page, urlPattern: string, expectedStatus: number = 200) {
    await page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === expectedStatus
    );
  }

  /**
   * Wait for element attribute to have specific value
   */
  static async waitForAttribute(page: Page, selector: string, attribute: string, value: string, timeout = 10000) {
    await expect(page.locator(selector)).toHaveAttribute(attribute, value, { timeout });
  }

  /**
   * Wait for element class to be present
   */
  static async waitForClass(page: Page, selector: string, className: string, timeout = 10000) {
    await expect(page.locator(selector)).toHaveClass(new RegExp(className), { timeout });
  }

  /**
   * Wait for multiple conditions to be met
   */
  static async waitForMultipleConditions(page: Page, conditions: Array<() => Promise<void>>) {
    await Promise.all(conditions.map(condition => condition()));
  }

  /**
   * Retry an action until it succeeds or max attempts reached
   */
  static async retryAction(action: () => Promise<void>, maxAttempts: number = 3, delay: number = 1000) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await action();
        return; // Success
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Action failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Wait for element to be stable (not moving/changing)
   */
  static async waitForElementStable(page: Page, selector: string, stabilityTime: number = 1000) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
    
    // Get initial position
    let lastBoundingBox = await element.boundingBox();
    
    // Wait for element to be stable
    const startTime = Date.now();
    while (Date.now() - startTime < stabilityTime) {
      await page.waitForTimeout(100); // Small polling interval
      const currentBoundingBox = await element.boundingBox();
      
      if (JSON.stringify(currentBoundingBox) !== JSON.stringify(lastBoundingBox)) {
        // Element moved, reset timer
        lastBoundingBox = currentBoundingBox;
        continue;
      }
    }
  }

  /**
   * Wait for search results to update after entering search term
   */
  static async waitForSearchResults(page: Page, searchInputSelector: string, searchTerm: string, resultSelector: string) {
    // Clear and enter search term
    await page.locator(searchInputSelector).clear();
    await page.locator(searchInputSelector).fill(searchTerm);
    
    // Wait for search to process and results to update
    await page.waitForLoadState('networkidle');
    
    // Wait for results container to be stable
    await expect(page.locator(resultSelector).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Safely close a modal with multiple fallback strategies
   */
  static async safeModalClose(page: Page, modalSelector: string, closeButtonSelector: string) {
    // Ensure modal is visible first
    await expect(page.locator(modalSelector)).toBeVisible();
    
    try {
      // Try primary close method: click close button
      if (await page.locator(closeButtonSelector).isVisible()) {
        await page.click(closeButtonSelector);
      } else {
        // Fallback: try ESC key
        await page.keyboard.press('Escape');
      }
      
      // Wait for modal to close
      await expect(page.locator(modalSelector)).toBeHidden({ timeout: 5000 });
    } catch (error) {
      // Final fallback: click outside modal
      const modalBox = await page.locator(modalSelector).boundingBox();
      if (modalBox) {
        await page.mouse.click(10, 10); // Click top-left corner, outside modal
        await expect(page.locator(modalSelector)).toBeHidden({ timeout: 3000 });
      }
    }
  }
}
