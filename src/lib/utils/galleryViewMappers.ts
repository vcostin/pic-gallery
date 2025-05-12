/**
 * Utility functions for mapping between schema-derived types for Gallery View
 */
import { z } from 'zod';
import { 
  GallerySchema,
  TagSchema
} from '../schemas';
import { DisplayGallery } from './typeMappers';

/**
 * Schema for Gallery View
 * Simplified version of the DisplayGallery for view-only components
 */
export const GalleryViewSchema = GallerySchema.pick({
  id: true,
  title: true,
  description: true,
  isPublic: true,
  userId: true,
  themeColor: true,
  coverImageId: true,
}).extend({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable().optional(),
  }),
  images: z.array(z.object({
    id: z.string(),
    description: z.string().nullable().optional(),
    image: z.object({
      id: z.string(),
      url: z.string(),
      title: z.string(),
      tags: z.array(TagSchema).optional(),
    }),
  })),
});

export type GalleryViewType = z.infer<typeof GalleryViewSchema>;

/**
 * Transform a full DisplayGallery to GalleryViewType format
 */
export function mapToGalleryView(gallery: DisplayGallery): GalleryViewType {
  return {
    id: gallery.id,
    title: gallery.title,
    description: gallery.description,
    isPublic: gallery.isPublic,
    userId: gallery.userId,
    themeColor: gallery.themeColor,
    user: {
      id: gallery.user.id,
      name: gallery.user.name,
      image: gallery.user.image
    },
    images: gallery.images.filter(img => img.image).map(img => ({
      id: img.id,
      description: img.description,
      image: {
        id: img.image!.id,
        url: img.image!.url,
        title: img.image!.title,
        tags: img.image!.tags
      }
    }))
  };
}

/**
 * Helper to create a simplified gallery image object for display
 */
export function createSimpleGalleryImage(imageId: string, imageUrl: string, title: string, description: string | null = null) {
  return {
    id: `temp-${Date.now()}`,
    description,
    image: {
      id: imageId,
      url: imageUrl,
      title,
      tags: []
    }
  };
}
