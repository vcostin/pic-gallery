/**
 * Minimal global teardown for single-user strategy
 * User deletion happens in the final test sequence for verification
 */
async function globalTeardown() {
  console.log('🧹 E2E Global Teardown - User deletion handled in test sequence');
  
  // Minimal teardown since user deletion happens in the final test
  // This ensures we can verify the deletion worked properly
  console.log('✅ Global Teardown Complete');
}

export default globalTeardown;
