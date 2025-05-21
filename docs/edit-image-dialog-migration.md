# EditImageDialog Migration Guide

This document outlines the migration process for the `EditImageDialog` component to use Zod schema validation. It follows the form component migration strategy outlined in `docs/form-component-migration-guide.md`.

## Migration Overview

The migration involves several components:

1. **EditImageDialogWithZod**: The modern component using Zod schema validation
2. **EditImageDialogBridge**: A bridge component for backward compatibility
3. **EditImageDialog**: The legacy component (now forwards to the bridge)

## Component Structure

### Directory Structure

```
src/components/EditImage/
├── EditImageDialogWithZod.tsx   # Modern component with Zod validation
├── EditImageDialog.tsx          # Legacy component (forwards to bridge)
├── EditImageDialogBridge.tsx    # Bridge component for compatibility
└── index.ts                     # Exports all versions
```

### Export Pattern

The `index.ts` file exports all components with appropriate naming:

```typescript
// Default export (recommended for new code)
export { EditImageDialogWithZod as default };

// Named exports for all versions
export { EditImageDialogWithZod };
export { EditImageDialog };
export { EditImageDialog as LegacyEditImageDialog };
export { EditImageDialogBridge };
```

## Migration Strategy

### Phase 1: Create Modern Component

Created `EditImageDialogWithZod.tsx` with:
- Zod schema validation
- React Hook Form integration
- Strong TypeScript typing
- Integration with `ImageService`
- Proper error handling

### Phase 2: Create Bridge Component

Created `EditImageDialogBridge.tsx` to:
- Accept legacy props structure
- Adapt data to format expected by modern component
- Forward to modern component

### Phase 3: Update Legacy Component

Updated `EditImageDialog.tsx` to:
- Add deprecation notices
- Forward all calls to bridge component
- Maintain same API for backward compatibility

### Phase 4: Update Exports

Created `index.ts` to:
- Export all versions with appropriate naming
- Set modern component as default export
- Add documentation for migration path

## Migration Benefits

1. **Type Safety**: Schema validation ensures proper types
2. **Validation**: Form inputs are properly validated
3. **API Integration**: Uses `ImageService` for API calls
4. **Error Handling**: Improved error handling and messaging
5. **Test Coverage**: Enhanced test coverage

## Usage Examples

### Using Modern Component (Recommended)

```tsx
import { EditImageDialogWithZod } from '@/components/EditImage';

// Using named import
function MyComponent() {
  return <EditImageDialogWithZod image={image} isOpen={isOpen} onClose={handleClose} />;
}
```

```tsx
import EditImageDialog from '@/components/EditImage';

// Using default import
function MyComponent() {
  return <EditImageDialog image={image} isOpen={isOpen} onClose={handleClose} />;
}
```

### Using Legacy Component (Deprecated)

```tsx
import { EditImageDialog } from '@/components/EditImage';

// Legacy usage - will still work but shows deprecation warning
function MyComponent() {
  return <EditImageDialog image={image} isOpen={isOpen} onClose={handleClose} />;
}
```

## Testing

The components have test coverage in:
- `src/components/__tests__/EditImageDialog.test.tsx`
- `src/components/__tests__/EditImageDialogWithZod.test.tsx`
- `src/components/__tests__/EditImageDialogWithZod.enhanced.test.tsx`

## Next Steps

1. Update all consumers to use the modern component directly
2. Once all usage is migrated, remove the bridge and legacy components
3. Consider renaming the component to remove the `WithZod` suffix
