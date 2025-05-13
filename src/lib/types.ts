/**
 * Centralized type definitions for the application
 * This helps maintain consistency and avoid duplication
 * 
 * Note: Core data types are now defined using Zod schemas in schemas.ts
 * Import specific types from there when needed
 */

// Import Zod-generated types
import { 
  User as ZodUser, 
  Image as ZodImage, 
  Gallery as ZodGallery,
  Tag as ZodTag,
  ImageInGallery as ZodImageInGallery
} from './schemas';
import { Gallery, ImageInGallery, Tag as PrismaTag, UserRole, Image as PrismaImage } from '@prisma/client';

// API Response types
export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

// Form state types
export interface FormState {
  isSubmitting: boolean;
  error: Error | null;
}

// UI component types
export type ViewMode = 'compact' | 'standard' | 'grid';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Export Prisma-defined types and Zod-generated types
export { UserRole } from '@prisma/client'; // Export UserRole as a value since it's an enum
export type { ZodUser as User, ZodImage as Image, ZodGallery as Gallery, ZodTag as Tag, ZodImageInGallery as ImageInGallery };

// Represents the 'image' object within FullImageInGallery
export interface FullImageInGalleryImage extends PrismaImage {
  tags: PrismaTag[];
  // PrismaImage already defines description as string | null
}

// Represents an item in the 'images' array of FullGallery
export interface FullImageInGallery extends ImageInGallery {
  image: FullImageInGalleryImage;
}

// Represents the 'user' object within FullGallery
// Ensure this matches the selection in your Prisma queries or make fields optional
export interface FullGalleryUser {
  id: string;
  name: string | null;
  email?: string | null; 
  emailVerified?: Date | null;
  image: string | null;
  role?: UserRole; 
}

// Represents the main gallery object, including theming fields
export interface FullGallery extends Omit<Gallery, 'user' | 'images'> {
  images: FullImageInGallery[];
  user: FullGalleryUser;
  
  // Optional: If you fetch the coverImage object separately and add it to FullGallery
  coverImage?: PrismaImage | null; 
}

// Basic Image type for components like ImageGrid, GalleryCarousel
export interface ImageType {
  id: string;
  url: string;
  title: string; // Changed from title?: string
  description: string | null; // Changed from description?: string
  tags?: PrismaTag[]; // Optional tags
}
