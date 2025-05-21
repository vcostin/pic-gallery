// Main entry point for TagsManagement components
// This file exports the tag components

import { TagsManagement } from './TagsManagement';
import { TagsInput, TagSchema } from './TagsInput';

// Re-export the components as the default exports
export { TagsManagement as default };

// Re-export the components with explicit names
export { TagsManagement };
export { TagsInput };

// Re-export types
export { TagSchema };
export type { TagsInputProps } from './TagsInput';
export type { Tag } from './TagsManagement';
