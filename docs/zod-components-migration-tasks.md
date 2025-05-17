# Zod Components Migration Tasks

This document provides a detailed task list for migrating from regular components to their Zod-schema validated versions.

## Form Components

### GalleryDetailsForm → GalleryDetailsFormWithZod

- [ ] Compare implementations of both components
  - [ ] Identify prop differences
  - [ ] Catalog validation differences
- [ ] Find all usages of GalleryDetailsForm
  - [ ] Count locations where component is imported
  - [ ] Check if there are any special prop combinations
- [ ] Create an adapter function if needed for backward compatibility
- [ ] Update all imports in consuming components
- [ ] Write tests for the migration
- [ ] Remove the original component once all usages are migrated
- [ ] Rename GalleryDetailsFormWithZod to GalleryDetailsForm

### ProfileForm → ProfileFormWithZod

- [ ] Compare implementations of both components
  - [ ] Identify prop differences
  - [ ] Catalog validation differences
- [ ] Find all usages of ProfileForm
  - [ ] Count locations where component is imported
  - [ ] Check if there are any special prop combinations
- [ ] Create an adapter function if needed for backward compatibility
- [ ] Update all imports in consuming components
- [ ] Write tests for the migration
- [ ] Remove the original component once all usages are migrated
- [ ] Rename ProfileFormWithZod to ProfileForm

## Dialog Components

### EditImageDialog → EditImageDialogWithZod

- [ ] Compare implementations of both components
  - [ ] Identify prop differences
  - [ ] Catalog validation differences
- [ ] Find all usages of EditImageDialog
  - [ ] Count locations where component is imported
  - [ ] Check if there are any special prop combinations
- [ ] Create an adapter function if needed for backward compatibility
- [ ] Update all imports in consuming components
- [ ] Write tests for the migration
- [ ] Remove the original component once all usages are migrated
- [ ] Rename EditImageDialogWithZod to EditImageDialog

## Full Page Components

### CreateGallery → CreateGalleryWithZod

- [ ] Compare implementations of both components
  - [ ] Identify prop differences
  - [ ] Catalog state management differences
- [ ] Find all usages of CreateGallery
  - [ ] Check import locations
  - [ ] Audit any direct references in routes
- [ ] Create tests for the migration
- [ ] Update all imports and router configurations
- [ ] Remove the original component once all usages are migrated
- [ ] Rename CreateGalleryWithZod to CreateGallery

### TagsManagement → TagsManagementWithZod

- [ ] Compare implementations of both components
  - [ ] Identify prop differences
  - [ ] Catalog state management differences
- [ ] Find all usages of TagsManagement
  - [ ] Check import locations
  - [ ] Audit any direct references in routes
- [ ] Create tests for the migration
- [ ] Update all imports and router configurations
- [ ] Remove the original component once all usages are migrated
- [ ] Rename TagsManagementWithZod to TagsManagement

## Verification

- [ ] Create end-to-end tests for key user flows
- [ ] Verify all form validations work as expected
- [ ] Check that error messages are displayed correctly
- [ ] Ensure accessibility is maintained or improved
- [ ] Test mobile responsiveness of all migrated components

## Documentation

- [ ] Update component documentation
- [ ] Create examples of using the new consolidated components
- [ ] Update any developer guides that reference these components
- [ ] Add notes about the migration to the project README
