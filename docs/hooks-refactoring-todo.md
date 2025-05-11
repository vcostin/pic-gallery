# Hooks Refactoring TODO List

This is a task list for gradually migrating from the old hooks to the new Zod schema-based hooks in future iterations.

## High Priority

- [ ] Modify components currently using `useFetch` to use `useApi` instead
  - Look for `import { useFetch } from '@/lib/hooks'` patterns
  - Replace with `import { useApi } from '@/lib/hooks/useApi'` and add schema validation

- [ ] Update `GalleryView` and `GallerySortable` components to use `useEnhancedGalleryImages`
  - Look for `import { useGalleryImages } from '@/lib/hooks'` patterns
  - Replace with `import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery'`

## Medium Priority

- [ ] Consolidate existing `useGalleryImages` hooks into a single implementation
  - Remove the duplicate implementation in `hooks/useGallery.ts` or `hooks.ts`
  - Update imports to point to the consolidated implementation

- [ ] Add API call to update image order in the database in `handleDragEnd` of `useEnhancedGalleryImages`
  - Need to implement order updating in the GalleryService

- [ ] Update any form submissions to use schema validation (either with `useApi` or a form library)

## Low Priority

- [ ] Write tests for the new hooks
  - Test schema validation
  - Test error handling
  - Test UI interactions in `useEnhancedGalleryImages`

- [ ] Create migration scripts to help with the transition
  - Script to find and suggest replacements for deprecated hooks
  - Documentation generator for the new hooks

## Completed

- [x] Create enhanced gallery hooks in `useEnhancedGallery.ts`
- [x] Deprecate legacy hooks with JSDoc comments
- [x] Add barrel file in `hooks/index.ts` for organized exports
- [x] Create a migration guide with examples
