/**
 * Central location for all Zod schemas used in the application
 * These schemas provide both runtime validation and TypeScript types
 */

import { z } from "zod";
import { UserRole } from "@prisma/client";

/**
 * User Schema
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  emailVerified: z.date().nullable().optional(),
  image: z.string().url().nullable().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Tag Schema
 */
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;

/**
 * Image Schema
 */
export const ImageSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  url: z.string().url(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(TagSchema).optional(),
});

export type Image = z.infer<typeof ImageSchema>;

/**
 * Gallery Schema
 */
export const GallerySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  userId: z.string(),
  coverImageId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Theming options
  themeColor: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  displayMode: z.string().nullable().optional(),
  layoutType: z.string().nullable().optional(),
});

export type Gallery = z.infer<typeof GallerySchema>;

/**
 * ImageInGallery Schema
 */
export const ImageInGallerySchema = z.object({
  id: z.string(),
  imageId: z.string(),
  galleryId: z.string(),
  description: z.string().nullable().optional(),
  order: z.number().default(0),
  createdAt: z.date(),
  image: ImageSchema.optional(),
  gallery: GallerySchema.optional(),
});

export type ImageInGallery = z.infer<typeof ImageInGallerySchema>;

/**
 * API Request Schemas
 */

export const CreateGallerySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  images: z.array(z.object({
    id: z.string(),
    description: z.string().nullable().optional(),
    order: z.number().optional(),
  })).optional(),
  coverImageId: z.string().nullable().optional(),
  // Theming options
  themeColor: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  backgroundImageUrl: z.string().url().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  displayMode: z.string().optional().nullable(),
  layoutType: z.string().optional().nullable(),
});

export const UpdateGallerySchema = CreateGallerySchema.extend({
  id: z.string(),
  images: z.array(z.object({
    id: z.string(),
    imageId: z.string().optional(), // Add imageId for temp images
    description: z.string().nullable().optional(),
    order: z.number().int().nonnegative().optional(), // Require explicit numeric order
  })).optional(),
  // New field for adding images
  addImages: z.array(z.string()).optional(),
});

export const CreateImageSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
});

export const UpdateImageSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * API Response Schemas
 */

// Schema for validation issues in API responses
export const ValidationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});

// Define API response schemas
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
  issues: z.array(ValidationIssueSchema).optional(),
});

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

// Combine into a discriminated union
export const ApiResponseSchema = z.discriminatedUnion('success', [
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
]);

// Type-safe API response schemas for specific data types
export const createApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiSuccessResponseSchema.extend({
    data: dataSchema,
  });

// Pagination metadata schema
export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
  perPage: z.number().int().positive(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  nextPage: z.number().nullable(),
  prevPage: z.number().nullable(),
});

// Paginated response schema
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

// Helper to create typed API success response schemas
export const GalleryResponseSchema = createApiSuccessSchema(GallerySchema);
export const ImageResponseSchema = createApiSuccessSchema(ImageSchema);
export const UserResponseSchema = createApiSuccessSchema(UserSchema);
export const PaginatedImagesResponseSchema = createApiSuccessSchema(
  createPaginatedResponseSchema(ImageSchema)
);
