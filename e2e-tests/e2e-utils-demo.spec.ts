/**
 * E2E Utilities Demo Test
 * Demonstrates the core functionality of the cleaned-up E2E utilities
 */

import { test, expect } from '@playwright/test';
import { E2EUtils } from './enhanced-e2e-utils';

test.describe('E2E Utilities Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/galleries');
    await page.waitForLoadState('networkidle');
  });

  test('demonstrate core utility functions', async ({ page }) => {
    console.log('🎯 Testing core E2E utility functions...');
    
    // Test page readiness
    const isReady = await E2EUtils.isPageReady(page);
    expect(isReady).toBe(true);
    console.log('✅ Page readiness check passed');
    
    // Test authentication check
    const isAuth = await E2EUtils.isAuthenticated(page);
    console.log(`📋 Authentication status: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);
    
    // Test gallery content loading
    await E2EUtils.waitForGalleryLoad(page);
    console.log('✅ Gallery loading check passed');
    
    // Test data-testid validation
    const testIds = ['gallery-content', 'empty-gallery-state'];
    const validation = await E2EUtils.validateTestIds(page, testIds);
    console.log(`📊 Test ID validation: ${validation.valid.length} found, ${validation.missing.length} missing`);
    
    // Test getting all test IDs
    const allTestIds = await E2EUtils.getAllTestIds(page);
    console.log(`📋 Found ${allTestIds.length} elements with data-testid attributes`);
    
    // Show first few test IDs for verification
    if (allTestIds.length > 0) {
      console.log('First few test IDs found:');
      allTestIds.slice(0, 5).forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.tagName}[data-testid="${element.testId}"] - ${element.isVisible ? 'visible' : 'hidden'}`);
      });
    }
  });

  test('demonstrate element finding with priority', async ({ page }) => {
    console.log('🔍 Testing prioritized element finding...');
    
    // Test finding elements with priority
    const element = await E2EUtils.findElementWithPriority(
      page,
      'gallery-content',
      ['.gallery', '[role="main"]'],
      ['text=/gallery/i']
    );
    
    if (element) {
      console.log('✅ Found element using prioritized search');
      const isVisible = await element.isVisible();
      console.log(`📋 Element visibility: ${isVisible}`);
    } else {
      console.log('❌ Element not found - checking fallbacks...');
      
      // Try fallback selectors individually
      const fallbacks = ['.gallery', '[role="main"]', 'main', 'body'];
      for (const selector of fallbacks) {
        const count = await page.locator(selector).count();
        console.log(`  ${selector}: ${count} elements found`);
      }
    }
  });

  test('demonstrate waiting utilities', async ({ page }) => {
    console.log('⏳ Testing waiting utilities...');
    
    // Test AJAX completion wait
    await E2EUtils.waitForAjaxComplete(page);
    console.log('✅ AJAX completion check passed');
    
    // Test navigation wait
    await E2EUtils.waitForNavigation(page);
    console.log('✅ Navigation wait completed');
    
    // Test element waiting by test ID
    try {
      const element = await E2EUtils.waitForElementByTestId(
        page,
        'gallery-content',
        ['.gallery', 'main'],
        { timeout: 5000 }
      );
      console.log('✅ Element found using waitForElementByTestId');
      
      const isVisible = await element.isVisible();
      console.log(`📋 Element is visible: ${isVisible}`);
    } catch {
      console.log('❌ Element not found with waitForElementByTestId');
      
      // Try basic element wait as fallback
      try {
        await E2EUtils.waitForElement(page, 'body');
        console.log('✅ Fallback to body element successful');
      } catch {
        console.log('❌ Even body element not found - page may have issues');
      }
    }
  });

  test('demonstrate selector building', async ({ page }) => {
    console.log('🏗️ Testing selector building...');
    
    // Test prioritized selector building
    const selector1 = E2EUtils.buildPrioritizedSelector('gallery-content', ['.gallery']);
    console.log(`📋 Built selector: ${selector1}`);
    expect(selector1).toContain('data-testid="gallery-content"');
    
    const selector2 = E2EUtils.buildPrioritizedSelector(undefined, ['button', 'input']);
    console.log(`📋 Built fallback selector: ${selector2}`);
    expect(selector2).toBe('button, input');
    
    // Test selectors on actual page
    const count1 = await page.locator(selector1).count();
    const count2 = await page.locator(selector2).count();
    console.log(`📊 Selector 1 matches: ${count1} elements`);
    console.log(`📊 Selector 2 matches: ${count2} elements`);
  });

  test('demonstrate form and interaction utilities', async ({ page }) => {
    console.log('📝 Testing form and interaction utilities...');
    
    // Check if we can find any forms on the page
    const formElement = await E2EUtils.findElementWithPriority(
      page,
      'form',
      ['form', '[role="form"]']
    );
    
    if (formElement) {
      console.log('✅ Found form element');
      
      // Test form waiting
      try {
        await E2EUtils.waitForForm(page);
        console.log('✅ Form wait completed');
      } catch {
        console.log('⚠️ Form wait timeout - form may not be ready');
      }
    } else {
      console.log('📋 No forms found on this page');
    }
    
    // Check for interactive elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();
    
    console.log(`📊 Interactive elements found:`);
    console.log(`  Buttons: ${buttons}`);
    console.log(`  Links: ${links}`);
    console.log(`  Inputs: ${inputs}`);
    
    if (buttons > 0) {
      console.log('✅ Page has interactive elements for testing');
    } else {
      console.log('⚠️ No buttons found - limited interaction testing possible');
    }
  });
});
