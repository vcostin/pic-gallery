# Zod Components Migration Plan

## Background

Our codebase currently has duplicate components with regular and "WithZod" versions:

- `GalleryDetailsForm.tsx` and `GalleryDetailsFormWithZod.tsx`
- `CreateGallery.tsx` and `CreateGalleryWithZod.tsx`
- `EditImageDialog.tsx` and `EditImageDialogWithZod.tsx`
- `ProfileForm.tsx` and `ProfileFormWithZod.tsx`
- `TagsManagement.tsx` and `TagsManagementWithZod.tsx`

This duplication is part of our ongoing migration to use schema-derived types and form validation with Zod. We need a strategy to consolidate these components and complete our migration.

## Key Differences Between Versions

1. **Form Handling**:
   - Regular versions use manual form state management with separate state variables
   - "WithZod" versions use `react-hook-form` with `zodResolver` for schema validation

2. **Type Safety**:
   - Regular versions rely on manually defined interfaces
   - "WithZod" versions use schema-derived types from Zod

3. **Validation**:
   - Regular versions have manual validation or minimal validation
   - "WithZod" versions benefit from automatic schema-based validation

## Migration Strategy

### Phase 1: Assessment (Current)

- [x] Identify all component pairs with regular and "WithZod" versions
- [x] Understand differences in implementation and dependencies
- [x] Check which components are being actively used in the application

### Phase 2: Preparation

- [ ] Create a test plan for affected components
- [ ] Ensure all "WithZod" components have adequate test coverage
- [ ] Review all usages of regular components

### Phase 3: Migration (Per Component)

1. **Identify Integration Points**:
   - Find all places where the regular component is imported
   - Understand the props and behavior expected by consuming components

2. **Update Imports**:
   - Replace imports for regular components with their "WithZod" equivalents
   - Test these changes to ensure functionality is maintained

3. **Update Component Usage**:
   - Modify consumers to accommodate any prop changes between versions
   - Ensure form handling is consistent with Zod-based validation

4. **Backward Compatibility (if needed)**:
   - For widely used components, consider adding temporary compatibility layers

### Phase 4: Cleanup

- [ ] Rename "WithZod" components to their regular names (e.g., `GalleryDetailsFormWithZod.tsx` → `GalleryDetailsForm.tsx`)
- [ ] Remove old component versions
- [ ] Update documentation to reflect the new component structure
- [ ] Update any remaining references in code or examples

## Migration Order

1. Form Components
   - GalleryDetailsForm → GalleryDetailsFormWithZod
   - ProfileForm → ProfileFormWithZod

2. Dialog Components
   - EditImageDialog → EditImageDialogWithZod

3. Full Page Components
   - CreateGallery → CreateGalleryWithZod
   - TagsManagement → TagsManagementWithZod

## Benefits

1. **Consistency**: All components will use the same pattern for form validation
2. **Type Safety**: Improved TypeScript integration with schema-derived types
3. **Maintainability**: Reduced code duplication and standardized patterns
4. **Reliability**: Improved validation across the application

## Timeline

- Component evaluation: 1 week
- Migration of form components: 1 week
- Migration of dialog components: 1 week
- Migration of full page components: 2 weeks
- Testing and cleanup: 1 week

Total estimated time: 6 weeks
