import { test, expect } from '@playwright/test';

test.describe('Simple Gallery Workflow - E2E Tests', () => {
  test('should create and display gallery with existing images', async ({ page }) => {
    console.log('🚀 Starting simple gallery workflow test...');

    // Navigate to images page first to ensure proper context
    await page.goto('/images');
    await page.waitForLoadState('networkidle');

    // First create some test images to work with
    const imageData = await page.evaluate(async () => {
      const baseUrl = window.location.origin;
      
      // Create 2 test images first
      const createPromises = [];
      for (let i = 1; i <= 2; i++) {
        createPromises.push(
          fetch(`${baseUrl}/api/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Simple Test Image ${Date.now()}-${i}`,
              description: 'Simple test image for gallery',
              url: '/placeholder.png',
              tags: ['simple-test']
            })
          }).then(res => res.json())
        );
      }
      
      const imageResults = await Promise.all(createPromises);
      const imageIds = imageResults
        .filter(result => result.success)
        .map(result => result.data.id);
      
      console.log(`✅ Created ${imageIds.length} test images`);
      return imageIds;
    });

    if (imageData.length === 0) {
      throw new Error('Failed to create test images');
    }

    // Now create gallery via API with existing images
    const result = await page.evaluate(async () => {
      try {
        // Get base URL and fetch existing images
        const baseUrl = window.location.origin;
        const imagesResponse = await fetch(`${baseUrl}/api/images`);
        
        if (!imagesResponse.ok) {
          throw new Error(`Failed to fetch images: ${imagesResponse.status}`);
        }
        
        const imagesResult = await imagesResponse.json();
        const images = imagesResult?.success && imagesResult?.data?.data ? imagesResult.data.data : [];
        console.log(`📊 Found ${images.length} total images`);
        
        // Use any 2 existing images to keep it simple  
        const availableImageIds = images.slice(0, 2).map((img: { id: string }) => img.id);
        console.log(`🖼️ Using ${availableImageIds.length} existing images for gallery`);
        
        // Create gallery with minimal requirements
        console.log('🏗️ Creating test gallery...');
        const galleryResponse = await fetch(`${baseUrl}/api/galleries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Simple E2E Gallery ${Date.now()}`,
            description: 'Simple E2E test gallery',
            isPublic: true,
            images: availableImageIds.map((id: string, index: number) => ({ 
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
          imageCount: availableImageIds.length 
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
