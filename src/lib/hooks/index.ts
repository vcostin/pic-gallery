/**
 * Barrel file for exporting all hooks
 * This provides a cleaner import experience and guides users toward the newer hooks
 */

// API hooks
export * from '@/lib/hooks/useApi';

// Gallery hooks
export * from '@/lib/hooks/useGallery';
export * from '@/lib/hooks/useEnhancedGallery';

// Migration guide
export * from '@/lib/hooks/migration';
