// Main entry point for GalleryDetails components

// Import the components
import { GalleryDetailsForm } from './GalleryDetailsForm';
import { ModernGalleryDetailsForm } from './ModernGalleryDetailsForm';
import type { GalleryFormData } from './GalleryDetailsForm';

// Export the modern version as the default export
export { ModernGalleryDetailsForm as default };

// Export the main component
export { GalleryDetailsForm };

// Re-export types
export type { GalleryFormData };
