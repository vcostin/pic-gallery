# E2E Testing: data-testid Debugging Guide

## Overview

This guide provides strategies for debugging E2E tests when `data-testid` elements are unavailable, have different values, or exhibit unexpected behavior. It covers common scenarios, debugging techniques, and robust selector strategies using the streamlined E2E utilities framework.

## Table of Contents

1. [Common data-testid Issues](#common-data-testid-issues)
2. [Debugging Strategies](#debugging-strategies)
3. [Fallback Selector Patterns](#fallback-selector-patterns)
4. [Using the Streamlined E2EUtils](#using-the-streamlined-e2eutils-helper)
5. [Best Practices](#best-practices)
6. [Demo Test and Validation](#demo-test-and-validation)
7. [Integration Examples](#integration-examples)

## Common data-testid Issues

### 1. Element Not Found with Expected data-testid

**Symptoms:**
- Test fails with "Element not found" error
- `getByTestId('expected-id')` returns empty locator
- Element exists visually but test can't find it

**Common Causes:**
- Component hasn't rendered yet (React/async issues)
- data-testid value changed during development
- Element is conditionally rendered based on state
- Element is inside a modal/dialog that hasn't opened
- Element is dynamically generated with different IDs

### 2. data-testid Values Different Than Expected

**Symptoms:**
- Element found but with unexpected ID format
- Dynamic IDs (e.g., `gallery-item-123` instead of `gallery-item`)
- ID prefix/suffix changes based on environment

**Common Causes:**
- Dynamic ID generation (timestamps, UUIDs, etc.)
- Environment-specific prefixes
- Component refactoring changed naming convention
- Conditional ID assignment based on props

### 3. Multiple Elements with Same data-testid

**Symptoms:**
- Test clicks wrong element
- Ambiguous element selection
- Inconsistent test behavior

**Common Causes:**
- List items sharing same base ID
- Component reuse without unique identifiers
- Missing dynamic ID generation

## Debugging Strategies

### 1. DOM Inspection in Tests

Use Playwright's evaluation capabilities to inspect the actual DOM:

```typescript
// Inspect all data-testid attributes in current page
const testIds = await page.evaluate(() => {
  const elements = document.querySelectorAll('[data-testid]');
  return Array.from(elements).map(el => ({
    testId: el.getAttribute('data-testid'),
    tagName: el.tagName,
    textContent: el.textContent?.slice(0, 50),
    visible: el.offsetParent !== null,
    className: el.className
  }));
});
console.log('Available test IDs:', testIds);
```

### 2. Wait for Dynamic Content

When elements are dynamically loaded:

```typescript
// Wait for element to appear with custom timeout
async function waitForTestId(page: Page, testId: string, timeout = 10000) {
  try {
    await page.waitForSelector(`[data-testid="${testId}"]`, { 
      timeout,
      state: 'visible' 
    });
    return true;
  } catch (error) {
    console.log(`Element with data-testid="${testId}" not found within ${timeout}ms`);
    return false;
  }
}

// Usage
const elementFound = await waitForTestId(page, 'gallery-item');
if (!elementFound) {
  // Implement fallback strategy
}
```

### 3. Progressive Selector Strategy

Try multiple selector strategies in order of preference:

```typescript
async function findElement(page: Page, selectors: SelectorStrategy[]) {
  for (const strategy of selectors) {
    try {
      const element = page.locator(strategy.selector);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`Found element using: ${strategy.description}`);
        return element;
      }
    } catch (error) {
      console.log(`Strategy failed: ${strategy.description}`);
      continue;
    }
  }
  throw new Error('Element not found with any strategy');
}

// Example usage
const element = await findElement(page, [
  { selector: '[data-testid="gallery-title"]', description: 'data-testid' },
  { selector: 'input[placeholder*="title"]', description: 'placeholder attribute' },
  { selector: 'input[name="title"]', description: 'name attribute' },
  { selector: 'h1, h2, h3', description: 'heading elements' }
]);
```

## Fallback Selector Patterns

### 1. Hierarchical Fallback Strategy

```typescript
class RobustSelector {
  static async findGalleryItem(page: Page, itemName?: string) {
    const strategies = [
      // Primary: Specific data-testid
      () => page.getByTestId('gallery-item'),
      
      // Secondary: data-testid with text filter
      () => itemName ? 
        page.getByTestId('gallery-item').filter({ hasText: itemName }) :
        page.getByTestId('gallery-item'),
      
      // Tertiary: Partial data-testid match
      () => page.locator('[data-testid^="gallery-item"]'),
      
      // Quaternary: Role-based with text
      () => itemName ? 
        page.getByRole('article').filter({ hasText: itemName }) :
        page.getByRole('article'),
      
      // Fallback: CSS class patterns
      () => page.locator('.gallery-item, .gallery-card'),
      
      // Last resort: Generic container
      () => page.locator('[class*="gallery"] [class*="item"]')
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        const element = strategy();
        if (await element.count() > 0 && await element.first().isVisible()) {
          console.log(`Gallery item found using strategy ${index + 1}`);
          return element;
        }
      } catch (error) {
        console.log(`Strategy ${index + 1} failed:`, error.message);
      }
    }
    
    throw new Error('Gallery item not found with any selector strategy');
  }
}
```

### 2. Dynamic ID Pattern Matching

```typescript
// Handle dynamic IDs like "gallery-item-123", "gallery-item-abc", etc.
async function findDynamicTestId(page: Page, baseId: string) {
  // Try exact match first
  let element = page.getByTestId(baseId);
  if (await element.count() > 0) {
    return element;
  }
  
  // Try prefix match for dynamic IDs
  element = page.locator(`[data-testid^="${baseId}-"]`);
  if (await element.count() > 0) {
    console.log(`Found dynamic ID matching pattern: ${baseId}-*`);
    return element;
  }
  
  // Try suffix match
  element = page.locator(`[data-testid$="-${baseId}"]`);
  if (await element.count() > 0) {
    console.log(`Found dynamic ID with suffix: *-${baseId}`);
    return element;
  }
  
  // Try contains match
  element = page.locator(`[data-testid*="${baseId}"]`);
  if (await element.count() > 0) {
    console.log(`Found ID containing: ${baseId}`);
    return element;
  }
  
  throw new Error(`No element found matching pattern for: ${baseId}`);
}
```

### 3. Context-Aware Selection

```typescript
// Find elements within specific containers when data-testid is ambiguous
async function findInContext(page: Page, containerTestId: string, targetTestId: string) {
  try {
    // First ensure container exists
    const container = page.getByTestId(containerTestId);
    await expect(container).toBeVisible();
    
    // Then find target within container
    const target = container.getByTestId(targetTestId);
    if (await target.count() > 0) {
      return target;
    }
    
    // Fallback: find target anywhere and filter by container
    const allTargets = page.getByTestId(targetTestId);
    const count = await allTargets.count();
    
    for (let i = 0; i < count; i++) {
      const element = allTargets.nth(i);
      const isInContainer = await container.locator(targetTestId).count() > 0;
      if (isInContainer) {
        return element;
      }
    }
    
  } catch (error) {
    console.log(`Context-aware selection failed: ${error.message}`);
  }
  
  throw new Error(`Element ${targetTestId} not found in container ${containerTestId}`);
}
```

## Advanced Debugging Techniques

### 1. Real-time DOM Monitoring

```typescript
// Monitor DOM changes for debugging dynamic content
async function monitorDOMChanges(page: Page, selector: string, duration = 5000) {
  console.log(`Monitoring DOM changes for: ${selector}`);
  
  await page.evaluate((sel, dur) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          
          addedNodes.forEach(node => {
            if (node instanceof Element && node.matches(sel)) {
              console.log('Added element matching selector:', node);
            }
          });
          
          removedNodes.forEach(node => {
            if (node instanceof Element && node.matches(sel)) {
              console.log('Removed element matching selector:', node);
            }
          });
        }
        
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-testid') {
          console.log('data-testid changed on element:', mutation.target);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-testid']
    });
    
    setTimeout(() => observer.disconnect(), dur);
  }, selector, duration);
}

// Usage
await monitorDOMChanges(page, '[data-testid*="gallery"]', 10000);
```

### 2. Screenshot-Based Debugging

```typescript
// Take screenshots with element highlighting for debugging
async function debugElementLocation(page: Page, testId: string) {
  try {
    const element = page.getByTestId(testId);
    
    // Highlight the element if found
    await element.highlight();
    
    // Take screenshot
    await page.screenshot({ 
      path: `debug-${testId}-found.png`,
      fullPage: true 
    });
    
    console.log(`Element found and highlighted: ${testId}`);
    
  } catch (error) {
    // Take screenshot of current state for debugging
    await page.screenshot({ 
      path: `debug-${testId}-not-found.png`,
      fullPage: true 
    });
    
    // List all available test IDs
    const availableIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]'))
        .map(el => el.getAttribute('data-testid'));
    });
    
    console.log(`Element not found: ${testId}`);
    console.log('Available test IDs:', availableIds);
    
    throw error;
  }
}
```

### 3. Interactive Debugging Mode

```typescript
// Pause test execution for manual inspection
async function pauseForDebugging(page: Page, message = 'Debugging pause') {
  console.log(`🔍 ${message}`);
  console.log('Browser paused for manual inspection');
  console.log('Open the browser to inspect elements manually');
  console.log('Press any key in terminal to continue...');
  
  // Keep page open for manual inspection
  await page.pause(); // Playwright's built-in debugging pause
  
  // Alternative: Wait for user input
  // await new Promise(resolve => {
  //   process.stdin.once('data', () => resolve(undefined));
  // });
}

// Usage in tests
if (process.env.DEBUG_MODE === 'true') {
  await pauseForDebugging(page, 'Check gallery element visibility');
}
```

## Best Practices

### 1. Defensive Element Selection

```typescript
class DefensiveSelectors {
  // Always check element exists before interaction
  static async safeClick(page: Page, testId: string, options: {
    timeout?: number;
    fallbackSelectors?: string[];
    skipIfNotFound?: boolean;
  } = {}) {
    const { timeout = 5000, fallbackSelectors = [], skipIfNotFound = false } = options;
    
    // Try primary selector
    let element = page.getByTestId(testId);
    
    try {
      await element.waitFor({ timeout, state: 'visible' });
      await element.click();
      return true;
    } catch (error) {
      console.log(`Primary selector failed for ${testId}: ${error.message}`);
      
      // Try fallback selectors
      for (const fallback of fallbackSelectors) {
        try {
          element = page.locator(fallback);
          await element.waitFor({ timeout: 2000, state: 'visible' });
          await element.click();
          console.log(`Fallback selector succeeded: ${fallback}`);
          return true;
        } catch (fallbackError) {
          console.log(`Fallback failed: ${fallback}`);
        }
      }
      
      if (skipIfNotFound) {
        console.log(`Skipping click for ${testId} - element not found`);
        return false;
      }
      
      throw new Error(`Element not found with any selector: ${testId}`);
    }
  }
  
  // Safe text input with validation
  static async safeFill(page: Page, testId: string, text: string, options: {
    timeout?: number;
    verifyInput?: boolean;
  } = {}) {
    const { timeout = 5000, verifyInput = true } = options;
    
    const element = page.getByTestId(testId);
    
    // Wait for element and clear existing content
    await element.waitFor({ timeout, state: 'visible' });
    await element.clear();
    await element.fill(text);
    
    // Verify input was set correctly
    if (verifyInput) {
      const actualValue = await element.inputValue();
      if (actualValue !== text) {
        throw new Error(`Input verification failed. Expected: "${text}", Got: "${actualValue}"`);
      }
    }
  }
}
```

### 2. Comprehensive Error Context

```typescript
// Provide rich error context when element selection fails
async function enhancedErrorContext(page: Page, testId: string, error: Error) {
  const context = {
    testId,
    originalError: error.message,
    timestamp: new Date().toISOString(),
    url: page.url(),
    availableTestIds: await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]'))
        .map(el => ({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName,
          visible: el.offsetParent !== null,
          text: el.textContent?.slice(0, 50)
        }));
    }),
    similarTestIds: await page.evaluate((id) => {
      const similar = Array.from(document.querySelectorAll('[data-testid]'))
        .filter(el => {
          const testId = el.getAttribute('data-testid') || '';
          return testId.includes(id) || id.includes(testId);
        })
        .map(el => el.getAttribute('data-testid'));
      return similar;
    }, testId),
    pageContent: await page.content()
  };
  
  // Log detailed context
  console.error('🚨 Element Selection Failed');
  console.error('Test ID:', context.testId);
  console.error('URL:', context.url);
  console.error('Available Test IDs:', context.availableTestIds);
  console.error('Similar Test IDs:', context.similarTestIds);
  
  // Save debug information
  await page.screenshot({ path: `error-context-${testId}-${Date.now()}.png` });
  
  return context;
}
```

### 3. Retry Mechanisms

```typescript
// Implement retry logic for flaky element interactions
async function retryElementInteraction<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Action failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      const waitTime = backoff ? delay * attempt : delay;
      console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Retry mechanism failed unexpectedly');
}

// Usage
await retryElementInteraction(async () => {
  await page.getByTestId('submit-button').click();
  await expect(page.getByTestId('success-message')).toBeVisible();
}, { maxRetries: 3, delay: 500, backoff: true });
```

## Code Examples

### Complete Debugging Workflow

```typescript
import { test, expect, Page } from '@playwright/test';

// Complete example of robust element interaction
test('robust gallery interaction with debugging', async ({ page }) => {
  await page.goto('/galleries');
  
  // Step 1: Find gallery creation button with fallbacks
  const createButton = await findElementWithFallbacks(page, [
    '[data-testid="create-gallery-button"]',
    '[data-testid="create-gallery-link"]', 
    'a[href*="create"]',
    'button:has-text("Create")',
    '.create-button'
  ]);
  
  await createButton.click();
  
  // Step 2: Fill form with defensive techniques
  await DefensiveSelectors.safeFill(page, 'gallery-title', 'Test Gallery');
  await DefensiveSelectors.safeFill(page, 'gallery-description', 'Test Description');
  
  // Step 3: Handle checkbox with multiple strategies
  await handleCheckbox(page, 'gallery-public');
  
  // Step 4: Submit with retry logic
  await retryElementInteraction(async () => {
    await page.getByTestId('create-gallery-submit').click();
    await expect(page).toHaveURL(/\/galleries\/[\w-]+/);
  });
  
  console.log('✅ Gallery created successfully');
});

async function findElementWithFallbacks(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`Found element with selector: ${selector}`);
        return element;
      }
    } catch (error) {
      console.log(`Selector failed: ${selector}`);
    }
  }
  throw new Error('Element not found with any selector');
}

async function handleCheckbox(page: Page, testId: string) {
  try {
    await page.getByTestId(testId).check();
  } catch (error) {
    console.log(`Primary checkbox selector failed, trying alternatives...`);
    
    // Try role-based selector
    try {
      await page.getByRole('checkbox', { name: /public/i }).check();
    } catch (roleError) {
      // Try generic checkbox selector
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count > 0) {
        await checkboxes.first().check();
        console.log('Used generic checkbox selector');
      } else {
        console.log('No checkboxes found, skipping...');
      }
    }
  }
}
```

### Debugging Helper Utilities

```typescript
// Utility class for common debugging operations
export class E2EDebugger {
  static async inspectPage(page: Page, label = 'Page Inspection') {
    console.log(`\n🔍 ${label}`);
    console.log('URL:', page.url());
    
    // List all data-testid elements
    const testIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
        testId: el.getAttribute('data-testid'),
        tag: el.tagName,
        visible: el.offsetParent !== null,
        text: el.textContent?.slice(0, 30)
      }));
    });
    
    console.log('Test IDs found:', testIds.length);
    testIds.forEach(item => {
      console.log(`  - ${item.testId} (${item.tag}) ${item.visible ? '✅' : '❌'} "${item.text}"`);
    });
    
    return testIds;
  }
  
  static async waitForStableDOM(page: Page, timeout = 5000) {
    console.log('Waiting for DOM to stabilize...');
    
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             !document.querySelector('.loading, .spinner');
    }, { timeout });
    
    // Additional wait for React/Vue updates
    await page.waitForTimeout(100);
    console.log('DOM appears stable');
  }
  
  static async findSimilarTestIds(page: Page, targetId: string) {
    return await page.evaluate((target) => {
      const allIds = Array.from(document.querySelectorAll('[data-testid]'))
        .map(el => el.getAttribute('data-testid'))
        .filter(id => id);
      
      return allIds.filter(id => {
        return id.includes(target) || 
               target.includes(id) ||
               id.split('-').some(part => target.includes(part));
      });
    }, targetId);
  }
}
```

## Troubleshooting Checklist

When debugging data-testid issues, work through this checklist:

### ✅ Initial Checks
- [ ] Element exists in DOM (use browser dev tools)
- [ ] data-testid attribute is present and correct
- [ ] Element is visible (not hidden by CSS)
- [ ] Page has finished loading
- [ ] No JavaScript errors in console

### ✅ Timing Issues
- [ ] Add explicit waits for element visibility
- [ ] Wait for network requests to complete
- [ ] Check if element is dynamically generated
- [ ] Verify React/framework rendering is complete

### ✅ Selector Issues
- [ ] Try exact data-testid match
- [ ] Try partial data-testid match (`^=`, `*=`, `$=`)
- [ ] Test with role-based selectors
- [ ] Verify selector syntax is correct

### ✅ Context Issues
- [ ] Check if element is inside modal/dialog
- [ ] Verify element is not in different iframe
- [ ] Test if element requires scroll to be visible
- [ ] Check for overlapping elements

### ✅ Environment Issues
- [ ] Compare behavior between development/staging/CI
- [ ] Check if data-testids are stripped in production
- [ ] Verify test environment configuration
- [ ] Test in different browsers

### ✅ Debugging Steps
- [ ] Take screenshots at failure point
- [ ] Log all available data-testids
- [ ] Use Playwright's trace viewer
- [ ] Enable headed mode for visual debugging
- [ ] Add debugging pauses in test execution

## Using the Streamlined E2EUtils Helper

The `E2EUtils` class in `/e2e-tests/enhanced-e2e-utils.ts` provides a focused set of utilities for robust E2E testing with Playwright. The utilities have been streamlined to maintain core functionality while reducing complexity and improving maintainability.

### Quick Start

Import and use the helper in your tests:

```typescript
import { E2EUtils } from './enhanced-e2e-utils';

test('example with e2e utils', async ({ page }) => {
  await page.goto('/galleries');
  
  // Wait for gallery content to load
  await E2EUtils.waitForGalleryLoad(page);
  
  // Click with automatic fallbacks and waiting
  await E2EUtils.clickByTestId(
    page,
    'create-gallery-btn',
    ['button:has-text("Create")', '.create-button'], // Fallback selectors
    'navigation' // Wait strategy
  );
});
```

### Core Methods

#### 1. Element Finding and Waiting

**`waitForElementByTestId()`** - Wait for element with data-testid prioritization:
```typescript
// Basic usage
const element = await E2EUtils.waitForElementByTestId(
  page, 
  'gallery-content'
);

// With fallbacks and timeout
const element = await E2EUtils.waitForElementByTestId(
  page,
  'gallery-content',
  ['.gallery', '[role="main"]'], // Fallback selectors
  { timeout: 10000 }
);
```

**`findElementWithPriority()`** - Find element using prioritized strategy:
```typescript
const element = await E2EUtils.findElementWithPriority(
  page,
  'submit-btn',
  ['button[type="submit"]', '.submit-button'], // CSS fallbacks
  ['text=/submit/i', 'text=/save/i'] // Text pattern fallbacks
);

if (element) {
  await element.click();
} else {
  console.log('Element not found with any strategy');
}
```

**`waitForElement()`** - Basic element waiting:
```typescript
const element = await E2EUtils.waitForElement(page, '[data-testid="gallery-content"]');
```

#### 2. Enhanced Interactions

**`clickByTestId()`** - Click with automatic waiting and fallbacks:
```typescript
// Click with navigation wait
await E2EUtils.clickByTestId(
  page,
  'login-button',
  ['button:has-text("Login")', '#login-btn'],
  'navigation'
);

// Click with modal wait
await E2EUtils.clickByTestId(
  page,
  'delete-gallery',
  ['.delete-btn', 'button:has-text("Delete")'],
  'modal'
);

// Click with toast notification wait
await E2EUtils.clickByTestId(
  page,
  'save-settings',
  ['button[type="submit"]'],
  'toast'
);
```

**`fillByTestId()`** - Fill form fields with validation:
```typescript
await E2EUtils.fillByTestId(
  page,
  'gallery-title',
  'My New Gallery',
  ['input[name="title"]', '#title', 'input[placeholder*="title"]']
);
```

**`clickAndWait()`** - Enhanced click with post-action waiting:
```typescript
const button = page.locator('[data-testid="submit-btn"]');
await E2EUtils.clickAndWait(button, page, 'navigation');
```

**`fillAndValidate()`** - Fill field with automatic validation:
```typescript
await E2EUtils.fillAndValidate(page, '[data-testid="username"]', 'testuser');
```

#### 3. Specialized Waiting Strategies

**`waitForModal()`** - Wait for modal dialogs:
```typescript
// Wait for any modal
const modal = await E2EUtils.waitForModal(page);

// Wait for specific modal
const modal = await E2EUtils.waitForModal(page, 'delete-confirmation-modal');
```

**`waitForToast()`** - Wait for toast notifications:
```typescript
// Wait for toast to appear
const toast = await E2EUtils.waitForToast(page);

// Wait for toast and then for it to disappear
const toast = await E2EUtils.waitForToast(page, {
  waitForDisappear: true,
  timeout: 5000,
  testId: 'success-toast'
});
```

**`waitForGalleryLoad()`** - Wait for gallery-specific content:
```typescript
// Wait for any gallery to load
await E2EUtils.waitForGalleryLoad(page);

// Wait for specific gallery
await E2EUtils.waitForGalleryLoad(page, 'main-gallery');
```

**`waitForGalleryContent()`** - Wait for gallery content or empty state:
```typescript
// Wait for gallery content to be ready (images or empty state)
await E2EUtils.waitForGalleryContent(page);
```

**`waitForNavigation()`** - Wait for page navigation:
```typescript
// Basic navigation wait
await E2EUtils.waitForNavigation(page);

// With URL verification
await E2EUtils.waitForNavigation(page, '/galleries');
await E2EUtils.waitForNavigation(page, /\/gallery\/\d+/);
```

**`waitForForm()`** - Wait for form to be ready:
```typescript
// Wait for any form
const form = await E2EUtils.waitForForm(page);

// Wait for specific form
const form = await E2EUtils.waitForForm(page, 'create-gallery-form');
```

**`waitForAjaxComplete()`** - Wait for AJAX requests to complete:
```typescript
await E2EUtils.waitForAjaxComplete(page);
```

#### 4. Utility Methods

**`isAuthenticated()`** - Check authentication status:
```typescript
const isLoggedIn = await E2EUtils.isAuthenticated(page);
if (!isLoggedIn) {
  // Redirect to login or handle unauthenticated state
}
```

**`isPageReady()`** - Simple page readiness check:
```typescript
const ready = await E2EUtils.isPageReady(page);
expect(ready).toBe(true);
```

**`buildPrioritizedSelector()`** - Build selector with data-testid priority:
```typescript
const selector = E2EUtils.buildPrioritizedSelector(
  'gallery-item',
  ['.gallery-card', '[role="listitem"]']
);
// Returns: '[data-testid="gallery-item"], [data-testid*="gallery-item"], .gallery-card, [role="listitem"]'
```

### Debugging Methods

#### 1. Element Validation and Discovery

**`validateTestIds()`** - Validate expected test IDs exist:
```typescript
const validation = await E2EUtils.validateTestIds(
  page,
  ['header-nav', 'main-content', 'footer-links']
);

console.log(`Found: ${validation.valid.join(', ')}`);
console.log(`Missing: ${validation.missing.join(', ')}`);
```

**`getAllTestIds()`** - Get all elements with data-testid attributes:
```typescript
const allTestIds = await E2EUtils.getAllTestIds(page);
console.log(`Found ${allTestIds.length} elements with data-testid attributes`);

allTestIds.forEach(element => {
  console.log(`${element.tagName}[data-testid="${element.testId}"] - ${element.isVisible ? 'visible' : 'hidden'}`);
});
```

**Output example:**
```
div[data-testid="gallery-content"] - visible
button[data-testid="create-gallery-button"] - visible
input[data-testid="search-input"] - hidden
```

#### 2. Practical Debugging Workflow

```typescript
test('comprehensive debugging example', async ({ page }) => {
  await page.goto('/galleries');
  
  // Step 1: Validate page readiness
  const isReady = await E2EUtils.isPageReady(page);
  expect(isReady).toBe(true);
  
  // Step 2: Get all available test IDs
  const allTestIds = await E2EUtils.getAllTestIds(page);
  console.log(`Page has ${allTestIds.length} elements with data-testid attributes`);
  
  // Step 3: Validate expected elements
  const expectedIds = ['gallery-content', 'create-gallery-btn', 'header-nav'];
  const validation = await E2EUtils.validateTestIds(page, expectedIds);
  
  if (validation.missing.length > 0) {
    console.log(`Missing elements: ${validation.missing.join(', ')}`);
    // Show available alternatives
    allTestIds.forEach(el => {
      if (el.testId && validation.missing.some(missing => 
        el.testId!.includes(missing) || missing.includes(el.testId!)
      )) {
        console.log(`Possible alternative: ${el.testId} (${el.tagName})`);
      }
    });
  }
  
  // Step 4: Try element finding with fallbacks
  const element = await E2EUtils.findElementWithPriority(
    page,
    'gallery-item',
    ['.gallery-card', '[role="listitem"]'],
    ['text=/gallery/i']
  );
  
  if (element) {
    await element.click();
  } else {
    throw new Error('Could not find gallery item with any strategy');
  }
});
```

## Integration Examples

### Real-World Gallery Application Testing

Here are practical examples of using the streamlined E2E utilities in the gallery application:

#### Example 1: Gallery Navigation Test
```typescript
import { test, expect } from '@playwright/test';
import { E2EUtils } from './enhanced-e2e-utils';

test('gallery navigation flow', async ({ page }) => {
  await page.goto('/galleries');
  
  // Wait for gallery page to be ready
  await E2EUtils.waitForGalleryLoad(page);
  
  // Validate expected elements exist
  const validation = await E2EUtils.validateTestIds(page, [
    'create-gallery-button',
    'gallery-content'
  ]);
  
  expect(validation.missing).toHaveLength(0);
  
  // Create new gallery
  await E2EUtils.clickByTestId(
    page, 
    'create-gallery-button',
    ['button:has-text("Create")', '.create-btn'],
    'modal'
  );
  
  // Fill gallery form
  await E2EUtils.fillByTestId(page, 'gallery-title', 'Test Gallery');
  await E2EUtils.fillByTestId(page, 'gallery-description', 'Test Description');
  
  // Submit and wait for navigation
  await E2EUtils.clickByTestId(page, 'submit-button', [], 'navigation');
  
  // Verify gallery was created
  await expect(page).toHaveURL(/\/gallery\/\d+/);
});
```

#### Example 2: Robust Element Finding
```typescript
test('flexible element interaction', async ({ page }) => {
  await page.goto('/galleries');
  
  // Try multiple strategies to find gallery items
  const galleryItem = await E2EUtils.findElementWithPriority(
    page,
    'gallery-item',
    [
      '.gallery-card',
      '[role="listitem"]',
      '.gallery-grid > div',
      'article'
    ],
    [
      'text=/gallery/i',
      'text=/image/i'
    ]
  );
  
  if (galleryItem) {
    await galleryItem.click();
    await E2EUtils.waitForNavigation(page);
  } else {
    // Handle empty state
    const emptyState = await E2EUtils.findElementWithPriority(
      page,
      'create-gallery-button',
      ['button:has-text("Create")', '.empty-state button']
    );
    
    expect(emptyState).toBeTruthy();
    console.log('No galleries found - showing empty state');
  }
});
```

#### Example 3: Form Handling with Validation
```typescript
test('create gallery with validation', async ({ page }) => {
  await page.goto('/galleries');
  await E2EUtils.waitForGalleryLoad(page);
  
  // Navigate to create form
  await E2EUtils.clickByTestId(page, 'create-gallery-button', [], 'modal');
  
  // Wait for form to be ready
  const form = await E2EUtils.waitForForm(page, 'create-gallery-form');
  
  // Fill form fields with validation
  await E2EUtils.fillByTestId(
    page,
    'gallery-title',
    'My Test Gallery',
    ['input[name="title"]', '#title']
  );
  
  await E2EUtils.fillByTestId(
    page,
    'gallery-description', 
    'A test gallery description',
    ['textarea[name="description"]', '#description']
  );
  
  // Submit and handle potential errors
  try {
    await E2EUtils.clickByTestId(page, 'submit-button', [], 'toast');
    
    // Check for success toast
    const toast = await E2EUtils.waitForToast(page, {
      testId: 'success-toast',
      timeout: 5000
    });
    
    await expect(toast).toContainText(/success/i);
    
  } catch (error) {
    // Check for validation errors
    const errorToast = await E2EUtils.waitForToast(page, {
      testId: 'error-toast',
      timeout: 3000
    }).catch(() => null);
    
    if (errorToast) {
      const errorText = await errorToast.textContent();
      console.log('Validation error:', errorText);
    }
    
    throw error;
  }
});
```

#### Example 4: Debugging Failed Tests
```typescript
test('debug element issues', async ({ page }) => {
  await page.goto('/galleries');
  
  try {
    // Attempt normal test flow
    await E2EUtils.clickByTestId(page, 'missing-element');
    
  } catch (error) {
    console.log('Test failed, starting debugging...');
    
    // Check page readiness
    const isReady = await E2EUtils.isPageReady(page);
    console.log('Page ready:', isReady);
    
    // Get all available test IDs
    const allTestIds = await E2EUtils.getAllTestIds(page);
    console.log('Available test IDs:', allTestIds.map(el => el.testId));
    
    // Look for similar elements
    const similarIds = allTestIds.filter(el => 
      el.testId && el.testId.includes('element')
    );
    console.log('Similar elements:', similarIds);
    
    // Try alternative approaches
    const alternatives = [
      'button:has-text("Element")',
      '.element-button',
      '[role="button"]'
    ];
    
    for (const selector of alternatives) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements found`);
    }
    
    throw new Error(`Original error: ${error.message}. Check debug output above.`);
  }
});
```

### Migration from Complex Debugging Framework

If you were previously using the comprehensive debugging framework, here's how to migrate:

**Before (complex framework):**
```typescript
await EnhancedE2EUtils.waitForElementByTestIdWithDebugging(
  page, 'gallery-item', [], { debugOnFailure: true }
);
```

**After (streamlined approach):**
```typescript
// Simple approach
const element = await E2EUtils.waitForElementByTestId(page, 'gallery-item');

// With debugging when needed
try {
  const element = await E2EUtils.waitForElementByTestId(page, 'gallery-item');
} catch (error) {
  const allTestIds = await E2EUtils.getAllTestIds(page);
  console.log('Available elements:', allTestIds.map(el => el.testId));
  throw error;
}
```

**Before (complex debugging):**
```typescript
await EnhancedE2EUtils.debugElementStructure(page, selector, 'investigation');
await EnhancedE2EUtils.suggestAlternativeSelectors(page, selector);
```

**After (focused debugging):**
```typescript
const validation = await E2EUtils.validateTestIds(page, ['expected-id']);
if (validation.missing.length > 0) {
  const alternatives = await E2EUtils.findElementWithPriority(
    page, 
    null,
    ['.fallback-class', '[role="button"]'],
    ['text=/expected text/i']
  );
}
```

### Best Practices for Production Use

1. **Start Simple**: Use basic methods first, add debugging only when needed
2. **Validate Early**: Use `validateTestIds()` to catch missing elements early in tests
3. **Use Fallbacks**: Always provide fallback selectors for critical elements
4. **Check Readiness**: Use `isPageReady()` and `waitForGalleryLoad()` for page state validation
5. **Handle Empty States**: Use `findElementWithPriority()` to handle both content and empty states
6. **Debug Systematically**: Use `getAllTestIds()` to understand page structure when debugging

The streamlined utilities provide a balance between functionality and maintainability, making E2E testing more reliable without overwhelming complexity.

