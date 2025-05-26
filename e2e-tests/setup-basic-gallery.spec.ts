import { test, expect } from '@playwright/test';

// This test simply creates a basic gallery for testing  
test('create a basic gallery', async ({ page, context }) => {
  console.log('Starting basic gallery creation...');
  
  // Try to load the authentication state if it exists
  try {
    await context.addCookies([]);
    await page.goto('/galleries');
    
    // Check if we're redirected to login
    await page.waitForTimeout(2000);
    if (page.url().includes('/auth/login')) {
      console.log('Not authenticated, performing login...');
      // Login
      await page.getByTestId('login-email').fill(process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com');
      await page.getByTestId('login-password').fill(process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!');
      await page.getByTestId('login-submit').click();
      
      // Wait for authentication to complete
      await page.waitForURL(/\/galleries|\/|\/home/, { timeout: 10000 });
      console.log('Login successful');
    } else {
      console.log('Already authenticated');
    }
  } catch {
    console.log('Auth check failed, trying manual login...');
    // Fallback to manual login
    await page.goto('/auth/login');
    
    await page.getByTestId('login-email').fill(process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com');
    await page.getByTestId('login-password').fill(process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!');
    await page.getByTestId('login-submit').click();
    
    // Wait for authentication to complete
    await page.waitForURL(/\/galleries|\/|\/home/, { timeout: 10000 });
    console.log('Login successful');
  }
  
  // Go to galleries page and check if we already have galleries
  await page.goto('/galleries');
  const existingGalleries = await page.getByTestId('gallery-item').count();
  console.log(`Found ${existingGalleries} existing galleries`);
  
  if (existingGalleries > 0) {
    console.log('Using existing gallery');
    return;
  }
  
  // If no galleries, create one
  console.log('Creating a new gallery...');
  await page.goto('/galleries/create');
  
  // Add a wait and log what we see
  await page.waitForTimeout(3000);
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if we're redirected
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/create-gallery-page.png' });
  
  // Let's see if the form is there at all
  const titleField = await page.locator('#title').count();
  console.log('Title field count:', titleField);
  
  // If the form isn't there, let's see what elements we do have
  if (titleField === 0) {
    const inputs = await page.locator('input').count();
    console.log('Input count:', inputs);
    const forms = await page.locator('form').count();
    console.log('Form count:', forms);
    
    // Get page content for debugging
    const content = await page.content();
    console.log('Page contains "Gallery Details":', content.includes('Gallery Details'));
    console.log('Page contains "Create":', content.includes('Create'));
  }
  
  try {
    // Generate a unique name
    const galleryName = `Test Gallery ${Date.now()}`;
    
    // Fill the form
    console.log('Filling gallery form...');
    await page.locator('#title').fill(galleryName);
    await page.locator('#description').fill('A test gallery for E2E testing');
    await page.getByRole('checkbox').first().check();
    
    // Submit the form
    console.log('Submitting gallery form...');
    await page.getByTestId('create-gallery-submit').click();
    
    // Wait for gallery creation
    await page.waitForURL(/\/galleries\/[\w-]+/, { timeout: 10000 });
    console.log(`Gallery "${galleryName}" created successfully`);
  } catch (error) {
    console.error('Error creating gallery:', error);
    throw error;
  }
});
