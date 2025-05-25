const { chromium } = require('playwright');

async function testLoginFlow() {
  console.log('🔍 Testing login flow after registration...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    
    // Check login form structure
    const loginInputs = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({ type: input.type, name: input.name, placeholder: input.placeholder }))
    );
    console.log('Login form inputs:', loginInputs);
    
    console.log('2. Filling login form...');
    await page.fill('input[type="email"]', 'e2e-single-user@example.com');
    await page.fill('input[type="password"]', 'testpassword123');

    console.log('3. Submitting login form...');
    
    const submitPromise = page.click('button[type="submit"]');
    const navigationPromise = page.waitForURL(url => !url.toString().includes('/auth/'), { timeout: 10000 });
    
    await submitPromise;
    
    try {
      await navigationPromise;
      console.log('✅ Login successful! Current URL:', page.url());
      
      // Test protected page access
      console.log('4. Testing protected page access...');
      await page.goto('http://localhost:3000/galleries');
      await page.waitForLoadState('networkidle');
      console.log('Galleries page URL:', page.url());
      
      if (page.url().includes('/auth/')) {
        console.log('❌ Still redirected to auth - authentication not persistent');
      } else {
        console.log('✅ Can access protected pages - authentication working!');
        
        // Save the auth state to see what cookies we get
        console.log('5. Saving auth state...');
        await context.storageState({ path: './test-auth-state.json' });
        console.log('Auth state saved to test-auth-state.json');
      }
      
    } catch (navError) {
      console.log('❌ Did not navigate away from login page');
      console.log('Current URL:', page.url());
      
      // Check for error messages
      const errors = await page.locator('[role="alert"], .error, .text-red-500').allTextContents();
      if (errors.length > 0) {
        console.log('Error messages:', errors);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginFlow();
