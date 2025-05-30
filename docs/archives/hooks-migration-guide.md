# Hooks Migration Guide

This guide provides information on how to migrate from deprecated hooks to the new Zod schema-based hooks.

## Deprecated Hooks → Replacements

| Deprecated Hook (lib/hooks.ts) | Replacement |
|--------------------------------|-------------|
| `useFetch` | `useApi`, `useApiGet` (lib/hooks/useApi.ts) |
| `useAsync` | `useApi` (for API-specific async ops) |
| `useSubmit` | Form libraries like react-hook-form + zod |
| `useGalleryImages` | `useEnhancedGalleryImages` (lib/hooks/useEnhancedGallery.ts) |

## Benefits of New Hooks

1. **Schema Validation**: All data is validated against Zod schemas
2. **Type Safety**: TypeScript types are derived from Zod schemas
3. **Consistent Error Handling**: Standardized error handling across hooks
4. **Better Separation of Concerns**: UI/API operations are properly separated
5. **Single Source of Truth**: Schemas defined in lib/schemas.ts

## Migration Steps

### 1. Replace useFetch with useApi or useApiGet

```typescript
// Old approach
const { fetchApi, isLoading } = useFetch();

// New approach
const { fetch, isLoading } = useApi(MyDataSchema);
```

### 2. Replace useAsync for API calls with useApi

```typescript
// Old approach
const { run, data } = useAsync();

// New approach
const { fetch, data } = useApi(MyDataSchema);
```

### 3. Replace useGalleryImages with useEnhancedGalleryImages

```typescript
// Old approach
const { images, handleDragEnd } = useGalleryImages(initialImages);

// New approach
const { images, handleDragEnd } = useEnhancedGalleryImages(galleryId, initialImages);
```

---

*Note: The deprecated hooks have been removed as part of the codebase cleanup.*
