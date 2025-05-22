/**
 * Utility functions for mapping between schema-derived types for image selection
 */
import { z } from 'zod';
import { ImageSchema, TagSchema } from '@/lib/schemas';

/**
 * Schema for image selection in UI
 */
export const SelectableImageSchema = ImageSchema.pick({
  id: true,
  title: true,
  description: true,
  url: true
}).extend({
  userId: z.string().optional(), // Make userId optional for backward compatibility
  createdAt: z.preprocess(
    (val) => (val instanceof Date ? val : new Date()),
    z.date()
  ).optional(),
  updatedAt: z.preprocess(
    (val) => (val instanceof Date ? val : new Date()),
    z.date()
  ).optional(),
  tags: z.array(TagSchema).optional()
});

export type SelectableImage = z.infer<typeof SelectableImageSchema>;

/**
 * Maps full image data to a format compatible with image selection UI components
 */
export function mapToSelectableImage(image: z.infer<typeof ImageSchema> | Partial<z.infer<typeof ImageSchema>>): SelectableImage {
  return {
    id: image.id || '', // Required
    title: image.title || '', // Required
    description: image.description, // Optional, can be null
    url: image.url || '', // Required
    userId: image.userId, // Optional now
    createdAt: image.createdAt, // Optional now
    updatedAt: image.updatedAt, // Optional now
    tags: image.tags || [] // Optional
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
