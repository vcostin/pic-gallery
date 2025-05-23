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

  // We login via API and save authentication state to be reused by tests
  // This is more efficient than logging in via UI for each test that needs auth
  
  try {
    // Create a test user if it doesn't exist
    // You may need to adjust this based on your API endpoints
    const testUser = {
      email: 'e2e-test@example.com',
      password: 'TestPassword123!',
      name: 'E2E Test User'
    };
    
    // Register test user if needed - typically would check if user exists first
    // This endpoint would depend on your API structure
    try {
      await apiContext.post('/api/auth/register', {
        data: testUser
      });
    } catch (error) {
      // User might already exist, which is fine
      console.log('Test user might already exist, continuing...', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Login with NextAuth/Credentials
    const loginResponse = await apiContext.post('/api/auth/callback/credentials', {
      data: {
        email: testUser.email,
        password: testUser.password,
        redirect: false,
        callbackUrl: '/'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (loginResponse.ok()) {
      // Save auth state to be used across tests
      const authDir = './playwright/.auth';
      const authFile = './playwright/.auth/user.json';
      
      // Create directory if it doesn't exist
      const fs = await import('fs/promises');
      await fs.mkdir(authDir, { recursive: true }).catch(() => {});
      
      // Store auth state
      await apiContext.storageState({ path: authFile });
      
      console.log('Authentication state saved for tests');
    } else {
      console.error('Failed to authenticate for tests');
    }
  } catch (error) {
    console.error('Error during global setup:', error);
  }

  // Clean up
  await apiContext.dispose();
}

export default globalSetup;
