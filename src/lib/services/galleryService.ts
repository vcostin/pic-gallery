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
   * Create a new gallery
   */
  async createGallery(galleryData: GalleryCreationData): Promise<FullGallery> {
    return fetchApi('/api/galleries', {
      method: 'POST',
      body: JSON.stringify(galleryData)
    }, FullGallerySchema);
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
  }
};
