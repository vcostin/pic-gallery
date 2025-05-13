/**
 * Utility functions for mapping between schema-derived types for image selection
 */
import { z } from 'zod';
import { ImageSchema, TagSchema } from '../schemas';

/**
 * Schema for image selection in UI
 */
export const SelectableImageSchema = ImageSchema.pick({
  id: true,
  title: true,
  description: true,
  url: true,
  userId: true
}).extend({
  tags: z.array(TagSchema).optional()
});

export type SelectableImage = z.infer<typeof SelectableImageSchema>;

/**
 * Maps full image data to a format compatible with image selection UI components
 */
export function mapToSelectableImage(image: z.infer<typeof ImageSchema>): SelectableImage {
  return {
    id: image.id,
    title: image.title,
    description: image.description,
    url: image.url,
    userId: image.userId,
    tags: image.tags
  };
}

/**
 * Maps an array of images to selectable image format
 */
export function mapToSelectableImages(images: z.infer<typeof ImageSchema>[]): SelectableImage[] {
  return images.map(mapToSelectableImage);
}

/**
 * Schema for the response of selectable images API
 */
// Schema for wrapped API response that includes success flag
export const ApiResponseWrapperSchema = <T extends z.ZodTypeAny>(schema: T) => 
  z.object({
    success: z.boolean(),
    data: schema
  });

// Schema for the paginated response structure
export const SelectableImageResponseSchema = ApiResponseWrapperSchema(
  z.object({
    data: z.array(SelectableImageSchema),
    meta: z.object({
      total: z.number(),
      currentPage: z.number(),
      lastPage: z.number(),
      perPage: z.number(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
      nextPage: z.number().nullable(),
      prevPage: z.number().nullable()
    })
  })
);

export type SelectableImageResponse = z.infer<typeof SelectableImageResponseSchema>;
