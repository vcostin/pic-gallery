# Code Duplication Analysis and Fix

## Duplicate Functionality Issues

The following duplicate functionality issues were identified in the codebase:

### 1. `useFetch` vs `useApi` + `fetchApi`

Two different implementations for handling API requests:

- **Original implementation**: 
  - `useFetch` in `hooks.ts` - A hook providing `fetchApi`, `isLoading`, and `error` states
  - No schema validation

- **New implementation**: 
  - `useApi`/`useApiGet` in `hooks/useApi.ts` - More advanced hooks with Zod schema validation 
  - `fetchApi` in `apiUtils.ts` - A utility function for making validated API requests

**Resolution**: Deprecated `useFetch` in favor of `useApi` hooks, which offer schema validation and better type safety.

### 2. `useGalleryImages` Duplication

Two implementations of this hook:

- **Original implementation**: 
  - In `hooks.ts` - Focuses on UI operations like drag and drop, removing images, etc.
  - Manages local state for images in a gallery

- **New implementation**: 
  - In `hooks/useGallery.ts` - Focuses on API operations like adding and removing images
  - Uses the GalleryService for validated API calls

**Resolution**: Created an enhanced hook `useEnhancedGalleryImages` in `hooks/useEnhancedGallery.ts` that combines UI operations from the original and API operations from the new implementation.

### 3. `useAsync` vs `useApi`

Both hooks manage asynchronous operations with loading and error states:

- **Original implementation**: 
  - `useAsync` in `hooks.ts` - Generic async state handling
  - No schema validation

- **New implementation**: 
  - `useApi` in `hooks/useApi.ts` - Async state handling with Zod schema validation
  - More specific to API calls

**Resolution**: Maintained both hooks but clearly documented their different use cases. `useAsync` is for generic async operations, while `useApi` is specifically for API calls with schema validation.

### 4. Type Inconsistencies

Multiple implementations use different types for the same concepts:

- **Original types**: 
  - Manually defined types in `lib/types.ts`

- **New types**: 
  - Types derived from Zod schemas in `lib/schemas.ts`

**Resolution**: Added documentation to guide using the Zod schema-derived types consistently throughout the application and phasing out the manually defined types.

## Migration Guide

A migration guide has been provided in `src/lib/hooks/migration.ts` to help developers migrate from old hooks to new ones.

## Implementation Details

1. Created enhanced gallery hooks in `useEnhancedGallery.ts`
2. Deprecated legacy hooks with JSDoc comments
3. Added a barrel file in `hooks/index.ts` for organized exports
4. Created a migration guide with examples

## Next Steps

1. Update components to use the enhanced hooks
2. Gradually phase out deprecated hooks
3. Ensure consistent use of schema-derived types throughout the application
