import { request } from '@playwright/test';
import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 * We only create a test user account if needed, the actual authentication is handled by auth.setup.ts
 */
async function globalSetup(config: FullConfig) {
  // Create a request context for API calls
  const apiContext = await request.newContext({
    baseURL: config.projects[0].use.baseURL as string,
  });

  try {
    // Create a test user if it doesn't exist using environment variables
    const testUser = {
      email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com',
      password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!',
      name: process.env.E2E_TEST_USER_NAME || 'E2E Test User'
    };
    
    // Register test user if needed
    try {
      await apiContext.post('/api/auth/register', {
        data: testUser
      });
      console.log('Test user created successfully');
    } catch {
      // User might already exist, which is fine
      console.log('Test user might already exist, continuing...');
    }
    
    console.log('Global setup completed - test user ready');
  } catch (error) {
    console.error('Error during global setup:', error);
  }

  // Clean up
  await apiContext.dispose();
}

export default globalSetup;
