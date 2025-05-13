# Using Schema-derived Types in Components

This guide shows how to migrate components to use schema-derived types from Zod.

## Progress Update (May 11, 2025)

- ✅ Created centralized schemas in `lib/schemas.ts`
- ✅ Created mapping utilities in `lib/utils/typeMappers.ts` and `lib/utils/galleryViewMappers.ts`
- ✅ Migrated `ThemedGalleryView` component to use schema-derived types
- ✅ Added test for type mapping functions
- ✅ Created examples for refactoring other components

## Why Use Schema-derived Types?

1. **Single Source of Truth** - Types are derived directly from validation schemas
2. **Runtime Validation** - Same schemas used for both TypeScript types and runtime validation
3. **Better Error Messages** - Zod provides detailed validation errors
4. **Type Safety** - Strong typing ensures data consistency
5. **Automatic Type Generation** - Types update automatically when schemas change

## Step-by-Step Migration Process

### Step 1: Import Schema-derived Types

Replace imports from `@/lib/types` with schema-derived types:

```tsx
// Before
import { FullGallery, FullImageInGallery, ImageType } from '@/lib/types';

// After
import { DisplayGallery, DisplayImage } from '@/lib/utils/typeMappers';
// Or directly from schema if no mapping needed
import { Gallery, Image } from '@/lib/schemas';
import { z } from 'zod';
type GalleryType = z.infer<typeof Gallery>;
```

### Step 2: Use Type Mapping Utilities

Instead of creating ad-hoc mapping functions in components, use centralized utilities:

```tsx
// Before
const mapToImageType = (fig: FullImageInGallery): ImageType => ({
  id: fig.image.id,
  url: fig.image.url,
  // ...more mapping
});

// After
import { mapGalleryImageToDisplayImage } from '@/lib/utils/typeMappers';
// Then use directly in your component
const displayImage = mapGalleryImageToDisplayImage(imageInGallery);
```

### Step 3: Update Component Props

Update component props to use schema-derived types:

```tsx
// Before
interface MyComponentProps {
  gallery: FullGallery;
}

// After
interface MyComponentProps {
  gallery: DisplayGallery; // or z.infer<typeof GallerySchema>
}
```

### Step 4: Handle Nullable and Optional Fields

Zod handles nullable and optional fields with proper type narrowing:

```tsx
// Before manual null checks
if (gallery.description) {
  // ...
}

// After - the types properly reflect nullability
gallery.description && (
  <p>{gallery.description}</p>
)
```

## Examples

### API Call with Schema Validation

```tsx
import { useApi } from '@/lib/hooks/useApi';
import { GallerySchema } from '@/lib/schemas';

// Component using validated API data
function GalleryDetails({ id }: { id: string }) {
  const { data, isLoading, error } = useApiGet(
    `/api/galleries/${id}`, 
    GallerySchema
  );
  
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>No gallery found</p>;
  
  // data is typed as z.infer<typeof GallerySchema>
  return <h1>{data.title}</h1>;
}
```

### Type-Safe Form Submission

```tsx
import { useSubmit } from '@/lib/hooks';
import { UpdateGallerySchema } from '@/lib/schemas';
import { z } from 'zod';

type GalleryUpdateData = z.infer<typeof UpdateGallerySchema>;

function GalleryEditForm({ gallery, onSuccess }) {
  const { handleSubmit, isSubmitting, error } = useSubmit<GalleryUpdateData>(
    async (data) => {
      // Data is validated by Zod before submission
      const updated = await updateGallery(gallery.id, data);
      onSuccess(updated);
    }
  );
  
  // Form implementation...
}
```

## Testing

When testing components that use schema-derived types, you can use the schemas to generate valid test data:

```tsx
import { GallerySchema } from '@/lib/schemas';
import { z } from 'zod';

// Generate sample data for tests
const sampleGallery: z.infer<typeof GallerySchema> = {
  id: 'gallery-1',
  title: 'Test Gallery',
  // ...other required fields
};

// Use in your tests
test('renders gallery title', () => {
  render(<GalleryView gallery={sampleGallery} />);
  expect(screen.getByText('Test Gallery')).toBeInTheDocument();
});
```

## Example Code

We've created several examples to help with the migration:

1. **Refactored API endpoints with schema validation**:
   - See `docs/schema-migration-examples/gallery-api-example.ts`

2. **Forms with Zod validation**:
   - See `docs/schema-migration-examples/zod-form-validation.tsx`

3. **Components using schema-derived types**:
   - See `docs/schema-migration-examples/SelectImagesDialogRefactored.tsx` (example using useApi hook approach)
   - `SelectImagesDialog.tsx` (implements direct fetch with AbortController)
   - `ThemedGalleryView.tsx` (already migrated)

4. **Type mapping utilities**:
   - `lib/utils/typeMappers.ts` - General mapping utilities
   - `lib/utils/galleryViewMappers.ts` - Gallery-specific mapping

## Additional Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form + Zod Integration](https://react-hook-form.com/docs/useform#resolver)
- [Type-safe APIs with Zod](https://www.totaltypescript.com/tutorials/zod)
