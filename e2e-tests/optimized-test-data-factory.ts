import { Page, BrowserContext } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Optimized test data factories for faster test setup
 */
export class OptimizedTestDataFactory {
  private static imageCache: Map<string, string> = new Map();
  private static userSessions: Map<string, any> = new Map();

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

    // Create new images
    console.log(`🖼️ Creating ${count} fresh test images`);
    const imageIds = await TestHelpers.uploadTestImages(page, count);
    
    if (useCache && imageIds.length > 0) {
      this.imageCache.set(cacheKey, imageIds.join(','));
    }

    return imageIds;
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
    const { name = 'E2E Test Gallery', imageCount = 3, useExistingImages = true } = options;

    // Get or create images
    let imageIds: string[] = [];
    if (useExistingImages) {
      imageIds = await this.getExistingTestImages(page, imageCount);
    }
    
    if (imageIds.length < imageCount) {
      const needed = imageCount - imageIds.length;
      const newImages = await this.createTestImages(page, needed, true);
      imageIds.push(...newImages);
    }

    // Create gallery via API for speed
    const galleryId = await page.evaluate(async ({ name, imageIds }) => {
      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: 'E2E test gallery',
          imageIds
        })
      });
      
      if (!response.ok) throw new Error('Failed to create test gallery');
      const result = await response.json();
      return result.id;
    }, { name, imageIds });

    return { galleryId, imageIds };
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
        const existingIds = images.map((img: any) => img.id);
        
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
      const imageIds = await page.evaluate(async (neededCount) => {
        const response = await fetch('/api/images');
        if (!response.ok) return [];
        
        const images = await response.json();
        return images
          .filter((img: any) => img.title?.includes('E2E') || img.title?.includes('Test'))
          .slice(0, neededCount)
          .map((img: any) => img.id);
      }, count);

      return imageIds || [];
    } catch {
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
        const promises: Promise<any>[] = [];

        if (cleanGalleries) {
          promises.push(
            fetch('/api/galleries').then(async (response) => {
              if (!response.ok) return;
              const galleries = await response.json();
              const testGalleries = galleries.filter((g: any) => 
                g.name?.includes('E2E') || g.name?.includes('Test')
              );
              
              return Promise.all(
                testGalleries.map((g: any) =>
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
              const testImages = images.filter((img: any) => 
                img.title?.includes('E2E') || img.title?.includes('Test')
              );
              
              return Promise.all(
                testImages.map((img: any) =>
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
      await context.addCookies(sessionData.cookies);
      await context.storageState({ path: sessionData.statePath });
      return;
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
}
