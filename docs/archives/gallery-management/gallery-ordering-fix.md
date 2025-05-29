# Gallery Image Ordering Fix

## Issue Description
When editing a gallery and reordering images, the new order information was not being saved correctly to the database. This was due to both incorrect mapping of image IDs in the API payload and validation errors with image order values.

## Root Causes
1. Initially, the Edit Gallery page was using the wrong ID property when creating the API payload:
   ```typescript
   // Incorrect code
   images: images.map(img => ({ 
     id: img.imageId, // This was incorrect - used the Image ID instead of ImageInGallery ID
     description: img.description,
     order: img.order,
   }))
   ```
   The API expected the `id` field to be the ID of the `ImageInGallery` record, not the ID of the `Image`.

2. Additionally, order values weren't properly validated, sometimes leading to non-integer or negative values that failed schema validation.

## Solution

### 1. Fixed ID Mapping
Updated the payload mapping to use the correct ID property:

```typescript
// Fixed code for ID mapping
images: images.map(img => ({ 
  id: img.id, // Using correct ImageInGallery ID
  imageId: img.imageId, // Include the Image ID as well for temp images
  description: img.description,
  order: typeof img.order === 'number' ? img.order : index, // Basic validation
}))
```

### 2. Enhanced Order Value Validation
Added comprehensive order value validation in multiple places:

#### In `performGalleryUpdate` (Edit Gallery Page)
```typescript
const updatedImages = images.map((img, index) => {
  // Check if order exists and is valid
  if (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0) {
    console.warn(`Fixing invalid order for image ${img.id}: ${img.order} -> ${index}`);
  }
  
  // Always provide a valid non-negative integer for order
  const orderValue = typeof img.order === 'number' && Number.isInteger(img.order) && img.order >= 0 
    ? img.order 
    : index;
  
  return { 
    id: img.id,
    ...(img.imageId ? { imageId: img.imageId } : {}),
    description: img.description,
    order: orderValue,
  };
});
```

#### In `GallerySortable.tsx`
```typescript
// Reorder the items and set explicit orders starting from 0
const reorderedImages = arrayMove(galleryImages, oldIndex, newIndex).map(
  (image, index) => ({
    ...image,
    order: index // Explicit numeric integer order starting from 0
  })
);
```

#### In Hook Functions
```typescript
const updateImages = useCallback((newImages) => {
  try {
    // Validate that all images have appropriate order values
    const validatedImages = newImages.map((img, index) => {
      // If order is missing or invalid, set it based on position
      if (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0) {
        logger.warn(`Image with ID ${img.id} has invalid order value: ${img.order}, setting to ${index}`);
        return { ...img, order: index };
      }
      return img;
    });
    
    setImages(validatedImages);
  } catch (err) {
    logger.error("Error updating images:", err);
    // Fall back to the passed images to avoid breaking the UI
    setImages(newImages);
  }
}, []);
```

### 3. API Pre-validation
Added validation in route.ts before processing updates:
```typescript
// Pre-validation check for common issues
if (body.images && Array.isArray(body.images)) {
  body.images = body.images.map((img, index) => {
    // Fix any non-integer or negative order values
    if (img.order !== undefined &&
        (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0)) {
      logger.warn(`Found invalid order value in request: ${String(img.order)} for image ${img.id}, fixing to ${index}`);
      return { ...img, order: index };
    }
    return img;
  });
}
```

### 4. Improved Schema Validation
Enhanced the Zod schema for better error messages:
```typescript
order: z.number()
  .int("Order must be an integer")
  .nonnegative("Order must be a non-negative number")
  .optional()
```

## Results and Testing

All implemented fixes were tested to confirm that:

1. Gallery images can be successfully reordered via drag-and-drop
2. The order information is correctly saved to the database
3. All validation checks are working properly
4. The application can recover from invalid order values

All automated tests are passing with these changes, and manual testing in the development environment confirms that reordering images now works as expected.

## Future Improvements

1. Consider adding end-to-end tests specifically for the image reordering functionality
2. Add more detailed logging for order validation to help troubleshoot any future issues
3. Standardize the ordering mechanism across all components that handle gallery images

## Related Issues

This fix addresses issue #42 in the project tracker: "Gallery image order not saving properly after drag and drop".
