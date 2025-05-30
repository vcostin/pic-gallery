import { chromium, FullConfig } from '@playwright/test';
import { ensureTestImagesExist } from './test-assets-ci';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup with test assets...');
  
  // Ensure test images exist, especially in CI
  if (process.env.CI) {
    console.log('📸 CI environment detected, ensuring test images exist...');
    await ensureTestImagesExist();
  }
  
  // Call the existing global setup
  const { default: originalGlobalSetup } = await import('./global-setup');
  if (originalGlobalSetup) {
    await originalGlobalSetup(config);
  }
  
  console.log('✅ Global setup with assets complete!');
}

export default globalSetup;
