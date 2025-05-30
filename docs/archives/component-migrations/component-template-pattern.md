# Component Template Pattern

This document outlines the standardized component pattern for form-based components using Zod validation in the Picture Gallery application. The pattern was established during the migration of our form components to use schema-based validation and feature-based organization.

## Component Structure

Each form component follows this structure:

```
src/components/FeatureName/
  ├── index.ts                    # Exports all components
  ├── FeatureName.tsx             # Legacy component (forwards to bridge)
  ├── FeatureNameWithZod.tsx      # Modern component with Zod validation
  ├── FeatureNameBridge.tsx       # Compatibility layer
  └── __tests__/                  # Test directory
      └── FeatureNameWithZod.test.tsx
```

## Component Types

### 1. Modern Component (`FeatureNameWithZod.tsx`)

The recommended component for new development:

```tsx
'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { FieldErrors, UseFormRegister, Control } from '@/lib/form-types';
import { FeatureSchema } from '@/lib/schemas';

// Define or import schema
export const FeatureSchema = z.object({
  // Schema fields here
});

// Derive TypeScript type from schema
export type FeatureData = z.infer<typeof FeatureSchema>;

// Component props
export interface FeatureNameWithZodProps {
  // Form handling (from react-hook-form)
  register: UseFormRegister<FeatureData>;
  errors: FieldErrors<FeatureData>;
  control: Control<FeatureData>;
  
  // Optional form change handler
  onChange?: (field: string, value: any) => void;
  
  // Optional display customization
  submitText?: string;
  isSubmitting?: boolean;
  // ...other props
}

export function FeatureNameWithZod({
  register,
  errors,
  control,
  onChange,
  submitText = 'Save',
  isSubmitting = false,
}: FeatureNameWithZodProps) {
  // Implementation
}
```

### 2. Bridge Component (`FeatureNameBridge.tsx`)

Provides compatibility with legacy code:

```tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FeatureNameWithZod, FeatureSchema } from './FeatureNameWithZod';
import type { FeatureData } from './FeatureNameWithZod';

export interface FeatureNameBridgeProps {
  // Legacy direct state setters
  setValue1?: (value: string) => void;
  setValue2?: (value: boolean) => void;
  // ...other legacy props
  
  // Modern props
  onSubmit?: (data: FeatureData) => void;
}

export function FeatureNameBridge({
  setValue1,
  setValue2,
  onSubmit,
}: FeatureNameBridgeProps) {
  const form = useForm({
    resolver: zodResolver(FeatureSchema)
  });
  
  // Handle field changes for legacy state setters
  const handleChange = (field: string, value: any) => {
    switch (field) {
      case 'field1': setValue1?.(value); break;
      case 'field2': setValue2?.(value); break;
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit || (() => {}))}>
      <FeatureNameWithZod
        register={form.register}
        errors={form.formState.errors}
        control={form.control}
        onChange={handleChange}
      />
    </form>
  );
}
```

### 3. Legacy Component (`FeatureName.tsx`)

Maintains backward compatibility:

```tsx
'use client';

import React from 'react';
import { FeatureNameBridge } from './FeatureNameBridge';
import type { FeatureNameBridgeProps } from './FeatureNameBridge';

export type FeatureNameProps = FeatureNameBridgeProps;

/**
 * @deprecated Use FeatureNameWithZod instead. Will be removed in a future release.
 */
export function FeatureName(props: FeatureNameProps) {
  console.warn('FeatureName is deprecated. Use FeatureNameWithZod instead.');
  return <FeatureNameBridge {...props} />;
}
```

## Export Pattern (`index.ts`)

```tsx
// Main entry point for FeatureName components

import { FeatureNameWithZod } from './FeatureNameWithZod';
import { FeatureName } from './FeatureName';
import { FeatureNameBridge } from './FeatureNameBridge';

// Re-export the Zod version as the default export
export { FeatureNameWithZod as default };

// Re-export all components
export { FeatureNameWithZod };
export { FeatureName };
export { FeatureNameBridge };

// Re-export types
export type { FeatureNameProps } from './FeatureName';
export type { FeatureNameWithZodProps, FeatureData } from './FeatureNameWithZod';
```

## Test Pattern

Tests should be comprehensive and include:

1. Basic rendering tests
2. Validation tests
3. Form submission tests
4. Change handler tests

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FeatureNameWithZod, FeatureData, FeatureSchema } from '../FeatureName';

// Create a test wrapper with form context
const TestWrapper = ({ children, defaultValues = {}, onSubmit = jest.fn() }) => {
  const methods = useForm({
    resolver: zodResolver(FeatureSchema),
    defaultValues: {
      // Default values here
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};

describe('FeatureNameWithZod', () => {
  it('renders correctly with all required props', () => {
    // Test rendering
  });
  
  it('displays validation errors for required fields', async () => {
    // Test validation
  });
  
  it('submits form with valid data', async () => {
    // Test submission
  });
  
  it('calls onChange when form inputs change', () => {
    // Test change handlers
  });
});
```

## Consumer Usage

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FeatureNameWithZod, FeatureData, FeatureSchema } from '@/components/FeatureName';

export default function FeaturePage() {
  const form = useForm<FeatureData>({
    resolver: zodResolver(FeatureSchema),
    defaultValues: {
      // Default values
    }
  });
  
  const onSubmit = form.handleSubmit(async (data) => {
    // Submit data
  });
  
  return (
    <form onSubmit={onSubmit}>
      <FeatureNameWithZod
        register={form.register}
        errors={form.formState.errors}
        control={form.control}
      />
    </form>
  );
}
```

## Guidelines

1. **Single Source of Truth**: Schemas should be defined in `/lib/schemas.ts`
2. **Type Derivation**: Use `z.infer<typeof Schema>` to derive types
3. **Directory Structure**: Follow the feature-based directory structure
4. **Exports**: Export components through index.ts files
5. **Testing**: Write comprehensive tests for each component
6. **Naming**: Use consistent naming patterns (`ComponentName`, `ComponentNameWithZod`, etc.)

## Migration Guide

When migrating existing components:

1. Create the feature directory
2. Move or create the Zod-based component
3. Create the bridge component
4. Update imports in existing code
5. Update the legacy component to forward to the bridge
6. Write tests for the new component
