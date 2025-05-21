# Component Directory Guide

This guide provides practical examples for developers working with the component directory structure in the Picture Gallery project.

## Creating a New Component

When creating a new component, follow these steps:

1. **Choose the right directory**:
   - If it belongs to an existing feature, place it in that feature directory
   - If it's a new feature, create a new directory for it
   - If it's a generic UI component, place it in the `ui` directory

2. **Use schema-based validation**:
   - Use Zod schemas for form validation
   - Derive types from schemas
   - Follow example in `components/examples/SchemaBasedComponent.tsx`

3. **Export properly**:
   - Create or update the `index.ts` file in the directory
   - Export the component and its types
   - Make the most commonly used version the default export

## Example: Creating a New Feature Component

Let's say you're creating a new `UserPreferences` component:

1. **Create directory structure**:
   ```
   src/components/UserPreferences/
   ├── index.ts
   ├── UserPreferences.tsx
   ├── UserPreferencesWithZod.tsx  # If using form validation
   └── UserPreferencesBridge.tsx   # If needed for backwards compatibility
   ```

2. **Create the index.ts file**:
   ```typescript
   // Main entry point for UserPreferences components
   
   import { UserPreferencesWithZod } from './UserPreferencesWithZod';
   import { UserPreferences } from './UserPreferences';
   
   // Re-export the Zod version as the default export
   export { UserPreferencesWithZod as default };
   
   // Re-export named components
   export { UserPreferencesWithZod };
   export { UserPreferences };
   
   // Re-export types
   export type { UserPreferencesProps } from './UserPreferences';
   ```

3. **Implement the component using schema validation**:
   ```typescript
   // UserPreferencesWithZod.tsx
   'use client';
   
   import { z } from 'zod';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   
   const UserPreferencesSchema = z.object({
     // Define schema here
   });
   
   type UserPreferencesData = z.infer<typeof UserPreferencesSchema>;
   
   export function UserPreferencesWithZod() {
     const form = useForm({
       resolver: zodResolver(UserPreferencesSchema)
     });
     
     // Implement component
   }
   ```

## Migrating Existing Components

When migrating components to the directory structure:

1. Move files to the feature directory
2. Update the index.ts exports
3. Update consumers to import from the feature directory
4. Update tests to use the new import path
5. Remove old files from the root directory

## API Usage Guidelines

When using components, import them like this:

```tsx
// Import from the feature directory
import { ComponentName } from '@/components/FeatureName';

// Or use the default export
import ComponentName from '@/components/FeatureName';
```

## Testing Guidelines

Write tests for individual components:

```tsx
// In __tests__/ComponentName.test.tsx
import { ComponentName } from '../FeatureName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName />);
    // Test assertions
  });
});
```

## Completed Examples

For reference, check these well-structured components:

- `src/components/GalleryDetails/` - Complete implementation with bridge pattern
- `src/components/TagsManagement/` - Simple component with direct Zod implementation
- `src/components/examples/SchemaBasedComponent.tsx` - Example template
