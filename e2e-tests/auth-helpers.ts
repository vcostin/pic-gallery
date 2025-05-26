import { Page } from '@playwright/test';
import { TEST_USERS, TestUser } from './auth-config';

export class AuthHelpers {
  /**
   * Get a specific test user configuration
   */
  static getUser(userType: keyof typeof TEST_USERS): TestUser {
    return TEST_USERS[userType];
  }

  /**
   * Login with a specific user type without saving state
   * Use this for auth tests that need to test login functionality
   */
  static async loginAs(page: Page, userType: keyof typeof TEST_USERS): Promise<void> {
    const user = TEST_USERS[userType];
    
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/(galleries|profile|home|\/)/, { timeout: 10000 });
  }

  /**
   * Logout from the application
   */
  static async logout(page: Page): Promise<void> {
    // Look for logout button or user menu
    try {
      // Try to find and click logout button
      const logoutButton = page.getByTestId('logout-button');
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        return;
      }

      // Try user menu dropdown
      const userMenu = page.getByTestId('user-menu');
      if (await userMenu.isVisible({ timeout: 2000 })) {
        await userMenu.click();
        await page.getByTestId('logout-menu-item').click();
        return;
      }

      // Fallback: navigate to logout endpoint
      await page.goto('http://localhost:3000/auth/logout');
    } catch (error) {
      console.log('Could not find logout UI elements, using direct navigation');
      await page.goto('http://localhost:3000/auth/logout');
    }

    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
  }

  /**
   * Register a new user (for auth tests)
   */
  static async register(page: Page, name: string, email: string, password: string): Promise<void> {
    await page.goto('http://localhost:3000/auth/register');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    await page.click('button[type="submit"]');
    
    // Wait for successful registration redirect
    await page.waitForURL(/\/(galleries|profile|home|\/)/, { timeout: 10000 });
  }
}
