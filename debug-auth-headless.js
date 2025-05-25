const { chromium } = require('playwright');

async function debugAuth() {
  console.log('🔍 Starting authentication debug...');
  
  const browser = await chromium.launch({ headless: true }); // Run headless
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
      
      // Listen for navigation
      const navigationPromise = page.waitForURL(url => !url.toString().includes('/auth/register'), { timeout: 10000 });
      await page.click('button[type="submit"]');
      
      try {
        await navigationPromise;
        console.log('✅ Registration successful! Redirected to:', page.url());
      } catch (navError) {
        console.log('❌ Registration did not redirect away from register page');
        console.log('Current URL after timeout:', page.url());
        
        // Check for any error messages on the page
        const errorMessages = await page.locator('[role="alert"], .error, .text-red-500').allTextContents();
        if (errorMessages.length > 0) {
          console.log('Error messages found:', errorMessages);
        }
      }

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
          
          // Listen for navigation away from login
          const loginNavigationPromise = page.waitForURL(url => !url.toString().includes('/auth/'), { timeout: 10000 });
          await page.click('button[type="submit"]');
          
          try {
            await loginNavigationPromise;
            console.log('✅ Login successful! Redirected to:', page.url());
          } catch (navError) {
            console.log('❌ Login did not redirect away from auth pages');
            console.log('Current URL after timeout:', page.url());
            
            // Check for any error messages on the page
            const loginErrorMessages = await page.locator('[role="alert"], .error, .text-red-500').allTextContents();
            if (loginErrorMessages.length > 0) {
              console.log('Login error messages found:', loginErrorMessages);
            }
          }
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
  } finally {
    await browser.close();
    console.log('🔧 Debug complete. Browser closed.');
  }
}

debugAuth().catch(console.error);
