import { Page } from '@playwright/test';

/**
 * Helper functions for common operations in the tests
 */
export class TestHelpers {
  /**
   * Login with the provided credentials using multiple selector strategies
   * Attempts to recreate the user if login fails
   */
  static async login(page: Page, email: string, password: string, skipRegistration: boolean = false): Promise<boolean> {
    try {
      // First check if we're already logged in
      const alreadyAuthenticated = await this.isAuthenticated(page);
      if (alreadyAuthenticated) {
        console.log('Already authenticated, skipping login');
        return true;
      }
      
      // Navigate to login page
      await page.goto('/auth/login');
      
      // Try filling the login form with different selector strategies
      let emailFilled = false;
      let passwordFilled = false;
      
      // Try by data-testid first
      if (await page.getByTestId('login-email').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('login-email').fill(email);
        emailFilled = true;
      }
      
      if (await page.getByTestId('login-password').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('login-password').fill(password);
        passwordFilled = true;
      }
      
      // If data-testid fails, try by role with name
      if (!emailFilled) {
        if (await page.getByRole('textbox', { name: /email/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByRole('textbox', { name: /email/i }).fill(email);
          emailFilled = true;
        }
      }
      
      if (!passwordFilled) {
        // Password fields usually don't have role="textbox"
        if (await page.getByLabel(/password/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/password/i).fill(password);
          passwordFilled = true;
        }
      }
      
      // Last resort - find by placeholder
      if (!emailFilled) {
        if (await page.getByPlaceholder(/email/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/email/i).fill(email);
          emailFilled = true;
        }
      }
      
      if (!passwordFilled) {
        if (await page.getByPlaceholder(/password/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/password/i).fill(password);
          passwordFilled = true;
        }
      }
      
      // If we still can't fill the form, try a last-resort approach
      if (!emailFilled || !passwordFilled) {
        console.log('Using fallback selectors for login form');
        const inputs = await page.locator('input').all();
        
        // Typical pattern: first input is email, second is password
        if (inputs.length >= 2) {
          if (!emailFilled) await inputs[0].fill(email);
          if (!passwordFilled) await inputs[1].fill(password);
        }
      }
      
      // Try submitting the form with different selectors
      let submitted = false;
      
      // Try by data-testid
      if (await page.getByTestId('login-submit').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('login-submit').click();
        submitted = true;
      }
      
      // Try by role with common login button text
      if (!submitted) {
        const loginButton = page.getByRole('button', { name: /login|sign in|log in|submit/i });
        if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await loginButton.click();
          submitted = true;
        }
      }
      
      // Try by type="submit" - but be careful with multiple matches
      if (!submitted) {
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          submitted = true;
        }
      }
      
      // Wait for navigation to complete after login
      try {
        await page.waitForURL(/\/galleries|\/home|\/profile|\/dashboard|\//,
          { timeout: 10000 });
      } catch (error) {
        console.error('Navigation after login failed:', error);
        // Take a screenshot for debugging
        await page.screenshot({ path: 'login-error.png' });
      }
      
      // Verify login was successful by checking for authenticated state
      const isAuthenticated = await this.isAuthenticated(page);
      if (isAuthenticated) {
        console.log('Login successful');
        return true;
      } else {
        console.error('Login failed');
        
        // Try to register the user if registration is not skipped
        if (!skipRegistration) {
          console.log('Trying to register the user instead');
          return await this.registerAndLogin(page, 'E2E Test User', email, password);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error during login process:', error);
      return false;
    }
  }

  /**
   * Register a new user and then login using multiple selector strategies
   */
  static async registerAndLogin(page: Page, name: string, email: string, password: string): Promise<boolean> {
    try {
      console.log(`Attempting to register user: ${email}`);
      
      // Go to register page
      await page.goto('/auth/register');
      await page.waitForLoadState('networkidle');
      
      // Fill the registration form using multiple selector strategies
      let nameFilled = false;
      let emailFilled = false;
      let passwordFilled = false;
      let confirmPasswordFilled = false;
      
      // Try by data-testid first
      if (await page.getByTestId('register-name').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('register-name').fill(name);
        nameFilled = true;
      }
      
      if (await page.getByTestId('register-email').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('register-email').fill(email);
        emailFilled = true;
      }
      
      if (await page.getByTestId('register-password').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('register-password').fill(password);
        passwordFilled = true;
      }
      
      if (await page.getByTestId('register-confirm-password').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('register-confirm-password').fill(password);
        confirmPasswordFilled = true;
      }
      
      // Try by role/label if data-testid fails
      if (!nameFilled) {
        if (await page.getByLabel(/name/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/name/i).fill(name);
          nameFilled = true;
        } else if (await page.getByRole('textbox', { name: /name/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByRole('textbox', { name: /name/i }).fill(name);
          nameFilled = true;
        }
      }
      
      if (!emailFilled) {
        if (await page.getByLabel(/email/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/email/i).fill(email);
          emailFilled = true;
        } else if (await page.getByRole('textbox', { name: /email/i }).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByRole('textbox', { name: /email/i }).fill(email);
          emailFilled = true;
        }
      }
      
      if (!passwordFilled) {
        if (await page.getByLabel(/^password$/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/^password$/i).fill(password);
          passwordFilled = true;
        }
      }
      
      if (!confirmPasswordFilled) {
        if (await page.getByLabel(/confirm password|password confirmation/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByLabel(/confirm password|password confirmation/i).fill(password);
          confirmPasswordFilled = true;
        }
      }
      
      // Try by placeholder if previous methods fail
      if (!nameFilled) {
        if (await page.getByPlaceholder(/name/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/name/i).fill(name);
          nameFilled = true;
        }
      }
      
      if (!emailFilled) {
        if (await page.getByPlaceholder(/email/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/email/i).fill(email);
          emailFilled = true;
        }
      }
      
      if (!passwordFilled) {
        if (await page.getByPlaceholder(/^password$/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/^password$/i).fill(password);
          passwordFilled = true;
        }
      }
      
      if (!confirmPasswordFilled) {
        if (await page.getByPlaceholder(/confirm password|password confirmation/i).isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.getByPlaceholder(/confirm password|password confirmation/i).fill(password);
          confirmPasswordFilled = true;
        }
      }
      
      // Last resort - try basic selectors
      if (!nameFilled || !emailFilled || !passwordFilled || !confirmPasswordFilled) {
        console.log('Using fallback selectors for registration form');
        const inputs = await page.locator('input').all();
        
        // Typical pattern for registration forms
        if (inputs.length >= 4) {
          if (!nameFilled) await inputs[0].fill(name);
          if (!emailFilled) await inputs[1].fill(email);
          if (!passwordFilled) await inputs[2].fill(password);
          if (!confirmPasswordFilled) await inputs[3].fill(password);
        }
      }
      
      // Try submitting the form with different selectors
      let submitted = false;
      
      // Try by data-testid
      if (await page.getByTestId('register-submit').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('register-submit').click();
        submitted = true;
      }
      
      // Try by role with common register button text
      if (!submitted) {
        const registerButton = page.getByRole('button', { name: /register|sign up|create account|submit/i });
        if (await registerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await registerButton.click();
          submitted = true;
        }
      }
      
      // Try by type="submit" (first submit button) as last resort
      if (!submitted) {
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          submitted = true;
        }
      }
      
      // Wait for navigation after registration
      try {
        await page.waitForURL(/\/galleries|\/home|\/profile|\/auth\/login|\/dashboard|\//,
          { timeout: 10000 });
      } catch (error) {
        console.error('Navigation after registration failed:', error);
        await page.screenshot({ path: 'register-error.png' });
      }
      
      // Check if we're authenticated (some systems auto-login after registration)
      let isAuthenticated = await this.isAuthenticated(page);
      
      // If not, try to login
      if (!isAuthenticated) {
        console.log('Not authenticated after registration, trying to login');
        await page.goto('/auth/login');
        
        // Use the same login strategy with different selectors
        // Pass true for skipRegistration to prevent infinite recursion
        await this.login(page, email, password, true);
        
        // Check authentication again
        isAuthenticated = await this.isAuthenticated(page);
      }
      
      if (isAuthenticated) {
        console.log('User registered and logged in successfully');
      } else {
        console.error('Failed to register and login user');
        await page.screenshot({ path: 'register-login-failed.png' });
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Error during registration and login:', error);
      return false;
    }
  }

  /**
   * Navigate to a specific gallery by index using multiple selector strategies
   */
  static async navigateToGallery(page: Page, galleryIndex: number = 0): Promise<string | null> {
    console.log('Navigating to gallery...');
    await page.goto('/galleries');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Try different selectors for gallery items
    let galleryItems;
    let galleryCount = 0;
    
    // Try by data-testid first
    galleryItems = page.getByTestId('gallery-item');
    galleryCount = await galleryItems.count();
    console.log(`Found ${galleryCount} galleries by test ID`);
    
    // If no galleries found, try alternative selectors
    if (galleryCount === 0) {
      // Try by common class names for gallery cards/items
      galleryItems = page.locator('.gallery-card, .gallery-item, .card, [data-gallery-id]');
      galleryCount = await galleryItems.count();
      console.log(`Found ${galleryCount} galleries by class/attribute`);
      
      // Try by role if still no luck
      if (galleryCount === 0) {
        galleryItems = page.getByRole('article');
        galleryCount = await galleryItems.count();
        console.log(`Found ${galleryCount} galleries by article role`);
      }
    }
    
    // If we still don't have galleries, look for any clickable elements with gallery patterns in URL
    if (galleryCount === 0) {
      const galleryLinks = page.locator('a[href*="/galleries/"]');
      galleryCount = await galleryLinks.count();
      console.log(`Found ${galleryCount} galleries by link pattern`);
      
      if (galleryCount > 0) {
        galleryItems = galleryLinks;
      }
    }
    
    // Check if we found any galleries
    if (galleryCount === 0) {
      console.log('No galleries found');
      return null;
    }
    
    // Find the specific gallery by index (use first if index is out of bounds)
    const actualIndex = galleryIndex < galleryCount ? galleryIndex : 0;
    const gallery = galleryItems.nth(actualIndex);
    
    // Get the title for verification
    let galleryTitle = null;
    try {
      // Try by data-testid
      const titleElement = gallery.getByTestId('gallery-title');
      if (await titleElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        galleryTitle = await titleElement.textContent();
      } else {
        // Try by common heading pattern
        const headingElement = gallery.locator('h1, h2, h3, h4, h5, h6').first();
        if (await headingElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          galleryTitle = await headingElement.textContent();
        } else {
          // Try getting text content from the gallery item itself
          galleryTitle = await gallery.textContent();
          
          // Limit to a reasonable length if we got the whole card text
          if (galleryTitle && galleryTitle.length > 50) {
            galleryTitle = galleryTitle.substring(0, 50) + '...';
          }
        }
      }
    } catch (error) {
      console.warn('Could not get gallery title:', error);
      galleryTitle = `Gallery at index ${actualIndex}`;
    }
    
    console.log(`Clicking on gallery: ${galleryTitle}`);
    // Click on the gallery
    await gallery.click();
    
    // Wait for navigation to complete
    try {
      await page.waitForURL(/\/galleries\/[\w-]+/, { timeout: 10000 });
      console.log(`Successfully navigated to gallery: ${galleryTitle}`);
    } catch (error) {
      console.error('Navigation to gallery failed:', error);
      return null;
    }
    
    return galleryTitle;
  }

  /**
   * Clean up temporary test data by calling the E2E cleanup API endpoint
   * @param page - The Playwright page instance
   * @param deleteUser - Whether to also delete the user account (default: false)
   */
  static async cleanupTestData(page: Page, deleteUser: boolean = false): Promise<void> {
    try {
      console.log(`Cleaning up E2E test data${deleteUser ? ' (including user account)' : ''}...`);
      
      // Make sure we're authenticated
      const isAuthed = await this.isAuthenticated(page);
      if (!isAuthed) {
        console.log('User not authenticated, attempting to login...');
        const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
        const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
        
        // Use skipRegistration=true to avoid recursive login/registration attempts
        const loginSuccess = await this.login(page, testEmail, testPassword, true);
        if (!loginSuccess) {
          console.error('Authentication failed for cleanup, trying fallback cleanup');
          // Even if login fails, try UI-based cleanup as a last resort
          await this.fallbackCleanup(page, deleteUser);
          return;
        }
      }
      
      // Try cleanup with multiple approaches
      try {
        // First approach: Use the API directly
        const url = deleteUser ? '/api/e2e/cleanup?deleteUser=true' : '/api/e2e/cleanup';
        let response;
        
        // Enhance API request reliability
        try {
          // Try DELETE method first
          response = await page.request.delete(url, {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*'
            }
          });
        } catch (deleteError) {
          console.log('DELETE request failed, trying POST method...', deleteError);
          
          // Some frameworks use POST with a _method param for DELETE
          response = await page.request.post(url, {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*'
            },
            data: { 
              _method: 'DELETE',
              deleteUser: deleteUser 
            }
          });
        }
        
        if (response.ok()) {
          let data;
          try {
            data = await response.json();
            const counts = data.data?.deletedCount || {};
            const summary = [
              `${counts.galleries || 0} galleries`,
              `${counts.images || 0} images`
            ];
            if (counts.user) {
              summary.push(`${counts.user} user account`);
            }
            console.log(`✅ Cleanup successful. Deleted: ${summary.join(', ')}`);
          } catch {
            // Response might not be JSON
            const text = await response.text();
            console.log(`✅ Cleanup successful. Response: ${text}`);
          }
        } else {
          const status = response.status();
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Could not read response: ${e}`;
          }
          
          console.error(`❌ Failed to clean up test data: ${status} - ${errorText}`);
          
          if (status === 401 || status === 403) {
            console.log('Unauthorized error, trying to refresh authentication...');
            const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
            const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
            
            await this.login(page, testEmail, testPassword, true);
            // Try again with fresh authentication
            const retryResponse = await page.request.delete(url, {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
              }
            });
            
            if (retryResponse.ok()) {
              console.log('✅ Cleanup successful after re-authentication');
              return;
            }
          }
          
          // If still failed, try alternate cleanup methods
          console.log('API cleanup failed, trying UI-based fallback cleanup');
          await this.fallbackCleanup(page, deleteUser);
        }
      } catch (apiError) {
        console.error('❌ API request failed during cleanup:', apiError);
        // Take a screenshot for debugging
        await page.screenshot({ path: 'cleanup-api-error.png' });
        
        // Try alternate cleanup methods
        await this.fallbackCleanup(page, deleteUser);
      }
    } catch (error) {
      console.error('❌ Error during test data cleanup:', error);
      // Take a screenshot for debugging
      await page.screenshot({ path: 'cleanup-error.png' });
    }
  }
  
  /**
   * Fallback cleanup using UI navigation when API fails
   */
  static async fallbackCleanup(page: Page, deleteUser: boolean): Promise<void> {
    console.log('Attempting fallback cleanup through UI...');
    
    try {
      // Navigate to galleries page
      await page.goto('/galleries');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Find all galleries
      const galleryItems = page.getByTestId('gallery-item');
      const count = await galleryItems.count();
      
      if (count > 0) {
        console.log(`Found ${count} galleries to clean up`);
        
        // Only delete a few galleries to avoid long cleanup times
        const galleriesLimit = Math.min(count, 5);
        
        for (let i = 0; i < galleriesLimit; i++) {
          try {
            // Get the first gallery (index 0 each time since they shift after deletion)
            const gallery = galleryItems.first();
            await gallery.click();
            
            // Wait for navigation to gallery detail page
            await page.waitForURL(/\/galleries\/[\w-]+/, { timeout: 10000 });
            
            // Find and click delete button
            const deleteButton = page.getByTestId('delete-gallery-button');
            if (await deleteButton.isVisible({ timeout: 5000 })) {
              await deleteButton.click();
              
              // Confirm deletion in modal/dialog if present
              const confirmButton = page.getByRole('button', { name: /delete|confirm|yes/i });
              if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await confirmButton.click();
              }
              
              // Wait for navigation back to galleries list
              await page.waitForURL(/\/galleries\/?$/, { timeout: 10000 });
            } else {
              // If delete button not found, go back to galleries
              await page.goto('/galleries');
            }
          } catch (galleryError) {
            console.error(`Error deleting gallery ${i}:`, galleryError);
            // Continue with next gallery
            await page.goto('/galleries');
          }
        }
      }
      
      // Clean up images if there's an image management page
      try {
        await page.goto('/images');
        
        // Check if we're on an image management page
        if (page.url().includes('/images')) {
          const imageItems = page.getByTestId('image-item');
          const imageCount = await imageItems.count();
          
          if (imageCount > 0) {
            console.log(`Found ${imageCount} images to clean up`);
            
            // Only delete a few images to avoid long cleanup times
            const imagesLimit = Math.min(imageCount, 5);
            
            for (let i = 0; i < imagesLimit; i++) {
              try {
                // Get the first image (index 0 each time since they shift after deletion)
                const image = imageItems.first();
                
                // Try to find and click a delete button or icon
                const deleteButton = image.getByTestId('delete-image-button');
                if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                  await deleteButton.click();
                  
                  // Confirm deletion in modal/dialog if present
                  const confirmButton = page.getByRole('button', { name: /delete|confirm|yes/i });
                  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await confirmButton.click();
                  }
                  
                  // Wait for image to be removed
                  await page.waitForTimeout(1000);
                }
              } catch (imageError) {
                console.error(`Error deleting image ${i}:`, imageError);
                // Continue with next image
              }
            }
          }
        }
      } catch (imagesError) {
        console.error('Error cleaning up images:', imagesError);
      }
      
      if (deleteUser) {
        try {
          // Try to navigate to user profile or settings
          await page.goto('/profile');
          
          // Look for a delete account button
          const deleteAccountButton = page.getByRole('button', { name: /delete account/i });
          if (await deleteAccountButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await deleteAccountButton.click();
            
            // Confirm deletion
            const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
            if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
              await confirmButton.click();
              
              // Wait for navigation to login/home page
              await page.waitForURL(/\/auth\/login|\/|\/home/, { timeout: 10000 });
              console.log('User account deleted successfully');
            }
          }
        } catch (userDeleteError) {
          console.error('Error deleting user account:', userDeleteError);
        }
      }
      
      console.log('Fallback cleanup completed');
    } catch (fallbackError) {
      console.error('Fallback cleanup failed:', fallbackError);
    }
  }

  /**
   * Complete cleanup that removes all data and the user account
   */
  static async completeCleanup(page: Page): Promise<void> {
    return this.cleanupTestData(page, true);
  }
  
  /**
   * Register a new user account using multiple selector strategies
   */
  static async registerNewAccount(
    page: Page, 
    name: string, 
    email: string, 
    password: string
  ): Promise<void> {
    await this.registerAndLogin(page, name, email, password);
  }
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
    try {
      // First, try to find the logout button using various selectors
      const logoutButtonVisible = await page.getByTestId('logout-button').isVisible({ timeout: 1000 })
        .catch(() => false);
      
      if (logoutButtonVisible) return true;
      
      // Try alternative selectors for logout
      const altLogoutVisible = await page.getByRole('button', { name: /logout|sign out/i }).isVisible({ timeout: 1000 })
        .catch(() => false);
      
      if (altLogoutVisible) return true;
      
      // If not found, check if we're on a protected page like galleries
      const currentUrl = page.url();
      if (currentUrl.includes('/galleries') || 
          currentUrl.includes('/profile') || 
          currentUrl.includes('/images/upload')) {
        // Check for any auth-only UI elements with alternative selectors
        const createGalleryButton = await page.getByTestId('create-gallery-button').isVisible({ timeout: 1000 })
          .catch(() => false);
        const createGalleryLink = await page.getByTestId('create-gallery-link').isVisible({ timeout: 1000 })
          .catch(() => false);
        const userProfileLink = await page.getByTestId('user-profile-link').isVisible({ timeout: 1000 })
          .catch(() => false);
        const userMenu = await page.getByTestId('user-menu').isVisible({ timeout: 1000 })
          .catch(() => false);
        
        // Look for any button/link with "Create Gallery" text
        const createGalleryText = await page.getByRole('link', { name: /create gallery/i }).isVisible({ timeout: 1000 })
          .catch(() => false);
        
        return createGalleryButton || createGalleryLink || userProfileLink || userMenu || createGalleryText;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}
