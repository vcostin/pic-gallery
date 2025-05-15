# Gallery Image Removal Fix

**Date:** May 16, 2025  
**Fixed by:** Team

## Issue Summary

Users could remove images from a gallery in the UI (they visually disappeared), but after saving the gallery, the images reappeared. This occurred because the removal operation wasn't being properly persisted to the database. The issue was particularly noticeable when removing multiple images and then saving the gallery.

## Root Cause

The image removal functionality was implemented in two different ways:

1. In the `useEnhancedGalleryImages` hook, image removal was properly handled through the `GalleryService.removeImage` method, which updates the gallery by filtering out the removed image.

2. In the gallery edit page (`/app/galleries/[id]/edit/page.tsx`), image removal was only updating local state without calling the API to persist the change. When the gallery was saved, the server state was used, causing removed images to reappear.

## Solution

The fix involved updating the `confirmRemoveImage` function in the gallery edit page to use the `GalleryService.removeImage` method directly, ensuring that image removals are immediately persisted to the database.

### Implementation Details

1. Updated `confirmRemoveImage` in `/app/galleries/[id]/edit/page.tsx`:
   ```typescript
   const confirmRemoveImage = useCallback(async () => {
     if (!galleryId || !imageToRemove) {
       setShowRemoveImageDialog(false);
       setImageToRemove(null);
       return;
     }
     
     try {
       setIsLoading(true);
       
       // Import the GalleryService for accessing the removeImage method
       const { GalleryService } = await import('@/lib/services/galleryService');
       
       // Use GalleryService.removeImage to update the gallery on the server
       const updatedGallery = await GalleryService.removeImage(galleryId, imageToRemove);
       
       // Update the local state with the response from the server
       setImages(updatedGallery.images);
       
       // If the cover image was removed, update the cover image ID
       if (updatedGallery.coverImageId !== coverImageId) {
         setCoverImageId(updatedGallery.coverImageId || '');
       }
       
       // Update the original gallery data to reflect these changes
       setOriginalGalleryData(updatedGallery);
       setGalleryData(updatedGallery);
       
       // Set a success message
       setToastMessage('Image removed from gallery');
       setShowSuccessToast(true);
       setTimeout(() => setShowSuccessToast(false), 3000);
     } catch (err) {
       logger.error("Error removing image:", err);
       
       // Show error toast
       setToastMessage(`Error removing image: ${err instanceof Error ? err.message : String(err)}`);
       setShowSuccessToast(true);
       setTimeout(() => setShowSuccessToast(false), 3000);
     } finally {
       setIsLoading(false);
       setShowRemoveImageDialog(false);
       setImageToRemove(null);
     }
   }, [imageToRemove, coverImageId, galleryId]);
   ```

2. Fixed tests in `enhanced-gallery-hook.test.ts` to properly mock the `GalleryService` methods:
   ```typescript
   // Updated mock implementation
   jest.mock('./lib/services/galleryService', () => ({
     GalleryService: {
       getGallery: jest.fn(),
       addImages: jest.fn(),
       removeImage: jest.fn(),
       updateGallery: jest.fn() // Added to support the internal implementation
     }
   }));

   // Added proper mock setup in each test
   it('should add images to gallery when addImages is called', async () => {
     // Mock the service methods
     (GalleryService.getGallery as jest.Mock).mockResolvedValue(updatedGallery);
     (GalleryService.addImages as jest.Mock).mockResolvedValue(updatedGallery);
     
     // Rest of the test...
   });
   ```

3. Deprecated the DELETE endpoint at `/app/api/galleries/[id]/images/[imageId]/route.ts` in favor of using the gallery update endpoint exclusively:
   ```typescript
   /**
    * DELETE /api/galleries/[id]/images/[imageId]
    * Removes an image from a gallery
    * 
    * @deprecated This endpoint is now deprecated. Use the gallery update endpoint instead:
    * PATCH /api/galleries/[id] with filtered images array. This provides better atomicity
    * and ensures consistent handling of gallery data.
    */
   ```

## Design Decisions

1. We chose to keep the `GalleryService.removeImage` implementation that updates the entire gallery rather than using a dedicated DELETE endpoint. This approach:
   - Ensures atomicity of the operation.
   - Maintains gallery state consistency.
   - Follows a more RESTful approach where resources are managed through their parent entities.
   - Aligns with the requirement to manage gallery images as part of the gallery data without requiring a separate DELETE endpoint.

2. We added a deprecation notice to the DELETE endpoint rather than removing it entirely to avoid breaking any potential undiscovered clients.

3. We used dynamic import for `GalleryService` in the edit page to:
   - Reduce initial load size
   - Avoid circular dependencies
   - Lazy load only when needed during image removal

## Future Considerations

1. When deemed safe, the DELETE endpoint at `/app/api/galleries/[id]/images/[imageId]/route.ts` should be removed entirely.

2. All components that manage gallery images should follow the pattern of using `GalleryService.removeImage` to ensure consistent behavior.

3. Consideration should be given to batching multiple image operations (add/remove/reorder) in a single API call for better performance in scenarios where users are making multiple changes.

4. We should update test cases for any other UI components that involve image removal to ensure they follow the same pattern.

## Testing Results

The implementation was validated with passing tests:

```
Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
Snapshots:   0 total
```

Key tests that verify the functionality:

1. `gallery-image-removal.test.ts` - validates the `GalleryService.removeImage` implementation.
2. `enhanced-gallery-hook.test.ts` - validates the integration with React components.

These tests confirm that image removals are properly persisted and that the UI reflects these changes accurately.

## Related Changes

This fix complements the gallery ordering functionality implemented in [gallery-ordering-fix.md](./gallery-ordering-fix.md). Together, these changes ensure a consistent approach to gallery image management:

- **Gallery Ordering:** Ensures image order is preserved accurately
- **Gallery Image Removal:** Ensures removed images stay removed

Both features now follow a consistent pattern of using the gallery update endpoint for managing the collection of images associated with a gallery.
