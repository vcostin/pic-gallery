const { chromium } = require('playwright');

async function quickAuth() {
  console.log('🔍 Quick auth test...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Going to registration...');
    await page.goto('http://localhost:3000/auth/register', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    console.log('Current URL:', page.url());
    
    // Check if form exists
    const hasForm = await page.locator('form').count();
    console.log('Forms found:', hasForm);
    
    // Get page title and content
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for input fields
    const inputs = await page.locator('input').count();
    console.log('Input fields found:', inputs);
    
    // Get all input types
    const inputTypes = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({ type: input.type, name: input.name, placeholder: input.placeholder }))
    );
    console.log('Input details:', inputTypes);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickAuth();
