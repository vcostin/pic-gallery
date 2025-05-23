import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * This runs after all tests are complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  // Clean up any resources created during testing
  
  // If you need to perform API calls to clean up test data:
  // const apiContext = await request.newContext({
  //   baseURL: config.projects[0].use.baseURL as string,
  // });
  
  // try {
  //   // Example API cleanup calls
  //   await apiContext.delete('/api/cleanup/test-data');
  // } catch (error) {
  //   console.error('Error during teardown:', error);
  // }
  
  // await apiContext.dispose();
}

export default globalTeardown;
