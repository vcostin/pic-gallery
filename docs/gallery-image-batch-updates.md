# Gallery Image Batch Updates

## Overview

This document describes the implementation of batch updates for gallery images in the pic-gallery application. As of May 2025, all image operations (adding, removing, and reordering) are only persisted when the user explicitly saves the gallery.

## Motivation

Previously, image operations were immediately persisted through API calls as soon as they were performed:
- Adding images triggered an immediate API call to `/api/galleries/[id]` (POST)
- Removing images triggered an immediate API call to remove them
- Reordering images triggered an immediate API call to update the order

This approach had several drawbacks:
1. It created many small API calls, which could impact performance
2. It was inconsistent with how other form changes are handled (which require a Save button)
3. It didn't allow users to discard changes before saving
4. It could lead to partial updates if one operation succeeded but another failed

## Implementation

### Client-Side Changes

The following changes were made to support batch updates:

1. **useEnhancedGalleryImages Hook**:
   - Modified to store image changes in local state only
   - Added `hasUnsavedChanges` flag to track image modifications
   - Removed immediate API calls from image operations

2. **Gallery Edit Page**:
   - Integrated the hook's `hasUnsavedChanges` flag with the form's change tracking
   - Updated the UI to indicate that changes need to be saved
   - Modified the "Save Changes" button to persist all gallery changes at once
   - Added ability to discard all changes, including image changes

3. **UI Improvements**:
   - Added a note explaining the batch update behavior
   - Changed "Add Images" button text to "Select Images" for clarity
   - Updated help text to explain that changes are saved when clicking "Save Changes"

### Server-Side Implementation

The server-side API at `/api/galleries/[id]/route.ts` was already designed to handle batch updates:

1. The PATCH endpoint processes all image changes in a single transaction
2. It can handle additions, removals, and reordering in one operation
3. It properly validates all image operations before committing changes

## Benefits

This batch update approach offers several advantages:

1. **Consistency**: All gallery changes (metadata and images) are handled in the same way
2. **User Control**: Users can preview changes before committing them
3. **Atomicity**: All changes succeed or fail together
4. **Performance**: Fewer API calls for multiple operations
5. **Reliability**: Less chance of data inconsistency due to partial updates

## Usage Notes

- When images are added, they appear in the gallery immediately but are only persisted when saved
- Newly added images have temporary IDs prefixed with `temp-` until they are saved
- Reordering and removing images work the same way - changes are visible but not persisted until saved
- Clicking "Cancel" or "Discard Changes" reverts all unsaved image changes

## Future Considerations

- Consider adding a staging area or separate preview for image changes
- Add visual indicators for newly added or modified images
- Implement optimistic updates with rollback capability for failed saves
