# Gallery Workflow Issues

## Overview

This document tracks gallery workflow functionality issues and the fixes implemented.

## Observed Issues

1. **Issue #1: Selected images not appearing in Gallery Creation**
   - **Observed behavior:** When creating a new gallery and selecting images from the "Add Images" modal:
     1. Upload images through "Upload new Image" functionality
     2. Click "Create new gallery"
     3. Click "Add Images" button
     4. Select images in the modal by clicking them (images toggle selection state)
     5. Click "Add x images" button
     6. Modal closes but no image cards appear in the "Gallery Images" section
     * Note: Images can be added/removed normally in Edit Gallery mode after saving
   - **Expected behavior:** 
     1. Selected images should immediately appear as image cards in the "Gallery Images" section
     2. The gallery preview should update to reflect the selected images
     3. Changes should persist when saving the gallery
   - **Affected components/files:** 
     - `src/components/CreateGallery/CreateGallery.tsx`
     - `src/components/SelectImagesDialog.tsx`
     - `src/lib/hooks/useEnhancedGallery.ts`
     - `src/components/GalleryImageCards.tsx`
   - **Potential fixes:**
     - Check event handlers in SelectImagesDialog for proper image selection state management
     - Verify the state update in CreateGallery when images are selected
     - Add logging to track image selection state changes
     - Review the connection between SelectImagesDialog and GalleryImageCards
   - **Test Coverage Gaps:**
     - Current E2E test in comprehensive-gallery-workflow.spec.ts doesn't verify image appearance
     - Need to add specific test case for image selection during gallery creation

2. **Issue #2: Cover Image Selection Not Working**
   - **Observed behavior:** Users cannot set a cover image by clicking the "Set Cover" button on image cards during gallery creation
   - **Expected behavior:** 
     1. Clicking "Set Cover" on any image should set it as the gallery cover
     2. The selected cover image should be visually indicated
     3. The cover image selection should persist when saving
   - **Affected components/files:** 
     - `src/components/CreateGallery/CreateGallery.tsx`
     - `src/components/GallerySortable.tsx`
     - `src/lib/hooks/useEnhancedGallery.ts`
   - **Potential fixes:**
     - Implement cover image selection handler in CreateGallery
     - Update state management to track cover image
     - Add visual indication for selected cover image
     - Ensure cover image ID is included in gallery creation payload

3. **Issue #3: Gallery Creation Database Error**
   - **Observed behavior:** When saving a gallery with selected images, a foreign key constraint error occurs
   - **Expected behavior:** 
     1. Gallery should save successfully with all selected images
     2. Image relationships should be properly created in the database
     3. No foreign key constraint violations should occur
   - **Affected components/files:** 
     - `src/components/CreateGallery/CreateGallery.tsx`
     - `src/lib/services/galleryService.ts`
     - `prisma/schema.prisma`
   - **Potential fixes:**
     - Fix image ID mapping in gallery creation payload
     - Verify image IDs are correctly passed to the database
     - Add validation for image existence before saving
     - Implement proper error handling for database constraints

## Implementation Plan

1. **Fix #1: Add E2E test coverage for image selection in gallery creation**
   - [ ] Add helper functions in TestHelpers for image upload workflow
   - [ ] Add helper function for verifying image cards in gallery
   - [ ] Create new E2E test case in comprehensive-gallery-workflow.spec.ts
   - [ ] Add test assertions for image selection and preview
   - [ ] Run tests and document failures

2. **Fix #2: Debug and fix image selection in CreateGallery**
   - [ ] Add logging to track image selection state
   - [ ] Add error boundaries to catch potential issues
   - [ ] Fix image selection state management
   - [ ] Verify fix with E2E tests
   - [ ] Add regression tests

3. **Fix #3: Fix Gallery Creation Database Error**
   - [ ] Add validation for image IDs before saving
   - [ ] Fix image ID mapping in gallery creation
   - [ ] Update gallery service to handle image relationships
   - [ ] Add error handling for database constraints
   - [ ] Verify fix with integration tests

4. **Fix #4: Implement Cover Image Selection**
   - [ ] Add cover image state management
   - [ ] Implement cover image selection handler
   - [ ] Update UI to show selected cover image
   - [ ] Include cover image in gallery creation
   - [ ] Add tests for cover image functionality

## Testing Plan

1. E2E tests to verify workflow:
   - [ ] Gallery creation flow with image upload prerequisites
   - [ ] Image upload and verification of upload success
   - [ ] Image selection during gallery creation
   - [ ] Image preview and card display verification
   - [ ] Gallery saving with selected images
   - [ ] Gallery editing and image management
   - [ ] Gallery publication status changes
   - [ ] Gallery deletion with image cleanup

2. Component tests:
   - [ ] SelectImagesDialog image selection state
   - [ ] CreateGallery image state management
   - [ ] GalleryImageCards rendering
   - [ ] useEnhancedGallery hook image operations

3. Database integration tests:
   - [ ] Gallery creation with multiple images
   - [ ] Image relationship validation
   - [ ] Cover image selection persistence
   - [ ] Error handling for invalid image IDs

## Completion Criteria

- All identified gallery workflow issues are fixed
- Cover image selection works correctly
- Gallery creation saves successfully to database
- E2E tests pass successfully
- No regressions in existing functionality
