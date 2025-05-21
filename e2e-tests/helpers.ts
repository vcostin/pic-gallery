import { Page } from '@playwright/test';

/**
 * Helper functions for common operations in the tests
 */
export class TestHelpers {
  /**
   * Login with the provided credentials
   */
  static async login(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');
    await page.getByLabel(/email|username/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for navigation to complete after login
    await page.waitForURL(/\/dashboard|\/home|\//);
  }

  /**
   * Navigate to a specific gallery by index
   */
  static async navigateToGallery(page: Page, galleryIndex: number = 0): Promise<string | null> {
    await page.goto('/');
    const galleryItems = page.locator('.gallery-item');
    
    // Make sure galleries are loaded
    await galleryItems.first().waitFor();
    
    // Find the specific gallery by index
    const gallery = galleryItems.nth(galleryIndex);
    
    // Get the title for verification
    const titleElement = gallery.locator('h2, h3, .title').first();
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
}
