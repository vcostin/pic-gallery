// filepath: /Users/vcostin/Work/pic-gallery/e2e-tests/auth.spec.ts
import { test, expect, type Page } from '@playwright/test';
const loginUrl = '/auth/login';

// User account complete lifecycle test suite - MUST RUN FIRST
// This creates an account that other tests could potentially use if needed
test.describe('User Account Lifecycle', () => {
  // Generate unique user credentials for each test run
  const uniqueId = Date.now();
  const userName = `testuser${uniqueId}`;
  const userEmail = `testuser${uniqueId}@example.com`;
  const userPassword = `Password${uniqueId}!`;

  const registerUrl = '/auth/register';
  const profileUrl = '/profile';

  test('should test complete user lifecycle: registration, login, account deletion, and login attempt after deletion', async ({ page }: { page: Page }) => {
    // Skip in authenticated project as it conflicts with pre-authenticated state
    if (process.env.AUTH_ONLY) {
      console.log('Skipping user lifecycle test in authenticated project');
      return;
    }
    
    // 1. Create a new account with generated credentials
    await page.goto(registerUrl);
    await expect(page).toHaveURL(registerUrl);

    await page.getByTestId('register-name').fill(userName);
    await page.getByTestId('register-email').fill(userEmail);
    await page.getByTestId('register-password').fill(userPassword);
    await page.getByTestId('register-confirm-password').fill(userPassword);
    await page.getByTestId('register-submit').click();

    // Wait for the registration process to complete (redirect to login or home)
    await page.waitForURL((urlObject: URL) => urlObject.pathname === loginUrl || urlObject.pathname === '/', { timeout: 10000 });

    // 1.1. If automatically logged in after registration, then logout
    const logoutButton = page.getByTestId('logout-button');
    const isLoggedIn = await logoutButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoggedIn) {
      console.log('User was automatically logged in after registration, performing logout');
      await logoutButton.click();
      await expect(page).toHaveURL(loginUrl, { timeout: 10000 });
    } else {
      // If not automatically logged in, ensure we're on login page
      if (page.url().endsWith(loginUrl) === false && page.url().endsWith('/') === false) {
        await page.goto(loginUrl);
      }
    }
    await expect(page.url()).toMatch(new RegExp(`${loginUrl}$|/$`)); // Ensure on login or home page before proceeding

    // 2. Login using previously created account credentials to verify they work
    if (!page.url().endsWith(loginUrl)) { // Ensure we are on login page
        await page.goto(loginUrl);
    }
    await expect(page).toHaveURL(loginUrl);
    
    // Fill in the credentials that were used for registration
    await page.getByTestId('login-email').fill(userEmail);
    await page.getByTestId('login-password').fill(userPassword);
    await page.getByTestId('login-submit').click();

    // Verify successful login
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(loginUrl, { timeout: 5000 });

    // 3. Delete account through profile page
    await page.goto(profileUrl);
    await expect(page).toHaveURL(profileUrl);

    // Trigger account deletion dialog
    await page.getByTestId('delete-account-button').click();
    
    // Confirm account deletion in the dialog
    // We need to type DELETE in the confirmation field
    await page.locator('input[placeholder="DELETE"]').fill('DELETE');
    await page.getByTestId('confirm-delete-account').click();

    // After deletion, user should be logged out and redirected to login page or home page
    await expect(page.getByTestId('logout-button')).not.toBeVisible({ timeout: 10000 });
    // The app might redirect to login page or home page after account deletion
    await expect(page).toHaveURL(new RegExp(`${loginUrl}|/`), { timeout: 10000 });

    // 4. Try to login again with the same credentials to verify account has been deleted
    if (!page.url().endsWith(loginUrl)) { // Ensure we are on login page
        await page.goto(loginUrl);
    }
    await expect(page).toHaveURL(loginUrl);
    
    // Attempt login with the previously deleted account
    await page.getByTestId('login-email').fill(userEmail);
    await page.getByTestId('login-password').fill(userPassword);
    await page.getByTestId('login-submit').click();

    // We expect login to fail with an error message
    const errorMessage = page.getByTestId('login-error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/invalid|incorrect|failed|not found|credentials/i);
    await expect(page).toHaveURL(loginUrl); // Should remain on login page
  });
});

// Basic authentication UI tests (don't require account creation)
test.describe('Authentication UI Elements', () => {
  test('should display login form', async ({ page }: { page: Page }) => {
    await page.goto(loginUrl);
    
    // Check that the login form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }: { page: Page }) => {
    await page.goto(loginUrl);
    
    // Fill in invalid credentials
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    
    // Click login button
    await page.getByTestId('login-submit').click();
    
    // Wait for the error message
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText(/invalid|incorrect|failed/i);
  });
});

// Example of how to test protected routes
test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from protected pages', async ({ page }: { page: Page }) => {
    // Skip if running in the authenticated project (using AUTH_ONLY env var)
    if (process.env.AUTH_ONLY) {
      console.log('Skipping protected routes test in authenticated project');
      return;
    }
    
    // Try to access a protected page
    await page.goto('/profile');
    
    // Expect redirect to login
    await expect(page).toHaveURL(new RegExp(`${loginUrl}|/auth/error`)); // Updated to reflect potential redirect to error page too
  });
});
