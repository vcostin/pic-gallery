import { Page } from '@playwright/test';

/**
 * Helper functions for common operations in the tests
 */
export class TestHelpers {
  /**
   * Login with the provided credentials using data-testid selectors
   */
  static async login(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/auth/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();
    
    // Wait for navigation to complete after login
    await page.waitForURL(/\/galleries|\/home|\/profile|\//);
  }

  /**
   * Navigate to a specific gallery by index using data-testid selectors
   */
  static async navigateToGallery(page: Page, galleryIndex: number = 0): Promise<string | null> {
    await page.goto('/galleries');
    const galleryItems = page.getByTestId('gallery-item');
    
    // Make sure galleries are loaded
    await galleryItems.first().waitFor({ timeout: 10000 }).catch(() => null);
    
    // Check if we have galleries
    const count = await galleryItems.count();
    if (count === 0) {
      return null;
    }
    
    // Find the specific gallery by index (use first if index is out of bounds)
    const actualIndex = galleryIndex < count ? galleryIndex : 0;
    const gallery = galleryItems.nth(actualIndex);
    
    // Get the title for verification
    const titleElement = gallery.getByTestId('gallery-title');
    const galleryTitle = await titleElement.textContent();
    
    // Click on the gallery
    await gallery.click();
    
    // Wait for navigation to complete
    await page.waitForURL(/\/galleries\/[\w-]+/);
    
    return galleryTitle;
  }

  /**
   * Clean up temporary test data (to be implemented based on your app's needs)
   */
  static async cleanupTestData(page: Page): Promise<void> {
    // Implement cleanup logic if needed
    // For example, delete test galleries or images created during tests
  }
  
  /**
   * Register a new user account using data-testid selectors
   */
  static async registerNewAccount(
    page: Page, 
    name: string, 
    email: string, 
    password: string
  ): Promise<void> {
    await page.goto('/auth/register');
    await page.getByTestId('register-name').fill(name);
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-password').fill(password);
    await page.getByTestId('register-confirm-password').fill(password);
    await page.getByTestId('register-submit').click();
  }
  
  /**
   * Navigate to images upload page and verify it's loaded
   */
  static async navigateToImageUpload(page: Page): Promise<boolean> {
    await page.goto('/images/upload');
    
    // Check if we're on the upload page (it requires auth, so we might be redirected)
    const isOnUploadPage = await page.url().includes('/images/upload');
    if (!isOnUploadPage) return false;
    
    // Wait for the upload form to be visible
    const isFormVisible = await page.getByTestId('upload-form').isVisible({ timeout: 5000 })
      .catch(() => false);
    
    return isFormVisible;
  }
  
  /**
   * Check if user is authenticated by looking for logout button
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    return await page.getByTestId('logout-button').isVisible({ timeout: 1000 })
      .catch(() => false);
  }
}
