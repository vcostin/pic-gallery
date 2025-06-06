import { test, expect } from '@playwright/test';

test.describe('Simple Gallery Workflow - E2E Tests', () => {
  test('should create and display gallery with existing images', async ({ page }) => {
    console.log('🚀 Starting simple gallery workflow test...');

    // Simplified approach: Create gallery via API with existing images
    const result = await page.evaluate(async () => {
      try {
        // Get existing images from the API
        console.log('🔍 Fetching existing images...');
        const imagesResponse = await fetch(`${window.location.origin}/api/images?limit=20`);
        if (!imagesResponse.ok) {
          throw new Error(`Failed to fetch images: ${imagesResponse.status}`);
        }
        
        const imagesResult = await imagesResponse.json();
        const images = imagesResult?.success && imagesResult?.data?.data ? imagesResult.data.data : [];
        console.log(`📊 Found ${images.length} total images`);
        
        // Use any 2 existing images to keep it simple  
        const imageIds = images.slice(0, 2).map((img: { id: string }) => img.id);
        console.log(`🖼️ Using ${imageIds.length} existing images for gallery`);
        
        // Create gallery with minimal requirements
        console.log('🏗️ Creating test gallery...');
        const galleryResponse = await fetch(`${window.location.origin}/api/galleries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Simple E2E Gallery ${Date.now()}`,
            description: 'Simple E2E test gallery',
            isPublic: true,
            images: imageIds.map((id: string, index: number) => ({ 
              id,
              order: index 
            }))
          })
        });
        
        if (!galleryResponse.ok) {
          const errorText = await galleryResponse.text();
          throw new Error(`Failed to create gallery: ${galleryResponse.status} - ${errorText}`);
        }
        
        const galleryResult = await galleryResponse.json();
        if (!galleryResult.success || !galleryResult.data?.id) {
          throw new Error('Gallery creation returned invalid response');
        }
        
        console.log(`✅ Created gallery with ID: ${galleryResult.data.id}`);
        return { 
          galleryId: galleryResult.data.id, 
          imageCount: imageIds.length 
        };
      } catch (error) {
        console.error('❌ Error in gallery creation:', error);
        throw error;
      }
    });

    // Navigate to the created gallery
    console.log(`🔗 Navigating to gallery: /galleries/${result.galleryId}`);
    await page.goto(`/galleries/${result.galleryId}`);
    await page.waitForLoadState('networkidle');
    
    // Simple verification that the gallery page loaded
    await expect(page.locator('h1, h2, [data-testid="gallery-title"]')).toBeVisible({ timeout: 10000 });
    
    // Verify images are displayed (if any)
    if (result.imageCount > 0) {
      await expect(page.locator('img, [data-testid="gallery-image"]').first()).toBeVisible({ timeout: 5000 });
      console.log('✅ Gallery images are visible');
    }
    
    console.log('✅ Simple gallery workflow test completed successfully');
  });
});
