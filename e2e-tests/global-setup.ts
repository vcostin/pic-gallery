import { request } from '@playwright/test';
import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Create a request context for API calls
  const apiContext = await request.newContext({
    baseURL: config.projects[0].use.baseURL as string,
  });

  // You could log in via API and save the authentication state
  // This is more efficient than logging in via UI for each test that needs auth
  
  /*
  try {
    // Example API login - adjust according to your actual API
    const loginResponse = await apiContext.post('/api/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword',
      }
    });
    
    if (loginResponse.ok()) {
      // Save auth state to be used across tests
      const authFile = 'playwright/.auth/user.json';
      await apiContext.storageState({ path: authFile });
      
      console.log('Authentication state saved for tests');
    } else {
      console.error('Failed to authenticate for tests');
    }
  } catch (error) {
    console.error('Error during global setup:', error);
  }
  */

  // Clean up
  await apiContext.dispose();
}

export default globalSetup;
