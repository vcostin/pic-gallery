# Gallery Image Removal Fix

This document describes an issue with gallery image removal and its solution.

## Problem

When removing images from a gallery in the UI:
1. The image is visually removed from the gallery view
2. The `confirmRemoveImage` function is called to remove it from local state
3. The image appears to be removed in the UI
4. But after saving the gallery, the removed images reappear when the gallery is reloaded

## Root Cause

The issue occurred because when updating a gallery:
1. The UI component properly removed the image from the local state array
2. The update payload sent to the server included only the images that remained in the local state
3. However, the PATCH endpoint's implementation did not check for images that existed in the database but were missing from the update payload
4. As a result, the removed images were never deleted from the database

## Solution

The fix was implemented in the `PATCH` endpoint (`src/app/api/galleries/[id]/route.ts`):

1. Added code to identify which images should be removed by comparing database state with the update payload:

```typescript
// Create a set of IDs from the payload for quick lookup
const updatedImageIds = new Set(imagesDataFromValidation
  .filter(imgData => !imgData.id.startsWith('temp-'))
  .map(imgData => imgData.id)
);

// Find images to remove (images in database but not in the payload)
const imagesToRemove = gallery.images.filter(img => !updatedImageIds.has(img.id));

// Add deletion operations to the transaction
const imageRemovals = imagesToRemove.map(img => 
  prisma.imageInGallery.delete({ where: { id: img.id } })
);
```

2. Updated the transaction to include the removal operations:

```typescript
await prisma.$transaction([
  ...imageUpdates,
  ...imageRemovals, // Include image removal operations
  ...(newImageLinks.length > 0 ? [prisma.imageInGallery.createMany({ data: newImageLinks })] : []),
]);
```

## Testing

To verify this fix works correctly:

1. Create a gallery with multiple images
2. Edit the gallery
3. Remove at least one image 
4. Save the gallery
5. Reload the gallery page or revisit the edit page
6. Confirm the removed image does not reappear

## Related Documentation

This update aligns with the existing image management flow described in `docs/gallery-image-management.md`, which states that:

> "When the gallery is saved, the removed images are simply not included in the update payload. The API updates the database to match the provided list, effectively removing the missing images."

The fix ensures this behavior is correctly implemented in the backend.
