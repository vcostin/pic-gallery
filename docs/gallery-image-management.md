# Gallery Image Management

This document explains how images are managed in galleries within the pic-gallery application. All gallery image operations including **addition, removal, and reordering** are handled through a single consolidated API endpoint.

## Architecture Overview

The application uses a centralized approach for gallery image management:

- **Single Endpoint:** All gallery image operations are handled through the main gallery PATCH endpoint at `/api/galleries/[id]/route.ts`
- **Client-Side State:** Image operations first occur in local state via React hooks
- **Batch Updates:** All changes (additions, removals, reordering) are sent together when saving the gallery

## Data Model

### Gallery and ImageInGallery Relationship

```
Gallery
  ├── id: string
  ├── title: string
  ├── description: string | null
  ├── isPublic: boolean
  ├── userId: string
  ├── coverImageId: string | null
  └── images: ImageInGallery[]
      ├── id: string
      ├── imageId: string (references Image.id)
      ├── description: string | null
      └── order: number (non-negative integer)
```

- Each `Gallery` contains an array of `ImageInGallery` objects
- The `ImageInGallery` model represents the relationship between a gallery and an image
- Each `ImageInGallery` has its own `id`, which is different from the `imageId` of the actual image
- The `order` property determines the display order of images in the gallery

## Image Operations

### Adding Images

1. Images are selected via the UI and added to local state
2. New images are marked with temporary IDs (e.g., `temp-{timestamp}-{index}`)
3. When the gallery is saved:
   - The gallery update payload includes all images, including the new ones
   - The API creates new `ImageInGallery` records for the new images

Example payload for adding images:

```json
{
  "id": "gallery-123",
  "title": "My Gallery",
  "isPublic": true,
  "images": [
    { "id": "existing-image-in-gallery-1", "order": 0 },
    { "id": "existing-image-in-gallery-2", "order": 1 },
    { "id": "temp-1717409574-0", "imageId": "actual-image-id-1", "order": 2 }
  ]
}
```

### Removing Images

1. Images are removed from the local state array via UI interactions
2. When the gallery is saved, the removed images are simply not included in the update payload
3. The API updates the database to match the provided list, effectively removing the missing images

Example payload after removing an image:

```json
{
  "id": "gallery-123",
  "title": "My Gallery",
  "isPublic": true,
  "images": [
    { "id": "existing-image-in-gallery-1", "order": 0 },
    // "existing-image-in-gallery-2" has been removed
  ]
}
```

### Reordering Images

1. Images are reordered via drag-and-drop UI (using dnd-kit)
2. When reordered, the `order` property of each image is updated to reflect its new position
3. When the gallery is saved, the updated order values are sent to the API

Example payload after reordering:

```json
{
  "id": "gallery-123",
  "title": "My Gallery",
  "isPublic": true,
  "images": [
    { "id": "existing-image-in-gallery-2", "order": 0 }, // Now first
    { "id": "existing-image-in-gallery-1", "order": 1 }  // Now second
  ]
}
```

## Implementation Details

### Client-Side State Management

The application uses custom React hooks to manage gallery image state:

- `useGallery.ts` or `useEnhancedGallery.ts` provides functions for:
  - Adding images
  - Removing images
  - Updating image descriptions
  - Reordering images

These hooks maintain local state that is later synchronized with the server when the user saves changes.

### API Endpoint Structure

**Main Gallery PATCH Endpoint: `/api/galleries/[id]/route.ts`**

This endpoint handles:
- Updating gallery metadata (title, description, etc.)
- Adding new images to the gallery
- Removing images from the gallery
- Updating image properties (description, order)

**IMPORTANT**: Do not implement separate endpoints for individual image operations. All image management should go through this main endpoint to ensure consistency.

### Order Value Validation

The system has robust validation to ensure order values are always valid:

- Order values must be non-negative integers
- If invalid orders are encountered, they are automatically corrected in the API
- The frontend also validates and fixes order values before sending them to the API

## Best Practices

1. **Use the Main Endpoint**: Always use the main gallery PATCH endpoint for all image operations
2. **Batch Updates**: Group multiple changes together when possible
3. **Validate Order Values**: Ensure order values are valid non-negative integers
4. **Unique IDs**: Remember that `ImageInGallery.id` is different from `Image.id`

## Why This Approach?

- **Consistency**: All gallery operations are handled in a unified way
- **Atomicity**: Multiple operations can be performed in a single transaction
- **Simplicity**: Single point of API interaction reduces complexity
- **Reliability**: Prevents issues with ordering or partial updates

By following this centralized approach for gallery image management, we ensure consistency and reliability in the application.
