# Schema-Based Type Migration Strategy

## Overview

This document outlines our strategy for migrating to Zod schema-derived types throughout the application. Our goal is to establish a single source of truth for data validation and TypeScript types using Zod schemas.

## Core Principles

1. **Define Once, Use Everywhere**: All types should be derived from Zod schemas defined in `lib/schemas.ts`
2. **Gradual Migration**: Convert components one at a time rather than attempting a big-bang approach
3. **API First**: Focus on API routes and data access layers first, then move to components
4. **Test As You Go**: Write tests for schemas and add tests when migrating components

## Migration Phases

### Phase 1: Infrastructure (Completed)

- ✅ Create centralized schema definitions in `lib/schemas.ts`
- ✅ Create API utilities in `lib/apiUtils.ts` for validation
- ✅ Add hooks for typed API calls in `lib/hooks/useApi.ts`
- ✅ Create mappers for type conversions in `lib/utils/typeMappers.ts`
- ✅ Add specialized mapper utilities (galleryViewMappers.ts, imageSelectionMappers.ts)

### Phase 2: API Routes (In Progress)

- ✅ Update gallery-related API routes
- ✅ Update image-related API routes
- [ ] Update user-related API routes
- [ ] Update authentication-related API routes

### Phase 3: Service Layer (In Progress)

- ✅ Create `galleryService.ts` with schema validation
- [ ] Create `imageService.ts` with schema validation
- [ ] Create `userService.ts` with schema validation

### Phase 4: Components (In Progress)

- ✅ Update `ThemedGalleryView.tsx` to use schema-derived types
- ✅ Update `GalleryView.tsx` to use schema-derived types
- ✅ Update `GalleryGrid.tsx` to use schema-defined types
- ✅ Update `SelectImagesDialog.tsx` to use schema-validated API
- [ ] Update `CreateGallery.tsx` to use schema-validated forms
- [ ] Update remaining image-related components
- [ ] Update user profile components

## Migration Guide for Developers

### Step 1: Check if a schema already exists

Before creating a new type, check if there's already a schema defined in `lib/schemas.ts`:

```typescript
import { GallerySchema, ImageSchema, UserSchema } from '@/lib/schemas';
import { z } from 'zod';

// Use Z.infer to get TypeScript types from schemas
type Gallery = z.infer<typeof GallerySchema>;
```

### Step 2: Update component props to use schema-derived types

```typescript
// BEFORE
interface MyComponentProps {
  gallery: {
    id: string;
    title: string;
    // ...manually defined properties
  };
}

// AFTER
import { GallerySchema } from '@/lib/schemas';
import { z } from 'zod';

type Gallery = z.infer<typeof GallerySchema>;

interface MyComponentProps {
  gallery: Gallery;
}
```

### Step 3: Use type mappers for derived or simplified types

If you need a simplified version of a schema-derived type:

```typescript
import { DisplayGallery, mapToGalleryView } from '@/lib/utils/galleryViewMappers';

// Component using the simpler type
interface GalleryCardProps {
  gallery: DisplayGallery;
}

// Convert from full gallery to display gallery
const displayGallery = mapToGalleryView(fullGallery);
```

### Step 4: Replace API calls with schema-validated ones

```typescript
// BEFORE
const { fetchApi, isLoading, error } = useFetch();
const data = await fetchApi<SomeType>('/api/endpoint');

// AFTER
import { useApi } from '@/lib/hooks/useApi';
import { SomeSchema } from '@/lib/schemas';

const { fetch, isLoading, error } = useApi(SomeSchema);
const result = await fetch('/api/endpoint');
if (result.success) {
  // result.data is typed according to SomeSchema
}
```

### Step 5: Add validation to forms

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGallerySchema } from '@/lib/schemas';

const { register, handleSubmit, errors } = useForm({
  resolver: zodResolver(CreateGallerySchema)
});
```

## Testing

When migrating a component:

1. Write tests for any new mapper functions
2. Update existing component tests to use schema-derived test data
3. Add validation tests for forms and API calls

## Common Patterns

### Handling Nullable vs Undefined

Zod schemas often use `.nullable()` but component props might expect undefined:

```typescript
// In mapper function
return {
  ...sourceData,
  description: sourceData.description || undefined // Convert null to undefined
};
```

### Safely Accessing Optional Properties

Use optional chaining and nullish coalescing:

```typescript
// Safe access
const title = data?.gallery?.title ?? 'Untitled';
```

### Working with Schema Extensions

Create extended schemas for specific use cases:

```typescript
const EnhancedGallerySchema = GallerySchema.extend({
  extraField: z.string(),
  computedValue: z.number()
});
```

## Need Help?

Check the example files in `docs/schema-migration-examples/` for reference implementations, or reach out to the team on Slack in the #schema-migration channel.
