import { Page, BrowserContext, Cookie } from '@playwright/test';
import { TestHelpers } from './test-helpers';

interface SessionData {
  cookies: Cookie[];
  statePath: string;
}

/**
 * Optimized test data factories for faster test setup
 */
export class OptimizedTestDataFactory {
  private static imageCache: Map<string, string> = new Map();
  private static userSessions: Map<string, SessionData> = new Map();

  /**
   * Create optimized test images with caching
   */
  static async createTestImages(
    page: Page,
    count: number = 3,
    useCache: boolean = true
  ): Promise<string[]> {
    const cacheKey = `images_${count}`;
    
    if (useCache && this.imageCache.has(cacheKey)) {
      const cachedIds = this.imageCache.get(cacheKey)!.split(',');
      
      // Verify cached images still exist
      const stillExist = await this.verifyImagesExist(page, cachedIds);
      if (stillExist) {
        console.log(`📁 Using ${count} cached test images`);
        return cachedIds;
      }
    }

    // First try to get existing images
    const existingImageIds = await this.getExistingTestImages(page, count);
    if (existingImageIds.length >= count) {
      console.log(`🔄 Reusing ${count} existing test images`);
      if (useCache) {
        this.imageCache.set(cacheKey, existingImageIds.slice(0, count).join(','));
      }
      return existingImageIds.slice(0, count);
    }

    // Create new images only if needed
    const needed = count - existingImageIds.length;
    console.log(`🖼️ Creating ${needed} fresh test images (${existingImageIds.length} existing)`);
    
    const newImageTitles = await TestHelpers.uploadTestImages(page, needed);
    
    // Get the actual database IDs for the newly created images with validation
    const newImageIds = await this.getImageIdsByTitles(page, newImageTitles);
    
    // Validate that we actually got the expected number of image IDs
    if (newImageIds.length !== newImageTitles.length) {
      console.warn(`⚠️ Expected ${newImageTitles.length} new images but only found ${newImageIds.length} in database`);
      console.warn(`Missing images: ${newImageTitles.filter((title, i) => !newImageIds[i])}`);
      
      // If we have some existing images, fall back to using more of those
      if (existingImageIds.length > 0) {
        const allExisting = await this.getExistingTestImages(page, count + 10); // Get more existing images
        const finalImageIds = allExisting.slice(0, count);
        
        if (finalImageIds.length >= count) {
          console.log(`✅ Falling back to ${finalImageIds.length} existing images`);
          if (useCache) {
            this.imageCache.set(cacheKey, finalImageIds.join(','));
          }
          return finalImageIds;
        }
      }
      
      // If we still don't have enough images, throw an error
      if (existingImageIds.length + newImageIds.length < count) {
        throw new Error(`Failed to create sufficient test images: needed ${count}, got ${existingImageIds.length + newImageIds.length}`);
      }
    }
    
    const allImageIds = [...existingImageIds, ...newImageIds];
    
    if (useCache && allImageIds.length > 0) {
      this.imageCache.set(cacheKey, allImageIds.slice(0, count).join(','));
    }

    return allImageIds.slice(0, count);
  }

