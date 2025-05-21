/**
 * Profile Component Package
 * 
 * This module exports the ProfileForm component for editing user profiles.
 * 
 * @module Profile
 */

import { ProfileForm } from '@/components/Profile/ProfileForm';

/**
 * Default export - ProfileForm component
 */
export { ProfileForm as default };

/**
 * ProfileForm component with Zod schema validation
 * Uses UserService for API interactions and provides strong type safety.
 */
export { ProfileForm };

// Re-export types
export type { ProfileFormData } from '@/components/Profile/ProfileForm';
