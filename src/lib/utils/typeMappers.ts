/**
 * Utility functions for mapping between schema-derived types
 * This centralizes the mapping logic and ensures consistency across the application
 */
import { z } from 'zod';
import { 
  ImageSchema, 
  ImageInGallerySchema,
  GallerySchema
} from '@/lib/schemas';

/**
 * Schema for display images (used by UI components)
 * This matches the Image interfaces used by GalleryCarousel and GalleryFullscreen
 */
export const DisplayImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.object({
    id: z.string(),
    name: z.string()
  })).optional(),
});

export type DisplayImage = z.infer<typeof DisplayImageSchema>;

/**
 * Maps an ImageInGallery to a DisplayImage, using the gallery-specific description
 * Handles possible undefined image values safely
 */
export function mapGalleryImageToDisplayImage(
  imageInGallery: z.infer<typeof ImageInGallerySchema>
): DisplayImage {
  if (!imageInGallery.image) {
    // Create a safe fallback if image is undefined
    return {
      id: imageInGallery.imageId,
      url: '', // Will need to be handled by the UI
      title: 'Image not found',
    };
  }
  
  return {
    id: imageInGallery.image.id,
    url: imageInGallery.image.url,
    title: imageInGallery.image.title,
    description: imageInGallery.description || undefined, // Convert null to undefined
    tags: imageInGallery.image.tags,
  };
}

/**
 * Maps an array of ImageInGallery objects to component-compatible DisplayImage objects
 */
export function mapGalleryImagesToDisplayImages(
  imagesInGallery: z.infer<typeof ImageInGallerySchema>[]
): DisplayImage[] {
  return imagesInGallery
    .filter(img => img.image) // Filter out any with undefined image
    .map(img => ({
      id: img.image!.id, 
      url: img.image!.url,
      title: img.image!.title,
      description: img.description || undefined, // Convert null to undefined for component compatibility
      tags: img.image!.tags
    }));
}

/**
 * Extended Gallery schema for the UI components
 * This adds computed fields and helper methods for UI components
 */
export const DisplayGallerySchema = GallerySchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable().optional(),
  }),
  images: z.array(ImageInGallerySchema),
  coverImage: ImageSchema.nullable().optional(),
});

export type DisplayGallery = z.infer<typeof DisplayGallerySchema>;

/**
 * Find an ImageInGallery by image ID
 */
export function findImageInGallery(
  gallery: DisplayGallery,
  imageId: string
): z.infer<typeof ImageInGallerySchema> | undefined {
  return gallery.images.find(img => img.image && img.image.id === imageId);
}

/**
 * Find an ImageInGallery's index in the gallery
 */
export function findImageInGalleryIndex(
  gallery: DisplayGallery,
  imageId: string
): number {
  return gallery.images.findIndex(img => img.image && img.image.id === imageId);
}
