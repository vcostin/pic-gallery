import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test('debug UI elements after login', async ({ page }) => {
  // Perform login
  const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
  const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
  
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(testEmail);
  await page.getByTestId('login-password').fill(testPassword);
  await page.getByTestId('login-submit').click();
  
  // Wait for navigation to complete
  await page.waitForURL(/\/galleries|\/home|\/profile|\//);
  
  // Take a screenshot
  await page.screenshot({ path: 'after-login-screenshot.png' });
  
  // Check for logout button
  const logoutButtonVisible = await page.getByTestId('logout-button').isVisible()
    .catch(() => false);
  console.log(`Logout button visible: ${logoutButtonVisible}`);
  
  // Check for create gallery button
  const createGalleryButtonVisible = await page.getByTestId('create-gallery-button').isVisible()
    .catch(() => false);
  console.log(`Create Gallery Button visible: ${createGalleryButtonVisible}`);
  
  // Check for create gallery link
  const createGalleryLinkVisible = await page.getByRole('link', { name: /create gallery/i }).isVisible()
    .catch(() => false);
  console.log(`Create Gallery Link visible: ${createGalleryLinkVisible}`);
  
  // Check for any element containing "Create"
  const createElements = await page.getByText(/create/i).count();
  console.log(`Any Create text visible: ${createElements}`);
  
  // Get all elements with data-testid
  const allTestIds = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('[data-testid]'));
    return elements.map(el => el.getAttribute('data-testid'));
  });
  console.log('All elements with data-testid:', allTestIds);
  
  // Get elements with "Create" text
  const createTextElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements
      .filter(el => el.textContent && el.textContent.toLowerCase().includes('create'))
      .map(el => el.textContent.trim());
  });
  console.log('Elements with "Create" text:', createTextElements);
  
  // Wait for user to examine
  await page.waitForTimeout(5000);
});
