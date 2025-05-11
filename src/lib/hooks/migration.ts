/**
 * Migration Guide: Moving to Schema-based Hooks
 * 
 * This file provides guidance on how to migrate from the old hooks to the new Zod schema-based hooks.
 * 
 * DEPRECATED HOOKS                  | REPLACEMENT
 * -------------------------------------------------------------------------
 * useFetch (lib/hooks.ts)           | useApi, useApiGet (lib/hooks/useApi.ts)
 * useAsync (lib/hooks.ts)           | useApi (for API-specific async ops)
 * useSubmit (lib/hooks.ts)          | Form libraries like react-hook-form + zod
 * useGalleryImages (lib/hooks.ts)   | useEnhancedGalleryImages (lib/hooks/useEnhancedGallery.ts)
 * 
 * BENEFITS OF NEW HOOKS:
 * 
 * 1. Schema Validation: All data is validated against Zod schemas
 * 2. Type Safety: TypeScript types are derived from Zod schemas
 * 3. Consistent Error Handling: Standardized error handling across hooks
 * 4. Better Separation of Concerns: UI/API operations are properly separated
 * 5. Single Source of Truth: Schemas defined in lib/schemas.ts
 * 
 * MIGRATION STEPS:
 * 
 * 1. Replace useFetch with useApi or useApiGet
 *    - Old: const { fetchApi, isLoading } = useFetch();
 *    - New: const { fetch, isLoading } = useApi(MyDataSchema);
 * 
 * 2. Replace useAsync for API calls with useApi
 *    - Old: const { run, data } = useAsync();
 *    - New: const { fetch, data } = useApi(MyDataSchema);
 * 
 * 3. Replace useGalleryImages with useEnhancedGalleryImages
 *    - Old: const { images, handleDragEnd } = useGalleryImages(initialImages);
 *    - New: const { images, handleDragEnd } = useEnhancedGalleryImages(galleryId, initialImages);
 * 
 * The deprecated hooks will be removed in a future version.
 */

// Export types for backwards compatibility
export * from '../schemas';
