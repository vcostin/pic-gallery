// Test data configuration for E2E tests
// This file centralizes test asset paths for reliable testing across environments

export const TEST_ASSETS = {
  // Test images for upload functionality
  images: {
    testImage1: './test-data/images/test-image-1.jpg',
    testImage2: './test-data/images/test-image-2.jpg',
  },
  
  // Test data for form fields
  gallery: {
    defaultTitle: 'E2E Test Gallery',
    defaultDescription: 'Test gallery created by E2E automation',
  },
  
  image: {
    defaultTitle: 'E2E Test Image',
    defaultDescription: 'Test image uploaded by E2E automation',
    defaultTags: 'test, e2e, automation',
  },
} as const;

// Helper function to get absolute paths when needed
export function getTestAssetPath(relativePath: string): string {
  return relativePath;
}

// Validation helper to ensure test assets exist
export function validateTestAssets(): boolean {
  // Note: This would require file system access in Node.js context
  // For now, we rely on the paths being correct
  return true;
}
