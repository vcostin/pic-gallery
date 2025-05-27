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
      let isAuthed = await this.isAuthenticated(page);
      if (!isAuthed) {
        console.log('User not authenticated, attempting to login...');
        const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-single-user@example.com';
        const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'testpassword123';
        const testName = process.env.E2E_TEST_USER_NAME || 'E2E Single Test User';
        // Try login first
        let loginSuccess = await this.login(page, testEmail, testPassword, true);
        if (!loginSuccess) {
          // Try to register the user if login failed
          console.warn('Login failed, attempting to register the E2E test user...');
          const registerSuccess = await this.registerAndLogin(page, testName, testEmail, testPassword);
          if (registerSuccess) {
            // Save storage state if possible (for single-user strategy)
            if (typeof page.context().storageState === 'function') {
              try {
                await page.context().storageState({ path: './playwright/.auth/single-user.json' });
                console.log('✅ Refreshed Playwright auth storage state after user recreation');
              } catch (e) {
                console.warn('Could not refresh Playwright auth storage state:', e);
              }
            }
            loginSuccess = true;
          }
        }
        isAuthed = loginSuccess;
        if (!isAuthed) {
          console.error('Authentication failed for cleanup, trying fallback cleanup');
          await this.fallbackCleanup(page, deleteUser);
          return;
        }
      }
      
      // Try cleanup with retry logic for rate limiting
      try {
        // First approach: Use the API directly with retry logic
        const url = deleteUser ? '/api/e2e/cleanup?deleteUser=true' : '/api/e2e/cleanup';
        let response: Awaited<ReturnType<typeof page.request.delete>> | null = null;
        
        // Try multiple times with exponential backoff for rate limiting
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (attempt > 1) {
            // Wait with exponential backoff on retry
            const delay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s, 8s
            console.log(`Waiting ${delay}ms before retry attempt ${attempt}...`);
            await page.waitForTimeout(delay);
          }
          
          try {
            // Try DELETE method first
            response = await page.request.delete(url, {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'x-e2e-test': 'true'
              }
            });
            
            if (response.ok()) {
              break; // Success, exit retry loop
            } else if (response.status() === 429 && attempt < maxRetries) {
              console.log(`Rate limited (429), retrying in ${Math.pow(2, attempt) * 1000}ms...`);
              continue; // Retry on rate limit
            }
            
          } catch (deleteError) {
            console.log('DELETE request failed, trying POST method...', deleteError);
            
            // Some frameworks use POST with a _method param for DELETE
            try {
              response = await page.request.post(url, {
                timeout: 15000,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json, text/plain, */*',
                  'x-e2e-test': 'true'
                },
                data: { 
                  _method: 'DELETE',
                  deleteUser: deleteUser 
                }
              });
              
              if (response.ok()) {
                break; // Success, exit retry loop
              } else if (response.status() === 429 && attempt < maxRetries) {
                console.log(`Rate limited (429), retrying in ${Math.pow(2, attempt) * 1000}ms...`);
                continue; // Retry on rate limit
              }
            } catch (postError) {
              console.log('POST request also failed:', postError);
              if (attempt === maxRetries) {
                throw postError; // Re-throw on final attempt
              }
            }
          }
        }
        
        if (response && response.ok()) {
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
        } else if (response) {
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
            const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-single-user@example.com';
            const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'testpassword123';
            
            await this.login(page, testEmail, testPassword, true);
            // Try again with fresh authentication
            const retryResponse = await page.request.delete(url, {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'x-e2e-test': 'true'
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
        } else {
          console.error('❌ No response received from cleanup API');
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

  /**
   * Create a gallery with images for testing purposes
   * This ensures toast tests have galleries with images to work with
   */
  static async createGalleryWithImages(page: Page): Promise<{ galleryId: string, galleryName: string } | null> {
    try {
      console.log('Creating gallery with images for testing...');
      
      // Ensure we're authenticated
      const isAuth = await this.isAuthenticated(page);
      if (!isAuth) {
        console.log('Not authenticated, attempting to login...');
        const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-single-user@example.com';
        const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'testpassword123';
        const loginSuccess = await this.login(page, testEmail, testPassword);
        if (!loginSuccess) {
          console.error('Failed to authenticate for gallery creation');
          return null;
        }
      }

      // Step 1: Upload images first
      console.log('Step 1: Uploading test images...');
      const uploadedImages = await this.uploadTestImages(page);
      if (!uploadedImages || uploadedImages.length === 0) {
        console.error('Failed to upload test images');
        return null;
      }
      console.log(`Uploaded ${uploadedImages.length} test images`);

      // Step 2: Create a gallery
      console.log('Step 2: Creating gallery...');
      const uniqueId = Date.now();
      const galleryName = `Test Gallery ${uniqueId}`;
      
      await page.goto('/galleries/create');
      await page.waitForLoadState('networkidle');
      
      // Fill gallery form
      await page.getByTestId('gallery-title').fill(galleryName);
      await page.getByTestId('gallery-description').fill('Test gallery created for E2E toast testing');
      await page.getByTestId('gallery-public').check();
      
      // Submit gallery form
      console.log('Submitting gallery form...');
      
      // Listen for console errors during submission
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser console error during gallery creation:', msg.text());
        }
      });
      
      // Wait for navigation promise and click button
      try {
        await Promise.all([
          // Wait for navigation away from create page
          page.waitForURL(/\/galleries\/(?!create)[a-zA-Z0-9-]+$/, { timeout: 15000 }),
          // Click submit button
          page.getByTestId('create-gallery-submit').click()
        ]);
      } catch (error) {
        console.error('Gallery creation failed or timed out:', error);
        console.log('Current URL after submission attempt:', page.url());
        
        // Check for any form validation errors
        const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
        if (await errorMessages.count() > 0) {
          const errors = await errorMessages.allTextContents();
          console.log('Form errors found:', errors);
        }
        
        return null;
      }
      
      // Extract gallery ID from URL
      const currentUrl = page.url();
      const galleryId = currentUrl.split('/').pop();
      if (!galleryId || galleryId === 'create') {
        console.error(`Failed to extract gallery ID from URL: ${currentUrl}`);
        return null;
      }
      
      console.log(`Created gallery: ${galleryName} (ID: ${galleryId})`);

      // Step 3: Add images to the gallery
      console.log('Step 3: Adding images to gallery...');
      
      // Navigate to edit page
      await page.getByTestId('edit-gallery-button').click();
      await page.waitForURL(/\/galleries\/[\w-]+\/edit/, { timeout: 10000 });
      
      // Take screenshot before starting image selection
      await page.screenshot({ path: `debug-before-image-selection-${Date.now()}.png` });
      
      // Click select images button
      console.log('Looking for Select Images button...');
      const selectImagesButton = page.getByRole('button', { name: /select images/i });
      await selectImagesButton.waitFor({ state: 'visible', timeout: 5000 });
      await selectImagesButton.click();
      console.log('Clicked Select Images button');
      
      // Wait for image selection modal/interface to fully load
      await page.waitForSelector('[data-testid="select-images-search-input"]', { timeout: 10000 });
      await page.waitForTimeout(2000); // Give time for images to load
      
      // Take screenshot of modal
      await page.screenshot({ path: `debug-image-selection-modal-${Date.now()}.png` });
      
      // Check how many images are available in the dialog
      const allImageCards = page.locator(`[data-testid*="select-images-image-card"]`);
      const availableImageCount = await allImageCards.count();
      console.log(`Found ${availableImageCount} available images in selection dialog`);
      
      // List all available images for debugging
      for (let i = 0; i < availableImageCount; i++) {
        const card = allImageCards.nth(i);
        const titleElement = card.locator(`[data-testid*="select-images-image-title"]`);
        try {
          const title = await titleElement.textContent();
          console.log(`Available image ${i}: ${title}`);
        } catch {
          console.log(`Available image ${i}: [title not found]`);
        }
      }
      
      // Select the uploaded images using image cards
      let selectedCount = 0;
      for (const imageName of uploadedImages) {
        try {
          console.log(`Trying to select image: ${imageName}`);
          
          // Try to find the image card by title text within the card
          const imageCard = page.locator(`[data-testid*="select-images-image-card"]`).filter({ hasText: imageName });
          const cardCount = await imageCard.count();
          console.log(`Found ${cardCount} cards matching "${imageName}"`);
          
          if (cardCount > 0) {
            await imageCard.first().click();
            selectedCount++;
            console.log(`✅ Selected image: ${imageName}`);
            
            // Verify selection by checking if card has selection styling
            const isSelected = await imageCard.first().locator('.ring-2, .ring-blue-500').count() > 0;
            console.log(`Selection state: ${isSelected ? 'selected' : 'not selected'}`);
          } else {
            console.warn(`❌ Could not find image card for: ${imageName}`);
          }
        } catch (error) {
          console.warn(`❌ Error selecting image ${imageName}:`, error);
        }
      }
      
      if (selectedCount === 0) {
        // Try selecting any available image cards if we couldn't find our specific ones
        console.log('Could not find uploaded images, trying to select first available images...');
        const maxToSelect = Math.min(availableImageCount, 2);
        
        for (let i = 0; i < maxToSelect; i++) {
          try {
            const card = allImageCards.nth(i);
            await card.click();
            selectedCount++;
            console.log(`✅ Selected image card ${i}`);
            
            // Verify selection
            const isSelected = await card.locator('.ring-2, .ring-blue-500').count() > 0;
            console.log(`Selection state for card ${i}: ${isSelected ? 'selected' : 'not selected'}`);
          } catch (error) {
            console.warn(`❌ Could not select image card ${i}:`, error);
          }
        }
      }
      
      console.log(`Total selected: ${selectedCount} images`);
      
      // Take screenshot after selection
      await page.screenshot({ path: `debug-after-image-selection-${Date.now()}.png` });
      
      // Confirm image selection - wait for the button to be enabled
      console.log('Looking for Add Images button...');
      const addButton = page.getByTestId('select-images-add-button');
      await addButton.waitFor({ state: 'visible', timeout: 5000 });
      
      // Check if button is enabled
      const isEnabled = await addButton.isEnabled();
      console.log(`Add Images button enabled: ${isEnabled}`);
      
      if (isEnabled) {
        await addButton.click();
        console.log('✅ Clicked Add Images button');
      } else {
        console.error('❌ Add Images button is disabled - no images selected');
        // Take screenshot for debugging
        await page.screenshot({ path: `debug-disabled-add-button-${Date.now()}.png` });
      }
      
      // Wait for dialog to close
      await page.waitForTimeout(2000);
      
      // Check if the modal overlay is still present and try to close it if needed
      const modalOverlay = page.locator('[data-testid="select-images-modal-overlay"]');
      if (await modalOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ Modal overlay is still visible, attempting to close it...');
        
        // Try to close with the close button first
        try {
          const closeButton = page.getByTestId('select-images-close-button');
          if (await closeButton.isVisible({ timeout: 1000 })) {
            await closeButton.click();
            console.log('Clicked close button on modal');
            await page.waitForTimeout(1000);
          }
        } catch {
          console.log('Could not find close button, trying to click outside the modal');
        }
        
        // If modal is still visible, try clicking outside the modal
        if (await modalOverlay.isVisible().catch(() => false)) {
          // Click in the top-left corner (usually outside any modal content)
          await page.mouse.click(10, 10);
          console.log('Clicked outside the modal to close it');
          await page.waitForTimeout(1000);
        }
        
        // Check if modal is finally closed
        const isModalClosed = !(await modalOverlay.isVisible().catch(() => false));
        console.log(`Modal closed: ${isModalClosed}`);
      }
      
      // Take screenshot of edit page after adding images
      await page.screenshot({ path: `debug-edit-page-after-adding-${Date.now()}.png` });
      
      // Check if images appear in the gallery edit page
      const galleryImagesInEdit = page.locator('.gallery-image, [data-testid*="gallery-image"], .grid img');
      const imagesInEditCount = await galleryImagesInEdit.count();
      console.log(`Images visible in edit page: ${imagesInEditCount}`);
      
      // Save the gallery changes - this is crucial step that was missing!
      console.log('Looking for Save Changes button...');
      const saveButton = page.getByTestId('edit-gallery-save-button');
      await saveButton.waitFor({ state: 'visible', timeout: 5000 });
      
      // Handle any potential modal that might be in the way
      const modalOverlayAfterSave = page.locator('.fixed.inset-0, [class*="backdrop-blur"], [data-testid="select-images-modal-overlay"]');
      if (await modalOverlayAfterSave.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('⚠️ Overlay element detected, attempting to remove it...');
        
        // Try clicking outside the modal content
        await page.mouse.click(10, 10);
        await page.waitForTimeout(1000);
        
        // Try evaluating in page context to remove the overlay
        await page.evaluate(() => {
          const overlays = document.querySelectorAll('.fixed.inset-0, [class*="backdrop-blur"]');
          overlays.forEach(el => el.remove());
          console.log('Removed overlay elements via JavaScript');
        });
        
        await page.waitForTimeout(500);
      }
      
      console.log('Clicking Save Changes button...');
      try {
        // Try clicking with force option as a last resort
        await saveButton.click({ force: true, timeout: 10000 });
        console.log('✅ Save button clicked successfully');
      } catch (error) {
        console.error('❌ Failed to click save button:', error);
        
        // Try JavaScript click as fallback
        try {
          await page.evaluate(() => {
            const saveBtn = document.querySelector('[data-testid="edit-gallery-save-button"]');
            if (saveBtn) {
              (saveBtn as HTMLElement).click();
              console.log('Save button clicked via JavaScript');
            }
          });
          console.log('Attempted JS click on save button');
        } catch (jsError) {
          console.error('JS click also failed:', jsError);
        }
      }
      
      // Wait for save to complete - look for success message or navigation
      try {
        await page.waitForSelector('.success, [data-testid*="success"]', { timeout: 10000 });
        console.log('✅ Save success message appeared');
      } catch {
        console.log('No success message detected, waiting for timeout...');
        await page.waitForTimeout(3000);
      }
      
      // Take screenshot after save
      await page.screenshot({ path: `debug-after-save-${Date.now()}.png` });
      
      // Navigate back to gallery view to verify images
      console.log('Navigating back to gallery view...');
      await page.goto(`/galleries/${galleryId}`);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of gallery view
      await page.screenshot({ path: `debug-gallery-view-${Date.now()}.png` });
      
      // Verify the gallery has images
      const galleryImages = page.locator('.gallery-image, [data-testid*="gallery-image"], img[src*="/uploads/"]');
      const imageCount = await galleryImages.count();
      console.log(`Gallery now has ${imageCount} images`);
      
      if (imageCount > 0) {
        console.log(`✅ Successfully created gallery "${galleryName}" with ${imageCount} images`);
        return { galleryId, galleryName };
      } else {
        console.warn(`⚠️ Gallery created but has 0 images`);
        return { galleryId, galleryName };
      }
      
    } catch (error) {
      console.error('Error creating gallery with images:', error);
      return null;
    }
  }

  /**
   * Upload test images for gallery testing
   */
  static async uploadTestImages(page: Page): Promise<string[]> {
    const uploadedImages: string[] = [];
    
    try {
      // Upload 2 test images
      const imagesToUpload = [
        {
          filename: './public/uploads/1746721541274-454864497-----8856477.jpeg',
          title: `Test Image ${Date.now()}-1`
        },
        {
          filename: './public/uploads/1746721666749-415981397-----8856477.jpeg', 
          title: `Test Image ${Date.now()}-2`
        }
      ];
      
      for (const image of imagesToUpload) {
        try {
          console.log(`Uploading: ${image.title}`);
          
          // Go to upload page
          await page.goto('/images/upload');
          await page.waitForLoadState('networkidle');
          
          // Set file
          await page.getByTestId('upload-file').setInputFiles(image.filename);
          
          // Fill title - use the correct test ID
          await page.getByTestId('upload-title').fill(image.title);
          
          // Fill description - use the correct test ID
          await page.getByTestId('upload-description').fill('Test image for E2E testing');
          
          // Submit form
          await page.getByTestId('upload-submit').click();
          
          // Wait for success message
          await page.getByText(/uploaded successfully/i).waitFor({ timeout: 10000 });
          
          uploadedImages.push(image.title);
          console.log(`✅ Uploaded: ${image.title}`);
          
        } catch (error) {
          console.error(`Failed to upload ${image.title}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error uploading test images:', error);
    }
    
    return uploadedImages;
  }

  /**
   * Upload an image using the gallery UI
   */
  static async uploadImage(page: Page, filePath: string, imageName: string) {
    await page.getByTestId('upload-image-button').click();
    const fileInput = await page.getByTestId('upload-image-input');
    await fileInput.setInputFiles(filePath);
    await page.getByTestId('image-title-input').fill(imageName);
    await page.getByTestId('save-uploaded-image').click();
    await page.waitForSelector(`[data-testid="image-card-title"][data-title="${imageName}"]`, { timeout: 10000 });
  }

  /**
   * Verify that an image card with the given name appears in the gallery
   */
  static async verifyImageCard(page: Page, imageName: string) {
    // Wait for the selector to appear
    await page.waitForSelector(`[data-testid="image-card-title"][data-title="${imageName}"]`, { timeout: 10000 });
    // Assert visibility
    const card = await page.getByTestId('image-card-title').filter({ hasText: imageName });
    await expect(card).toBeVisible();
  }
}
