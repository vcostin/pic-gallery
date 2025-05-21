// Main entry point for TagsManagement components
// This file exports the tag components

import { TagsManagement } from '@/components/TagsManagement/TagsManagement';
import { TagsInput, TagSchema } from '@/components/TagsManagement/TagsInput';

// Re-export the components as the default exports
export { TagsManagement as default };

// Re-export the components with explicit names
export { TagsManagement };
export { TagsInput };

// Re-export types
export { TagSchema };
export type { TagsInputProps } from '@/components/TagsManagement/TagsInput';
export type { Tag } from '@/components/TagsManagement/TagsManagement';
