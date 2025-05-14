/**
 * Image service for interacting with the image API
 * Using Zod schemas for validation
 */
import { z } from 'zod';
import { fetchApi } from '../apiUtils';
import { 
  ImageSchema,
  CreateImageSchema, 
  UpdateImageSchema,
  PaginatedImagesResponseSchema
} from '../schemas';

// Type definitions derived from schemas
export type Image = z.infer<typeof ImageSchema>;
export type CreateImageData = z.infer<typeof CreateImageSchema>;
export type UpdateImageData = z.infer<typeof UpdateImageSchema>;
export type PaginatedImages = z.infer<typeof PaginatedImagesResponseSchema>['data'];

// Upload response schema
const UploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    url: z.string()
  })
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

/**
 * Service for interacting with the image API
 */
export const ImageService = {
  /**
   * Get all images with optional filtering and pagination
   * @param params Search and pagination parameters
   */
  async getImages(params?: { 
    searchQuery?: string; 
    tag?: string; 
    page?: number;
    limit?: number;
  }, signal?: AbortSignal): Promise<PaginatedImages> {
    const queryParams = new URLSearchParams();
    if (params?.searchQuery) queryParams.set('searchQuery', params.searchQuery);
    if (params?.tag) queryParams.set('tag', params.tag);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const url = `/api/images${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return fetchApi(url, { signal }, PaginatedImagesResponseSchema).then(response => response.data);
  },

  /**
   * Get an image by ID
   */
  async getImage(id: string, signal?: AbortSignal): Promise<Image> {
    return fetchApi(`/api/images/${id}`, { signal }, ImageSchema);
  },

  /**
   * Upload a file and create an image record
   * This is a two-step process:
   * 1. Upload the file to get a URL
   * 2. Create an image record with the URL
   */
  async uploadAndCreateImage(
    file: File, 
    imageData: Omit<CreateImageData, 'url'>,
    signal?: AbortSignal
  ): Promise<Image> {
    // Step 1: Upload file
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'File upload failed');
    }

    const uploadResult = await uploadResponse.json();
    const validatedUpload = UploadResponseSchema.parse(uploadResult);
    
    // Step 2: Create image record
    return this.createImage({
      ...imageData,
      url: validatedUpload.data.url
    }, signal);
  },

  /**
   * Create a new image
   */
  async createImage(imageData: CreateImageData, signal?: AbortSignal): Promise<Image> {
    // Validate input data
    CreateImageSchema.parse(imageData);

    return fetchApi('/api/images', {
      method: 'POST',
      body: JSON.stringify(imageData),
      signal
    }, ImageSchema);
  },

  /**
   * Update an existing image
   */
  async updateImage(id: string, imageData: UpdateImageData, signal?: AbortSignal): Promise<Image> {
    // Validate input data
    UpdateImageSchema.parse({ ...imageData, id });
    
    return fetchApi(`/api/images/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(imageData),
      signal
    }, ImageSchema);
  },

  /**
   * Delete an image
   */
  async deleteImage(id: string, signal?: AbortSignal): Promise<void> {
    await fetch(`/api/images/${id}`, {
      method: 'DELETE',
      signal
    });
  },

  /**
   * Get images for a specific user
   */
  async getUserImages(userId: string, signal?: AbortSignal): Promise<Image[]> {
    return fetchApi(`/api/users/${userId}/images`, { signal }, z.array(ImageSchema));
  }
};
