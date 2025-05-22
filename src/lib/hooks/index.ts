/**
 * Barrel file for exporting all hooks
 * This provides a cleaner import experience and guides users toward the newer hooks
 */

// Legacy hooks (deprecated but still available for backwards compatibility)
// Selectively import from ../hooks to avoid naming conflicts
import { 
  useAsync, 
  useFetch, 
  useSubmit,
  // Exclude useGalleryImages as it's also defined in ./useGallery
} from '@/lib/hooks';

export { useAsync, useFetch, useSubmit };

// API hooks
export * from '@/lib/hooks/useApi';

// Gallery hooks
export * from '@/lib/hooks/useGallery';
export * from '@/lib/hooks/useEnhancedGallery';

// Migration guide
export * from '@/lib/hooks/migration';