  /**
   * Create test gallery with minimal setup
   */
  static async createTestGallery(
    page: Page,
    options: {
      name?: string;
      imageCount?: number;
      useExistingImages?: boolean;
    } = {}
  ): Promise<{ galleryId: string; imageIds: string[] }> {
    const { name = 'E2E Test Gallery', imageCount = 3 } = options;

    // Always create fresh images for galleries to avoid constraint violations
    const imageIds = await this.createTestImages(page, imageCount, true);

    // Create gallery via API for speed
    const result = await page.evaluate(async ({ name, imageIds }) => {
      try {
        const response = await fetch('/api/galleries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: name, // Changed from 'name' to 'title'
            description: 'E2E test gallery',
            isPublic: true, // Added required field
            images: imageIds.map((id, index) => ({ 
              id, 
              order: index,
              description: null 
            }))
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create test gallery: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        console.log('Gallery creation result:', result);
        return { success: true, galleryId: result.data?.id, result };
      } catch (error) {
        console.error('Gallery creation error:', error);
        return { success: false, error: error.message };
      }
    }, { name, imageIds });

    if (!result.success || !result.galleryId) {
      throw new Error(`Failed to create gallery: ${result.error || 'Unknown error'}`);
    }

    return { galleryId: result.galleryId, imageIds };
  }

  /**
   * Verify cached images still exist
   */
  private static async verifyImagesExist(page: Page, imageIds: string[]): Promise<boolean> {
    try {
      const existingCount = await page.evaluate(async (ids) => {
        const response = await fetch('/api/images');
        if (!response.ok) return 0;
        
        const images = await response.json();
        if (!Array.isArray(images)) return 0;
        const existingIds = images.map((img: { id: string }) => img.id);
        
        return ids.filter(id => existingIds.includes(id)).length;
      }, imageIds);

      return existingCount === imageIds.length;
    } catch {
      return false;
    }
  }

  /**
   * Get existing test images to reuse
   */
  private static async getExistingTestImages(page: Page, count: number): Promise<string[]> {
    try {
      // Check if page context is still valid before making API calls
      if (page.isClosed()) {
        console.log('⚠️ Page context is closed, cannot fetch existing images');
        return [];
      }

      const imageIds = await page.evaluate(async (neededCount) => {
        try {
          console.log('🔍 Fetching existing E2E test images from API...');
          
          // Add timeout and error handling for fetch
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const response = await fetch(`http://localhost:3000/api/images?limit=100`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.log('❌ API response not ok:', response.status);
            return [];
          }
          
          const result = await response.json();
          console.log('📝 API response structure:', typeof result, Object.keys(result || {}));
          
          // Handle the paginated API response structure: { success: true, data: { data: Image[], meta: {...} } }
          const images = result?.success && result?.data?.data ? result.data.data : [];
          console.log(`📊 Found ${images.length} total images in API response`);
          
          if (!Array.isArray(images)) {
            console.log('❌ Images is not an array:', typeof images);
            return [];
          }
          
          const e2eImages = images.filter((img: { title?: string; id: string }) => 
            img.title?.includes('E2E') || img.title?.includes('Test')
          );
          console.log(`🎯 Found ${e2eImages.length} E2E test images`);
          
          const selectedImages = e2eImages.slice(0, neededCount);
          console.log(`✅ Returning ${selectedImages.length} image IDs for reuse`);
          
          return selectedImages.map((img: { id: string }) => img.id);
        } catch (fetchError) {
          console.log('❌ Fetch error in browser context:', fetchError.message);
          return [];
        }
      }, count);

      return imageIds || [];
    } catch (error) {
      console.log('❌ Error in getExistingTestImages:', error);
      return [];
    }
  }

  /**
   * Get database IDs for images by their titles
   */
  private static async getImageIdsByTitles(page: Page, titles: string[]): Promise<string[]> {
    try {
      const imageIds = await page.evaluate(async (imageTitles) => {
        console.log('🔍 Looking up image IDs for titles:', imageTitles);
        const response = await fetch('/api/images?limit=100'); // Get more images
        if (!response.ok) {
          console.log('❌ API response not ok:', response.status);
          return [];
        }
        
        const result = await response.json();
        // Handle the paginated API response structure: { success: true, data: { data: Image[], meta: {...} } }
        const images = result?.success && result?.data?.data ? result.data.data : [];
        
        if (!Array.isArray(images)) {
          console.log('❌ Images is not an array:', typeof images);
          return [];
        }
        
        const idMap: string[] = [];
        for (const title of imageTitles) {
          const image = images.find((img: { title?: string; id: string }) => img.title === title);
          if (image) {
            idMap.push(image.id);
            console.log(`✅ Found ID ${image.id} for title: ${title}`);
          } else {
            console.log(`❌ No image found for title: ${title}`);
          }
        }
        console.log(`📊 Mapped ${idMap.length}/${imageTitles.length} titles to IDs`);
        return idMap;
      }, titles);

      return imageIds || [];
    } catch (error) {
      console.log('❌ Error in getImageIdsByTitles:', error);
      return [];
    }
  }

  /**
   * Clean up test data efficiently
   */
  static async cleanupTestData(
    page: Page,
    options: {
      images?: boolean;
      galleries?: boolean;
      keepCache?: boolean;
    } = {}
  ): Promise<void> {
    const { images = true, galleries = true, keepCache = false } = options;

    try {
      await page.evaluate(async ({ cleanImages, cleanGalleries }) => {
        const promises: Promise<unknown>[] = [];

        if (cleanGalleries) {
          promises.push(
            fetch('/api/galleries').then(async (response) => {
              if (!response.ok) return;
              const galleries = await response.json();
              // Ensure galleries is an array to prevent filter errors
              if (!Array.isArray(galleries)) return;
              const testGalleries = galleries.filter((g: { name?: string; title?: string; id: string }) => 
                g && (g.name || g.title) && ((g.name?.includes('E2E') || g.name?.includes('Test')) || 
                (g.title?.includes('E2E') || g.title?.includes('Test')))
              );
              
              return Promise.all(
                testGalleries.map((g: { id: string }) =>
                  fetch(`/api/galleries/${g.id}`, { method: 'DELETE' })
                )
              );
            })
          );
        }

        if (cleanImages) {
          promises.push(
            fetch('/api/images').then(async (response) => {
              if (!response.ok) return;
              const images = await response.json();
              // Ensure images is an array to prevent filter errors
              if (!Array.isArray(images)) return;
              const testImages = images.filter((img: { title?: string; id: string }) => 
                img && img.title && (img.title?.includes('E2E') || img.title?.includes('Test'))
              );
              
              return Promise.all(
                testImages.map((img: { id: string }) =>
                  fetch(`/api/images/${img.id}`, { method: 'DELETE' })
                )
              );
            })
          );
        }

        await Promise.all(promises);
      }, { cleanImages: images, cleanGalleries: galleries });

      if (!keepCache) {
        this.clearCache();
      }
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }

  /**
   * Create authenticated test session
   */
  static async createTestSession(
    context: BrowserContext,
    userInfo: { email: string; password: string }
  ): Promise<void> {
    const sessionKey = userInfo.email;
    
    if (this.userSessions.has(sessionKey)) {
      const sessionData = this.userSessions.get(sessionKey);
      if (sessionData) {
        await context.addCookies(sessionData.cookies);
        await context.storageState({ path: sessionData.statePath });
        return;
      }
    }

    // Create new session
    const page = await context.newPage();
    await page.goto('/auth/login');
    
    await TestHelpers.quickLogin(page, userInfo.email, userInfo.password);
    
    // Save session
    const cookies = await context.cookies();
    const statePath = `./test-results/auth-state-${Date.now()}.json`;
    await context.storageState({ path: statePath });
    
    this.userSessions.set(sessionKey, { cookies, statePath });
    await page.close();
  }

  /**
   * Batch API operations for efficiency
   */
  static async batchOperation<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(op => op()));
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }
    
