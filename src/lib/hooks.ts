/**
 * @fileoverview Legacy hooks file
 * 
 * This file previously contained deprecated hooks that have been migrated to:
 * - useEnhancedGalleryImages: @/lib/hooks/useEnhancedGallery
 * - useApi/useApiGet: @/lib/hooks/useApi
 * - Other modernized hooks in @/lib/hooks/
 * 
 * Use the new hooks from @/lib/hooks/ instead of importing from this file.
 */

// Re-export the modern hooks for convenience
export * from '@/lib/hooks/useApi';
export * from '@/lib/hooks/useGallery';
export * from '@/lib/hooks/useEnhancedGallery';
