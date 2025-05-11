/**
 * Barrel file for exporting all hooks
 * This provides a cleaner import experience and guides users toward the newer hooks
 */

// Legacy hooks (deprecated but still available for backwards compatibility)
export * from '../hooks';

// API hooks
export * from './useApi';

// Gallery hooks
export * from './useGallery';
export * from './useEnhancedGallery';

// Migration guide
export * from './migration';
