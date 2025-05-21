// Main entry point for FeatureTemplate components
// This file exports all versions to provide a clean API

import { FeatureTemplateWithZod } from './FeatureTemplateWithZod';
import { FeatureTemplate } from './FeatureTemplate';
import { FeatureTemplateBridge } from './FeatureTemplateBridge';

// Re-export the Zod version as the default export (current recommended)
export { FeatureTemplateWithZod as default };

// Re-export the Zod version explicitly named
export { FeatureTemplateWithZod };

// Re-export the legacy form for backwards compatibility
export { FeatureTemplate };

// Re-export the legacy version explicitly named
export { FeatureTemplate as LegacyFeatureTemplate };

// Re-export the bridge component
export { FeatureTemplateBridge };

// Re-export types
export type { FeatureTemplateProps } from './FeatureTemplate';
export type { FeatureTemplateWithZodProps, FeatureTemplateData } from './FeatureTemplateWithZod';
