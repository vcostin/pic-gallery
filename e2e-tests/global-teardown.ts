import { FullConfig } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { TestHelpers } from './helpers';

/**
 * Global teardown for Playwright tests
 * This runs after all tests are complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  try {
    // Check if we have stored auth state from the auth.setup.ts
    const authFile = path.join(process.cwd(), 'playwright/.auth/user.json');
    if (!fs.existsSync(authFile)) {
      console.log('No authentication state found, skipping cleanup');
      return;
    }
    
    // Create a new Playwright browser context with the stored auth state
    const browser = await chromium.launch();
    const context = await browser.newContext({ 
      baseURL: config.projects[0].use.baseURL as string,
      storageState: authFile
    });
    const page = await context.newPage();
    
    try {
      // Check if we should also delete the user account
      const shouldDeleteUser = process.env.E2E_DELETE_USER_ON_TEARDOWN === 'true';
      
      // First verify we're still authenticated
      await page.goto('/');
      const isAuthenticated = await TestHelpers.isAuthenticated(page);
      
      if (!isAuthenticated) {
        console.log('Authentication expired, attempting to login again...');
        // Get the test user credentials from env vars or use defaults
        const testEmail = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
        const testPassword = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';
        
        // Login again
        const loginSuccess = await TestHelpers.login(page, testEmail, testPassword, true); // skipRegistration=true
        
        if (!loginSuccess) {
          console.error('❌ Could not re-authenticate for cleanup');
          await page.screenshot({ path: 'teardown-auth-failed.png' });
          return;
        }
        
        // Save the new auth state for future use
        await context.storageState({ path: authFile });
        console.log('Authentication state refreshed');
      }
      
      // Try API cleanup first
      try {
        // Call the cleanup API endpoint
        console.log(`Calling E2E cleanup API${shouldDeleteUser ? ' (including user account)' : ''}...`);
        
        // Try multiple request methods since some servers handle DELETE differently
        let cleanupResponse;
        try {
          // Try standard DELETE request first
          const cleanupEndpoint = shouldDeleteUser ? '/api/e2e/cleanup?deleteUser=true' : '/api/e2e/cleanup';
          cleanupResponse = await page.request.delete(cleanupEndpoint, {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (deleteError) {
          console.log('DELETE request failed, trying POST with _method=DELETE...');
          // Some frameworks use POST with _method param for DELETE operations
          const cleanupEndpoint = shouldDeleteUser ? '/api/e2e/cleanup' : '/api/e2e/cleanup';
          cleanupResponse = await page.request.post(cleanupEndpoint, {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json'
            },
            data: { 
              _method: 'DELETE',
              deleteUser: shouldDeleteUser
            }
          });
        }
        
        if (cleanupResponse.ok()) {
          try {
            const data = await cleanupResponse.json();
            const counts = data.data?.deletedCount || {};
            const summary = [
              `${counts.galleries || 0} galleries`,
              `${counts.images || 0} images`
            ];
            if (counts.user) {
              summary.push(`${counts.user} user account`);
            }
            console.log(`✅ E2E cleanup API successful. Deleted: ${summary.join(', ')}`);
          } catch (parseError) {
            // Response might not be JSON
            const text = await cleanupResponse.text();
            console.log(`✅ E2E cleanup API successful. Response: ${text}`);
          }
        } else {
          const errorText = await cleanupResponse.text();
          console.error(`❌ API cleanup failed: ${cleanupResponse.status()} - ${errorText}`);
          // If API cleanup fails, try UI-based cleanup
          throw new Error('API cleanup failed, falling back to UI cleanup');
        }
      } catch (apiError) {
        console.error('API cleanup error:', apiError);
        // Fallback to UI-based cleanup
        await TestHelpers.fallbackCleanup(page, shouldDeleteUser);
      }
    } finally {
      await context.close();
      await browser.close();
    }
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
  
  console.log('Global teardown completed.');
}

export default globalTeardown;
