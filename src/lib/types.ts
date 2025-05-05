/**
 * Centralized type definitions for the application
 * This helps maintain consistency and avoid duplication
 */

// User types
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
}

// Image types
export interface Image {
  id: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags: Tag[];
  inGalleries?: GalleryImage[];
}

// Gallery types
export interface GalleryImage {
  id: string;
  imageId: string;
  galleryId: string;
  description: string | null;
  order: number;
  createdAt: Date;
  image: Image;
}

export interface Gallery {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  coverImageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: GalleryImage[];
  user: User;
}

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
