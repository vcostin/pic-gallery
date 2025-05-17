# Hooks Refactoring TODO List

This is a task list for gradually migrating from the old hooks to the new Zod schema-based hooks in future iterations.

## High Priority

- [ ] Modify components currently using `useFetch` to use `useApi` instead
  - Look for `import { useFetch } from '@/lib/hooks'` patterns
  - Replace with `import { useApi } from '@/lib/hooks/useApi'` and add schema validation
  - [x] Updated `SelectImagesDialog` component

- [ ] Update `GalleryView` and `GallerySortable` components to use `useEnhancedGalleryImages`
  - Look for `import { useGalleryImages } from '@/lib/hooks'` patterns
  - Replace with `import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery'`

- [x] Update `ThemedGalleryView` component to use schema-derived types
  - Created utility functions in `lib/utils/typeMappers.ts` for mapping between types
  - Added tests for type mapping functions

- [x] Update `GalleryView` component to use schema-derived types
  - Added support for schema-based typing 
  - Fixed compatibility with ImageCarousel component

- [x] Update `GalleryGrid` component to use schema-derived types
  - Added schema-based typing with Zod
  - Improved type safety

## Medium Priority

- [ ] Consolidate existing `useGalleryImages` hooks into a single implementation
  - Remove the duplicate implementation in `hooks/useGallery.ts` or `hooks.ts`
  - Update imports to point to the consolidated implementation

- [x] Add API call to persist image removal in `removeImage` of `useEnhancedGalleryImages`
  - Implemented image removal in the GalleryService
  - Fixed issue with removed images reappearing after saving

- [x] Add API call to update image order in the database in `handleDragEnd` of `useEnhancedGalleryImages`
  - Implemented `updateImageOrder` method in the GalleryService
  - Enhanced `handleDragEnd` in `useEnhancedGalleryImages` to persist order changes
  - Added loading state, error handling, and toast notifications for reordering operations

- [ ] Update any form submissions to use schema validation (either with `useApi` or a form library)

## Low Priority

- [ ] Write tests for the new hooks
  - Test schema validation
  - Test error handling
  - Test UI interactions in `useEnhancedGalleryImages`
  
- [x] Add additional type mapping utilities to `lib/utils/typeMappers.ts`
  - Created `imageSelectionMappers.ts` for image selection components
  - Added mapping functions for gallery view components
  - Created schema types for UI components 

- [ ] Create migration scripts to help with the transition
  - Script to find and suggest replacements for deprecated hooks
  - Documentation generator for the new hooks

## Completed

- [x] Create enhanced gallery hooks in `useEnhancedGallery.ts`
- [x] Deprecate legacy hooks with JSDoc comments
- [x] Add barrel file in `hooks/index.ts` for organized exports
- [x] Create a migration guide with examples
- [x] Refactor `GalleryGrid` and `ImageGrid` to use React's native `useState` instead of deprecated `useAsync`
- [x] Update `removeImage` in `useEnhancedGalleryImages` to call the API service to persist removal
- [x] Add `removeImage` method to `GalleryService` to properly persist image removals
- [x] Add tests for successful and failed image removal operations
- [x] Add tests for image reordering functionality
  - Added test cases for successful image reordering via API
  - Added test cases for handling errors during image reordering
  - Mocked `updateImageOrder` method in tests
