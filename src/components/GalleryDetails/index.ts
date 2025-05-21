/**
 * GalleryDetails components module
 * 
 * This module exports the GalleryDetailsForm component and related types.
 * GalleryDetailsForm is the preferred Zod-validated implementation.
 */

// Import the main component
import { GalleryDetailsForm } from '@/components/GalleryDetails/GalleryDetailsForm';
import type { GalleryFormData } from '@/components/GalleryDetails/GalleryDetailsForm';

// Export the component as the default export
export default GalleryDetailsForm;

// Export named component
export { GalleryDetailsForm };

// Re-export types
export type { GalleryFormData };
