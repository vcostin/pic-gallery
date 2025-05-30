# Component Organization Strategy

## Overview

This document outlines the component organization strategy we're using in the Picture Gallery application to improve maintainability, reduce redundancy, and facilitate the migration from plain components to schema-based, Zod-validated forms.

## Directory Structure

Components are organized into feature-based directories with consistent exports:

```
src/components/
  ├── FeatureName/              # Feature-specific directory
  │   ├── index.ts              # Exports all components in the directory
  │   ├── ComponentName.tsx     # Main component
  │   ├── ComponentNameWithZod.tsx  # Zod-validated version (eventually will replace main)
  │   └── ComponentNameBridge.tsx   # Compatibility layer for backward compatibility
  ├── ui/                      # Shared UI components
  │   ├── Button.tsx
  │   ├── Card.tsx
  │   └── ...
  └── ...
```

## Export Pattern

Each feature directory has an `index.ts` file that provides a clean API:

```typescript
// Main entry point for FeatureName components
// This file exports all versions to provide a clean migration path

import { ComponentNameWithZod } from './ComponentNameWithZod';
import { ComponentName } from './ComponentName';
import { ComponentNameBridge } from './ComponentNameBridge';

// Re-export the Zod version as the default export (current recommended)
export { ComponentNameWithZod as default };

// Re-export the Zod version explicitly named
export { ComponentNameWithZod };

// Re-export the legacy form for backwards compatibility
export { ComponentName };

// Re-export types
export type { ComponentNameProps } from './ComponentName';
export type { ComponentNameWithZodProps } from './ComponentNameWithZod';
```

## Migration Strategy

We're using a three-phase approach to migrate components:

1. **Parallel Implementation**: 
   - Create Zod-validated versions alongside original components
   - Name with "WithZod" suffix initially for clarity

2. **Bridge Components**:
   - Create bridge components that use the Zod version but maintain the original API
   - This allows existing consumers to continue working without changes

3. **Gradual Migration**:
   - Update imports in consuming components to use the new exports
   - Eventually rename components to remove "WithZod" suffix

## Component Structure

### Legacy Component

```tsx
/**
 * @deprecated Use ComponentNameWithZod instead. This component will be removed in a future release.
 * Import from '@/components/FeatureName' directly.
 */
export function ComponentName() {
  // Forward to bridge component that preserves API
  return <ComponentNameBridge />;
}
```

### Bridge Component 

```tsx
export function ComponentNameBridge(props: LegacyProps) {
  // Convert legacy props to Zod-validated form props
  const form = useForm({
    resolver: zodResolver(ComponentSchema)
  });
  
  // Handle direct state setters from legacy API
  const handleChange = (field, value) => {
    if (props.setField) props.setField(value);
  };
  
  return (
    <ComponentNameWithZod 
      register={form.register}
      control={form.control} 
      onChange={handleChange}
    />
  );
}
```

### Zod-Validated Component

```tsx
export function ComponentNameWithZod({
  register,
  control,
  errors,
  onChange,
}: FormProps) {
  // Implementation using react-hook-form + Zod
}
```

## Import Guidelines

When importing components:

1. Always import from the feature directory, not individual files:
   ```tsx
   // GOOD
   import { ComponentName } from '@/components/FeatureName';
   
   // AVOID
   import { ComponentName } from '@/components/FeatureName/ComponentName';
   ```

2. For form components, prefer Zod-validated versions:
   ```tsx
   // PREFERRED
   import { ComponentNameWithZod } from '@/components/FeatureName';
   
   // Or use the default export
   import ComponentName from '@/components/FeatureName';
   ```

## Testing

Test files should also import from the feature directory rather than direct files:

```tsx
// GOOD
import { ComponentName } from '../FeatureName';

// AVOID
import { ComponentName } from '../ComponentName';
```

## Completed Migrations

The following components have been migrated to the new structure:

- GalleryDetails
  - GalleryDetailsForm
  - GalleryDetailsFormWithZod
  - ModernGalleryDetailsForm
  - GalleryDetailsFormBridge

- Profile
  - ProfileForm
  - ProfileFormWithZod
  - ProfileFormBridge

- EditImage
  - EditImageDialog
  - EditImageDialogWithZod
  - EditImageDialogBridge

- TagsManagement
  - TagsManagementWithZod
  - TagsInput

- CreateGallery
  - CreateGallery
  - CreateGalleryWithZod
  - CreateGalleryBridge
