# Zod Form Components Migration Plan

## Overview

This document outlines the plan for migrating all form components in the application to use Zod schemas for validation. Currently, we have parallel implementations of several components, with the originals using traditional form handling and the "WithZod" versions using React Hook Form with Zod validation.

## Benefits of Migration

1. **Consistent Validation**: Same validation logic across frontend and backend
2. **Type Safety**: TypeScript types automatically derived from validation schemas
3. **Better Error Messages**: Zod provides detailed, structured validation errors
4. **Reduced Duplication**: Single source of truth for form validation rules
5. **Improved Developer Experience**: Auto-completion and type checking for form fields

## Current State

We have identified the following component pairs that need consolidation:

| Original Component | Zod-based Version | Status |
|-------------------|-------------------|--------|
| `GalleryDetailsForm.tsx` | `GalleryDetailsFormWithZod.tsx` | Both in active use |
| `CreateGallery.tsx` | `CreateGalleryWithZod.tsx` | Both in active use |
| `EditImageDialog.tsx` | `EditImageDialogWithZod.tsx` | Both in active use |
| `ProfileForm.tsx` | `ProfileFormWithZod.tsx` | Both in active use |
| `TagsManagement.tsx` | `TagsManagementWithZod.tsx` | Both in active use |

Several pages are still using the original versions:
- `/app/galleries/[id]/edit/page.tsx` uses `GalleryDetailsForm`
- Some pages might be using both versions in different contexts

## Migration Strategy

### Phase 1: Preparation (Current)

1. **Analyze Components**:
   - Document differences between each pair of components
   - Identify any unique functionality in original versions that needs to be preserved
   - Check for dependencies and imported components

2. **Create Test Coverage**:
   - Ensure Zod-based versions have sufficient test coverage
   - Add tests for any edge cases or special behaviors

### Phase 2: Component Consolidation

1. **Rename Components**:
   - Remove the "WithZod" suffix from Zod-based components
   - Add deprecation notices to original versions

2. **Update Exports**:
   - Create a migration path that doesnt break existing imports
   - Example approach:
   ```typescript
   // In GalleryDetailsForm.tsx
   import { GalleryDetailsFormWithZod } from './GalleryDetailsFormWithZod';
   
   /**
    * @deprecated Use the Zod-validated version instead.
    * This will be removed in a future release.
    */
   export function GalleryDetailsForm(props) {
     console.warn('GalleryDetailsForm is deprecated. Use the updated version instead.');
     // Either render the new component or keep legacy implementation
     return <GalleryDetailsFormWithZod {...props} />;
   }
   
   // Re-export the new implementation
   export * from './GalleryDetailsFormWithZod';
   ```

### Phase 3: Consumer Updates

1. **Update Page Components**:
   - Modify all pages using the original components to use the Zod versions
   - Focus on one component family at a time
   - Start with simpler components before complex ones

2. **Validation Handling**:
   - Ensure all form submissions use the Zod schemas for validation

### Phase 4: Cleanup

1. **Remove Deprecation Wrappers**:
   - Once all consumers have been updated, remove the wrappers
   - Update import paths where needed

2. **Delete Original Components**:
   - Remove the original non-Zod implementations
   - Update any remaining references

### Phase 5: Documentation

1. **Update Docs**:
   - Document the new standardized approach
   - Create examples for future component development

## Migration Timeline

| Phase | Components | Target Completion |
|-------|------------|------------------|
| Phase 1 | All components | May 20, 2025 |
| Phase 2 | GalleryDetailsForm, CreateGallery | May 25, 2025 |
| Phase 3 | EditImageDialog, ProfileForm | May 30, 2025 |
| Phase 2 | TagsManagement | June 5, 2025 |
| Phase 3 | All page components | June 15, 2025 |
| Phase 4 | Cleanup | June 30, 2025 |
| Phase 5 | Documentation | July 5, 2025 |

## Component Migration Priority

1. GalleryDetailsForm & CreateGallery (High priority, heavily used)
2. EditImageDialog (Medium priority)
3. ProfileForm (Medium priority)
4. TagsManagement (Lower priority)

## Tracking Progress

Well track progress in `zod-components-migration-tasks.md` with detailed tasks and completion status per component.
