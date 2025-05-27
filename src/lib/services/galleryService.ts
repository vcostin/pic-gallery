/**
 * Gallery service for interacting with the gallery API
 * Using Zod schemas for validation
 */
import { z } from 'zod';
import { fetchApi } from '../apiUtils';
import { 
  GallerySchema,
  CreateGallerySchema,
  UpdateGallerySchema,
  FullGallerySchema,
  createPaginatedResponseSchema
} from '../schemas';

// Types derived from schemas
type GalleryCreationData = z.infer<typeof CreateGallerySchema>;
type GalleryUpdateData = z.infer<typeof UpdateGallerySchema>;
type FullGallery = z.infer<typeof FullGallerySchema>;
// Schema for paginated gallery responses
createPaginatedResponseSchema(GallerySchema);

/**
 * Service for interacting with the gallery API
 */
export const GalleryService = {
  /**
   * Get all galleries with optional filtering
   */
  async getGalleries(includePrivate = false): Promise<FullGallery[]> {
    const url = `/api/galleries${includePrivate ? '?includePrivate=true' : ''}`;
    return fetchApi(url, {}, z.array(FullGallerySchema));
  },

  /**
   * Get a gallery by ID
   */
  async getGallery(id: string): Promise<FullGallery> {
    return fetchApi(`/api/galleries/${id}`, {}, FullGallerySchema);
  },

  /**
   * Create a new gallery with validation and error handling
   */
  async createGallery(galleryData: GalleryCreationData): Promise<FullGallery> {
    // Validate image IDs before sending to API
    if (galleryData.images && galleryData.images.length > 0) {
      for (const img of galleryData.images) {
        if (!img.id || typeof img.id !== 'string') {
          throw new Error(`Invalid image ID in gallery creation payload: ${JSON.stringify(img)}`);
        }
      }
    }
    try {
      return await fetchApi('/api/galleries', {
        method: 'POST',
        body: JSON.stringify(galleryData)
      }, FullGallerySchema);
    } catch (err) {
      if (err instanceof Error && err.message && err.message.includes('Foreign key constraint')) {
        throw new Error('Database error: One or more image IDs are invalid or do not exist.');
      }
      throw err;
    }
  },

  /**
   * Update an existing gallery
   */
  async updateGallery(id: string, galleryData: GalleryUpdateData): Promise<FullGallery> {
    return fetchApi(`/api/galleries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(galleryData)
    }, FullGallerySchema);
  },

  /**
   * Delete a gallery
   */
  async deleteGallery(id: string): Promise<void> {
    await fetch(`/api/galleries/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Add images to a gallery
   */
  async addImages(galleryId: string, imageIds: string[]): Promise<FullGallery> {
    return fetchApi(`/api/galleries/${galleryId}`, {
      method: 'POST',
      body: JSON.stringify({ imageIds })
    }, FullGallerySchema);
  },

  /**
   * Remove an image from a gallery
   */
  async removeImage(galleryId: string, imageInGalleryId: string): Promise<FullGallery> {
    // Use the updateGallery method with an images array that explicitly doesn't include the removed image
    // Get the current gallery first
    const gallery = await this.getGallery(galleryId);
    
    // Create a new images array without the image to remove
    const updatedImages = gallery.images
      .filter(img => img.id !== imageInGalleryId)
      .map(img => ({
        id: img.id,
        description: img.description,
        order: img.order
      }));
    
    // Update the gallery with the filtered images array
    return this.updateGallery(galleryId, {
      id: galleryId,
      title: gallery.title,
      isPublic: gallery.isPublic,
      images: updatedImages
    });
  },

  /**
   * Update the order of images in a gallery
   */
  async updateImageOrder(galleryId: string, imageIds: string[]): Promise<FullGallery> {
    // First get the current gallery
    const gallery = await this.getGallery(galleryId);
    
    // Create a map of the existing images to preserve their data
    const imageMap = new Map(gallery.images.map(img => [img.id, img]));
    
    // Create updated images array with new order
    const updatedImages = imageIds.map((id, index) => {
      const imageData = imageMap.get(id);
      if (!imageData) {
        throw new Error(`Image with ID ${id} not found in gallery`);
      }
      
      return {
        id: imageData.id,
        description: imageData.description,
        order: index // Update the order based on position in the array
      };
    });
    
    // Update the gallery with the reordered images
    return this.updateGallery(galleryId, {
      id: galleryId,
      title: gallery.title,
      isPublic: gallery.isPublic,
      images: updatedImages
    });
  },
};
