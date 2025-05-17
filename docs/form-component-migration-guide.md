# Form Component Migration Guide

## Overview

This document provides a practical guide to implementing the form component migration strategy outlined in `zod-components-migration-plan.md`. It includes code examples, step-by-step instructions, and technical notes to help developers execute the migration effectively.

## Initial Component Analysis

When migrating form components from traditional to Zod-validated versions, we need to understand both implementations thoroughly:

1. **Original Component**: Usually manages state through direct props or internal state
2. **WithZod Component**: Uses React Hook Form with Zod schemas for validation

## Migration Implementation Steps

### Step 1: Update the WithZod Component

Ensure the WithZod component can handle all cases required by the original component:

```tsx
// Add support for field change notifications (needed by bridge)
interface GalleryDetailsFormProps {
  register: UseFormRegister<GalleryFormData>; 
  errors: FieldErrors<GalleryFormData>;
  control: Control<GalleryFormData>;
  defaultValues?: Partial<GalleryFormData>;
  
  // Add onChange handler to notify parent components
  onChange?: (field: keyof GalleryFormData, value: any) => void;
}
```

### Step 2: Create a Bridge Component 

Rather than directly modifying the original component (which could introduce bugs), create a bridge component:

```tsx
// GalleryDetailsFormBridge.tsx
import React from 'react';
import { useForm } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGallerySchema } from '@/lib/schemas';
import { GalleryDetailsFormWithZod, GalleryFormData } from './GalleryDetailsFormWithZod';

interface LegacyGalleryDetailsProps {
  title?: string;
  setTitle?: (title: string) => void;
  // ...other legacy props
}

export function GalleryDetailsFormBridge(props: LegacyGalleryDetailsProps) {
  const {
    title = '',
    setTitle,
    // ...other props
  } = props;
  
  const form = useForm({
    resolver: zodResolver(CreateGallerySchema),
    defaultValues: {
      title,
      // ...other fields
    }
  });
  
  const handleChange = (field: keyof GalleryFormData, value: any) => {
    // Call the appropriate setter based on field name
    if (field === 'title' && setTitle) setTitle(value);
    // ...handle other fields
  };
  
  return (
    <GalleryDetailsFormWithZod
      register={form.register}
      errors={form.formState.errors}
      control={form.control}
      onChange={handleChange}
    />
  );
}
```

### Step 3: Update the Original Component

Replace the original component with a re-export + deprecation warning:

```tsx
// GalleryDetailsForm.tsx
export { GalleryDetailsFormBridge as GalleryDetailsForm } from './GalleryDetailsFormBridge';

// Add a deprecation notice in the source file
/**
 * @deprecated This component is deprecated. Import GalleryDetailsFormWithZod directly.
 */
```

### Step 4: Update Tests

Don't forget to update tests to ensure both modes of operation work correctly:

```tsx
describe('GalleryDetailsForm', () => {
  it('works with legacy props', () => {
    // Test with title, setTitle props
  });
  
  it('works with react-hook-form props', () => {
    // Test with register, errors, control props
  });
});
```

## Technical Considerations

### Type Issues with React Hook Form

React Hook Form's TypeScript definitions can be tricky. Here's how to properly import and use them:

```tsx
import { useForm } from 'react-hook-form';
import type { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
```

### Handling Field Change Events

When using React Hook Form, field changes are handled through the form state. To trigger callbacks on field changes:

```tsx
// In WithZod component 
const titleField = register('title', {
  onChange: (e) => onChange?.('title', e.target.value)
});

<input {...titleField} />
```

### Simultaneous Support

During the migration period, both components need to be maintained. Once all consumers have been updated to the new pattern, we can remove the bridge component.
