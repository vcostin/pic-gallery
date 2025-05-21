import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check that the login form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/email|username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel(/email|username/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Click login button
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for the error message
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
    await expect(page.locator('.error-message, [role="alert"]')).toContainText(/invalid|incorrect|failed/i);
  });

  // This test requires a valid test account
  test.skip('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in valid test credentials
    await page.getByLabel(/email|username/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword');
    
    // Click login button
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Check if we're redirected to the dashboard or home page
    await expect(page).toHaveURL(/\/dashboard|\/home|\//);
    
    // Verify authentication success indicators (like user menu or profile link)
    await expect(page.locator('.user-menu, .profile-link, .user-avatar')).toBeVisible();
  });
});

// Example of how to test protected routes
test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from protected pages', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/profile');
    
    // Expect redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
