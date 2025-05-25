const { chromium } = require('playwright');

async function debugAuth() {
  console.log('🔍 Starting authentication debug...');
  
  const browser = await chromium.launch({ headless: false }); // Run in visible mode
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    // First, check if the server is running
    console.log('1. Checking if server is running...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Server is running. Current URL:', page.url());

    // Go to registration page
    console.log('2. Going to registration page...');
    await page.goto('http://localhost:3000/auth/register');
    await page.waitForLoadState('networkidle');
    console.log('Current URL:', page.url());

    // Check if form elements are present
    const nameInput = await page.locator('input[name="name"]').count();
    const emailInput = await page.locator('input[name="email"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();

    console.log('Form elements found:');
    console.log('- Name input:', nameInput);
    console.log('- Email input:', emailInput);
    console.log('- Password input:', passwordInput);
    console.log('- Submit button:', submitButton);

    if (nameInput > 0 && emailInput > 0 && passwordInput > 0 && submitButton > 0) {
      // Try to register
      console.log('3. Attempting registration...');
      await page.fill('input[name="name"]', 'E2E Single Test User');
      await page.fill('input[name="email"]', 'e2e-single-user@example.com');
      await page.fill('input[name="password"]', 'testpassword123');

      console.log('Form filled, submitting...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      console.log('After registration submit. Current URL:', page.url());

      // If still on auth page, try login
      if (page.url().includes('/auth/')) {
        console.log('4. Still on auth page, trying login...');
        await page.goto('http://localhost:3000/auth/login');
        await page.waitForLoadState('networkidle');

        const loginEmailInput = await page.locator('input[type="email"]').count();
        const loginPasswordInput = await page.locator('input[type="password"]').count();
        const loginSubmitButton = await page.locator('button[type="submit"]').count();

        console.log('Login form elements found:');
        console.log('- Email input:', loginEmailInput);
        console.log('- Password input:', loginPasswordInput);
        console.log('- Submit button:', loginSubmitButton);

        if (loginEmailInput > 0 && loginPasswordInput > 0 && loginSubmitButton > 0) {
          await page.fill('input[type="email"]', 'e2e-single-user@example.com');
          await page.fill('input[type="password"]', 'testpassword123');

          console.log('Login form filled, submitting...');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(5000);

          console.log('After login submit. Current URL:', page.url());
        }
      }

      // Test protected page access
      console.log('5. Testing protected page access...');
      await page.goto('http://localhost:3000/galleries');
      await page.waitForLoadState('networkidle');
      console.log('Galleries page URL:', page.url());

      if (page.url().includes('/auth/')) {
        console.log('❌ Authentication failed - redirected to auth page');
      } else {
        console.log('✅ Authentication successful - can access protected pages');
      }
    } else {
      console.log('❌ Registration form elements not found');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }

  console.log('6. Keeping browser open for manual inspection...');
  console.log('Press Ctrl+C to close when done inspecting');
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

debugAuth().catch(console.error);
