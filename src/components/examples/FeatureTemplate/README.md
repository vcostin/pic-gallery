# Feature Template Component

This documentation outlines how to use the `FeatureTemplate` components and demonstrates the recommended pattern for creating and migrating components in the Picture Gallery application.

## Directory Structure

```
/components/examples/FeatureTemplate/
├── index.ts               # Main entry point that exports all components
├── FeatureTemplate.tsx    # Legacy component (forwards to bridge)
├── FeatureTemplateBridge.tsx  # Compatibility layer
├── FeatureTemplateWithZod.tsx # Modern component with Zod validation
└── __tests__/             # Test directory
    └── FeatureTemplateWithZod.test.tsx  # Component tests
```

## Component Types

### Modern Component (`FeatureTemplateWithZod.tsx`)

This is the recommended component to use for new code. It:

- Uses Zod for schema validation
- Derives TypeScript types from the schema
- Integrates with react-hook-form
- Provides detailed error messaging
- Is fully typed and validated

```tsx
import { FeatureTemplateWithZod } from '@/components/examples/FeatureTemplate';

// Usage with react-hook-form
function ParentComponent() {
  const form = useForm({
    resolver: zodResolver(FeatureTemplateSchema)
  });
  
  return (
    <FeatureTemplateWithZod
      register={form.register}
      errors={form.formState.errors}
      control={form.control}
      onChange={(field, value) => console.log(field, value)}
    />
  );
}
```

### Bridge Component (`FeatureTemplateBridge.tsx`)

This is an internal component that adapts the modern component API to match the legacy API. It:

- Wraps the modern component with a form provider
- Handles form submission
- Provides backward compatibility for direct state setters
- Should not be used directly by consumers

### Legacy Component (`FeatureTemplate.tsx`)

This component exists for backward compatibility and forwards to the bridge component. It:

- Maintains the original API for existing code
- Warns about deprecation
- Will be removed in a future release

```tsx
import { FeatureTemplate } from '@/components/examples/FeatureTemplate';

// Legacy usage
function LegacyParentComponent() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  
  return (
    <FeatureTemplate
      setName={setName}
      setCategory={setCategory}
      onSubmit={handleSubmit}
    />
  );
}
```

## Index File Pattern

The `index.ts` file provides a clean API for consumers:

```tsx
// Export the modern component as the default export
export { FeatureTemplateWithZod as default };

// Named exports for all components
export { FeatureTemplateWithZod };
export { FeatureTemplate };

// Type exports
export type { FeatureTemplateProps };
export type { FeatureTemplateWithZodProps, FeatureTemplateData };
```

## Schema and Type Definitions

```tsx
// Define the schema
const FeatureTemplateSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  // ...more fields
});

// Derive TypeScript type from schema
type FeatureTemplateData = z.infer<typeof FeatureTemplateSchema>;
```

## Testing Guidelines

Tests should:

1. Import components from the feature directory, not individual files
2. Test validation errors
3. Test form state changes
4. Use a FormProvider wrapper for testing
5. Test with different initial data

## Migration Steps

When migrating an existing component:

1. Create a new directory for the component
2. Create the index.ts file with proper exports
3. Move the original component and rename it if necessary
4. Create the Zod-validated version
5. Create the bridge component
6. Update all imports in consuming components
7. Update tests to use the new import paths

## Best Practices

1. **Always import from the feature directory**:
   ```tsx
   // GOOD
   import { FeatureTemplate } from '@/components/examples/FeatureTemplate';
   
   // AVOID
   import { FeatureTemplate } from '@/components/examples/FeatureTemplate/FeatureTemplate';
   ```

2. **Use schema-based validation**:
   - Define a Zod schema for your form data
   - Derive TypeScript types from the schema
   - Use zodResolver with react-hook-form

3. **Handle errors properly**:
   - Display error messages below each field
   - Use aria attributes for accessibility
   - Style inputs differently when they have errors

4. **Write comprehensive tests**:
   - Test rendering with different props
   - Test validation errors
   - Test form submission
   - Test with initial data

5. **Document your components**:
   - Add JSDoc comments to explain the purpose of the component
   - Include examples in the documentation
   - Indicate deprecated components
