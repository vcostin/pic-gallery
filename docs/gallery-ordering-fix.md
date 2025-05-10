# Gallery Image Ordering Fix

## Issue Description
When editing a gallery and reordering images, the new order information was not being saved correctly to the database. This was due to an incorrect mapping of image IDs in the API payload.

## Root Cause
The issue was in the `performGalleryUpdate` function in the Edit Gallery page, which was using the wrong ID property when creating the API payload:

```typescript
// Incorrect code
images: images.map(img => ({ 
  id: img.imageId, // This was incorrect - used the Image ID instead of ImageInGallery ID
  description: img.description,
  order: img.order,
}))
```

The API expected the `id` field to be the ID of the `ImageInGallery` record (the join table between galleries and images), not the ID of the `Image` record itself.

## Solution
1. Fixed the payload mapping to use the correct ID property:

```typescript
// Fixed code
images: images.map(img => ({ 
  id: img.id, // Using correct ImageInGallery ID
  imageId: img.imageId, // Include the Image ID as well
  description: img.description,
  order: typeof img.order === 'number' ? img.order : index, // Added validation
}))
```

2. Added validation to ensure all images have a valid numeric order value.

3. Enhanced the `GallerySortable` component to set explicit numeric orders during drag-and-drop operations:

```typescript
// Reorder the items and set explicit orders
const reorderedImages = arrayMove(galleryImages, oldIndex, newIndex).map(
  (image, index) => ({
    ...image,
    order: index // Explicit numeric order starting from 0
  })
);
```

4. Updated the API validation schema to enforce numeric order values.

## Testing
Created focused unit tests specifically to validate the gallery image ordering functionality without relying on complex test setups:

1. **Gallery Order Tests** - Tests the correct mapping of image IDs and handling of image orders:
   - Verifies that `id` (ImageInGallery ID) is used instead of `imageId` (Image ID)
   - Tests validation of numeric order values
   - Ensures missing order values are properly handled

2. **Gallery Sort Order Tests** - Tests the array reordering logic used in the GallerySortable component:
   - Verifies that the `arrayMove` function correctly reorders images
   - Confirms explicit order assignments are applied after array movement
   - Tests handling of mixed order types (strings, numbers, null)

3. **Gallery Update API Tests** - Validates the API's handling of image orders:
   - Tests validation of numeric order values
   - Verifies the proper handling of image reordering
   - Confirms the fix for the ID mapping issue

The tests confirmed that our changes correctly address the issue, ensuring that gallery image orders are properly maintained when editing galleries.

## Testing Approach
We used a simplified testing approach that focused on the core functionality rather than complex component rendering or API mocks:

- Tests run in a Node environment without requiring JSX transformation
- We avoided complex mocks of React components or Next.js features
- Tests focus on the specific business logic that was affected by the bug
- Each test has a clear purpose aligned with a specific part of the fix

## Technical Notes
- The core issue was related to misusing the image ID properties, confusing `img.id` (the ID of the junction record) with `img.imageId` (the ID of the actual image)
- Proper validation was added to handle edge cases like missing or invalid order values
- The fix ensures backward compatibility with existing data
