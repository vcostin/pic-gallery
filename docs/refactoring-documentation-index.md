# Refactoring Documentation Index

This document serves as a central navigation hub for all documentation related to the component refactoring and schema migration efforts in the Picture Gallery application.

## Quick Links

### High-Level Strategy
- [Component Organization Strategy](./component-organization-strategy.md) - Directory structure and export patterns
- [Schema Migration Strategy](./schema-migration-strategy.md) - How we're migrating to Zod schemas
- [Zod Components Migration Plan](./zod-components-migration-plan.md) - Overall plan for component migration

### Progress Tracking
- [Component Refactoring Progress](./component-refactoring-progress.md) - Current status of component refactoring
- [Zod Components Migration Progress](./zod-components-migration-progress.md) - Progress of migration to Zod
- [Schema Migration Progress Report](./schema-migration-progress-report.md) - Schema migration status
- [Zod Refactoring May 2025 Update](./zod-refactoring-may-2025-update.md) - May 2025 progress update
- [Component Rename Completion May 2025](./component-rename-completion-may-2025.md) - Summary of component renaming effort

### Next Steps
- [Component Refactoring Next Steps](./component-refactoring-next-steps.md) - Upcoming tasks
- [Hooks Refactoring Todo](./hooks-refactoring-todo.md) - Hook refactoring tasks

### Guides & Templates
- [Component Migration PR Template](./component-migration-pr-template.md) - Template for migration PRs
- [Component Template Pattern](./component-template-pattern.md) - Pattern for new components
- [Form Component Migration Guide](./form-component-migration-guide.md) - Guide for migrating form components
- [Gallery Form Migration Guide](./gallery-form-migration-guide.md) - Specific guide for gallery forms

### Historical Records
- [Component Migrations History](./component-migrations-history.md) - Consolidated record of all component migration statuses
- [EditImageDialog Migration Status](./edit-image-dialog-migration-status.md) (Legacy)
- [ProfileForm Migration Status](./profile-form-migration-status.md) (Legacy)
- [CreateGallery Migration Status](./create-gallery-migration-status.md) (Legacy)
- [TagsManagement Migration Status](./tags-management-migration-status.md) (Legacy)
- [GalleryDetailsForm Migration Status](./gallery-details-form-migration-status.md) (Legacy)

## Documentation Structure

Our refactoring documentation is organized into several categories to balance completeness with usability:

### 1. High-Level Strategy Documents

These documents outline the overall approach, goals, and architectural decisions for the refactoring effort. They change infrequently and provide guidance for the entire project.

### 2. Progress Tracking Documents

These documents are regularly updated to reflect the current status of the refactoring effort. They provide a high-level overview of what's been completed and what's still in progress.

### 3. Component Migration Historical Records

Previously, each component being migrated had its own status document to track migration progress, challenges, and implementation notes during active development. These have now been consolidated into a single historical record (`component-migrations-history.md`) while preserving the individual files for reference.

### 4. Guides and Templates

These documents provide standardized approaches and templates to ensure consistency across the refactoring effort. They're referenced when implementing new components or creating pull requests.

### 5. Next Steps and Planning

These documents outline upcoming tasks and priorities for the refactoring effort.

## Future Consolidation Plan

As the refactoring effort nears completion:

1. ✅ Component-specific status files have been archived into a single historical document (`component-migrations-history.md`)
2. ✅ Legacy backup files have been removed from the project
3. ✅ All components have been moved to feature-based directory structure
4. ✅ Component renaming (removal of "WithZod" suffix) has begun
5. Strategy documents may be consolidated into a comprehensive architecture document
6. This index will be updated to reflect the final state of the refactoring

## Related Technical Issues

- [Gallery Edit Infinite Loop Fix](./gallery-edit-infinite-loop-fix.md)
- [Gallery Image Removal Fix](./gallery-image-removal-fix.md)
- [Gallery Ordering Fix](./gallery-ordering-fix.md)
