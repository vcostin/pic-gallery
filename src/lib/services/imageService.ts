/**
 * Image service for interacting with the image API
 * Using Zod schemas for validation
 * 
 * All API endpoints return a standardized response format:
 * { success: true, data: T } where T is the actual data
 * 
 * This service validates responses using appropriate schemas and returns just the data
 * portion to simplify usage in components.
 */
import { z } from 'zod';
import { fetchApi } from '../apiUtils';
import { 
  ImageSchema,
  CreateImageSchema, 
  UpdateImageSchema,
  PaginatedImagesResponseSchema,
  ImageResponseSchema,
  FlexibleImagesResponseSchema
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

// User images response schema - ensures the API response
// format { success: true, data: Image[] } is properly validated
const UserImagesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ImageSchema)
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
    
    /**
     * Use fetchApi with FlexibleImagesResponseSchema to handle different response formats:
     * 1. Array format directly [Image1, Image2, ...] 
     * 2. Object format with data/meta: { data: [], meta: {...} }
     * 3. Standard response format: { success: true, data: { data: [], meta: {...} } }
     * 
     * The schema's preprocessing normalizes these formats before validation,
     * ensuring we maintain proper schema validation while handling the API's 
     * inconsistent response formats.
     */
    const response = await fetchApi(url, { signal }, FlexibleImagesResponseSchema);
    return response.data;
  },

  /**
   * Get an image by ID
   */
  async getImage(id: string, signal?: AbortSignal): Promise<Image> {
    // Use ImageResponseSchema (which is a createApiSuccessSchema(ImageSchema))
    return fetchApi(`/api/images/${id}`, { signal }, ImageResponseSchema).then(response => response.data);
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

    // Use ImageResponseSchema to validate the standard API response format
    return fetchApi('/api/images', {
      method: 'POST',
      body: JSON.stringify(imageData),
      signal
    }, ImageResponseSchema).then(response => response.data);
  },

  /**
   * Update an existing image
   */
  async updateImage(id: string, imageData: UpdateImageData, signal?: AbortSignal): Promise<Image> {
    // Validate input data
    UpdateImageSchema.parse({ ...imageData, id });
    
    // Use ImageResponseSchema to validate the standard API response format
    return fetchApi(`/api/images/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(imageData),
      signal
    }, ImageResponseSchema).then(response => response.data);
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
    const response = await fetchApi(`/api/users/${userId}/images`, { signal }, UserImagesResponseSchema);
    return response.data;
  }
};
