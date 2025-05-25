import { chromium, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { TEST_USER, TestUser } from './auth-config';

async function createUser(page: Page, user: TestUser): Promise<void> {
  console.log(`Creating user: ${user.email}`);
  
  // Go to registration page
  await page.goto('http://localhost:3000/auth/register');
  await page.waitForLoadState('networkidle');

  // Fill registration form
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);

  // Submit registration
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Check if registration was successful or user already exists
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/galleries') || (currentUrl.includes('/') && !currentUrl.includes('/auth/'))) {
    console.log(`✅ User ${user.email} registered and logged in successfully`);
  } else if (currentUrl.includes('/auth/login')) {
    // Registration successful, now need to login
    console.log(`✅ User ${user.email} registered, now logging in...`);
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login - check for redirect to protected page
    await page.waitForURL((url) => !url.toString().includes('/auth/'), { timeout: 10000 });
    
    console.log(`✅ User ${user.email} logged in successfully`);
  } else {
    // User might already exist, try logging in
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login - check for redirect to protected page
    await page.waitForURL((url) => !url.toString().includes('/auth/'), { timeout: 10000 });
    
    console.log(`✅ User ${user.email} logged in (already existed)`);
  }
  
  // Verify authentication by checking if we can access a protected page
  await page.goto('http://localhost:3000/galleries');
  await page.waitForLoadState('networkidle');
  
  // If still on auth page, authentication failed
  if (page.url().includes('/auth/')) {
    throw new Error('Authentication failed - still on auth page');
  }
  
  console.log('✅ Authentication verified - user can access protected pages');
}

async function saveAuthState(page: Page, user: TestUser): Promise<void> {
  // Ensure auth directory exists
  const authDir = path.join(__dirname, '../playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save authentication state
  await page.context().storageState({ path: user.storageStatePath });
  console.log(`✅ Authentication state saved for ${user.email}`);
}

async function globalSetup() {
  console.log('🧪 Starting E2E Global Setup - Single User Strategy...');
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`\n🗑️  Step 0: Deleting any existing test user (${TEST_USER.email})...`);
    
    // Attempt to delete existing test user before creating new one
    try {
      const deleteResult = await page.request.delete('/api/e2e/delete-user', {
        data: { email: TEST_USER.email },
        timeout: 10000
      });
      
      if (deleteResult.ok()) {
        console.log('✅ Existing test user deleted successfully');
      } else {
        console.log('ℹ️  No existing test user found (this is normal)');
      }
    } catch {
      console.log('ℹ️  No existing test user to delete (this is normal)');
    }

    console.log(`\n📝 Step 1: Creating single test user...`);
    
    await createUser(page, TEST_USER);
    await saveAuthState(page, TEST_USER);

    await context.close();
    await browser.close();
    
    console.log('\n✅ Global Setup Complete - Single test user strategy initialized');
    console.log('📋 Test Execution Strategy:');
    console.log('   0. ✅ Delete existing test user (clean slate)');
    console.log('   1. ✅ Create single test user');
    console.log('   2. Auth tests (register verification, login/logout) - User persists');
    console.log('   3. Feature tests (galleries, images, etc.) - Same user');  
    console.log('   4. Cleanup tests (delete galleries/images via API) - Same user');
    console.log('   5. Final test: Delete user profile and verify deletion');
  } catch (error) {
    console.error('❌ Global Setup Failed:', error);
    throw error;
  }
}

export default globalSetup;
