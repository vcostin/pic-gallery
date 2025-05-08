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

// Define the UserRole enum to match the Prisma schema
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

import { Gallery, ImageInGallery, User, Tag as PrismaTag, UserRole, Image as PrismaImage } from '@prisma/client';

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
export interface FullGallery extends Omit<Gallery, 'user' | 'images' | 'coverImageId'> {
  images: FullImageInGallery[];
  user: FullGalleryUser;
  
  // coverImageId is part of the base Gallery type from Prisma if it's a scalar foreign key
  coverImageId?: string | null; 

  // Theming fields from Prisma schema (marked optional for safety with potentially stale client)
  // If your Prisma client is up-to-date, these would be on Gallery type directly.
  themeColor?: string | null;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  displayMode?: string | null;
  layoutType?: string | null;
  
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