    return results;
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.imageCache.clear();
    this.userSessions.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    images: number;
    sessions: number;
  } {
    return {
      images: this.imageCache.size,
      sessions: this.userSessions.size
    };
  }

  /**
   * Create test images directly via API (much faster than UI uploads)
   */
  static async createTestImagesViaAPI(
    page: Page,
    count: number = 3,
    options: { 
      useCache?: boolean;
      titlePrefix?: string;
    } = {}
  ): Promise<string[]> {
    const { useCache = true, titlePrefix = 'E2E Test Image' } = options;
    const cacheKey = `api_images_${count}_${titlePrefix}`;
    
    if (useCache && this.imageCache.has(cacheKey)) {
      const cachedIds = this.imageCache.get(cacheKey)!.split(',');
      
      // Verify cached images still exist
      const stillExist = await this.verifyImagesExist(page, cachedIds);
      if (stillExist) {
        console.log(`📁 Using ${count} cached test images`);
        return cachedIds;
      }
    }

    // First try to get existing images
    const existingImageIds = await this.getExistingTestImages(page, count);
    if (existingImageIds.length >= count) {
      console.log(`🔄 Reusing ${count} existing test images`);
      if (useCache) {
        this.imageCache.set(cacheKey, existingImageIds.slice(0, count).join(','));
      }
      return existingImageIds.slice(0, count);
    }

    // Create new images via API only if needed
    const needed = count - existingImageIds.length;
    console.log(`🚀 Creating ${needed} test images via API (${existingImageIds.length} existing)`);
    
    const newImageIds = await this.createImagesDirectlyViaAPI(page, needed, titlePrefix);
    
    const allImageIds = [...existingImageIds, ...newImageIds];
    
    if (useCache && allImageIds.length > 0) {
      this.imageCache.set(cacheKey, allImageIds.slice(0, count).join(','));
    }

    return allImageIds.slice(0, count);
  }

  /**
   * Create images directly via API without UI interaction
   */
  private static async createImagesDirectlyViaAPI(
    page: Page,
    count: number,
    titlePrefix: string = 'E2E Test Image'
  ): Promise<string[]> {
    const uniqueId = Date.now();
    const imageIds: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const imageName = `${titlePrefix} ${uniqueId}-${i + 1}`;
        
        // Create image directly via API
        const result = await page.evaluate(async ({ title }) => {
          try {
            // For test purposes, we'll use a static URL since we don't need actual file uploads
            // In a real scenario, you might upload to a test file location
            const testUrl = `/test-images/placeholder-${Math.random()}.png`;
            
            const response = await fetch('http://localhost:3000/api/images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description: `Test image created via API for E2E testing`,
                url: testUrl,
                tags: ['e2e', 'test', 'api-created']
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to create image: ${response.status} ${errorText}`);
            }
            
            const imageResult = await response.json();
            console.log(`✅ Created image via API: ${title} (ID: ${imageResult.data?.id})`);
            return { success: true, imageId: imageResult.data?.id };
          } catch (error) {
            console.error('❌ API image creation error:', error);
            return { success: false, error: error.message };
          }
        }, { title: imageName });

        if (result.success && result.imageId) {
          imageIds.push(result.imageId);
        } else {
          console.error(`Failed to create image ${imageName}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error creating image ${i + 1}:`, error);
      }
    }

    console.log(`🎉 Successfully created ${imageIds.length}/${count} images via API`);
    return imageIds;
  }
}
