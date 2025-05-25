const { chromium } = require('playwright');

async function testRegistration() {
  console.log('🔍 Testing complete registration flow...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Going to registration...');
    await page.goto('http://localhost:3000/auth/register');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Filling registration form...');
    await page.fill('input[name="name"]', 'E2E Single Test User');
    await page.fill('input[name="email"]', 'e2e-single-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="confirmPassword"]', 'testpassword123');

    console.log('3. Submitting form...');
    
    // Use Promise.race to handle either success or timeout
    const submitPromise = page.click('button[type="submit"]');
    const navigationPromise = page.waitForURL(url => !url.toString().includes('/auth/register'), { timeout: 10000 });
    
    await submitPromise;
    
    try {
      await navigationPromise;
      console.log('✅ Registration successful! Current URL:', page.url());
      
      // Test protected page access
      console.log('4. Testing protected page access...');
      await page.goto('http://localhost:3000/galleries');
      await page.waitForLoadState('networkidle');
      console.log('Galleries page URL:', page.url());
      
      if (page.url().includes('/auth/')) {
        console.log('❌ Still redirected to auth - authentication not working');
      } else {
        console.log('✅ Can access protected pages - authentication working!');
      }
      
    } catch (navError) {
      console.log('❌ Did not navigate away from registration page');
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

testRegistration();
