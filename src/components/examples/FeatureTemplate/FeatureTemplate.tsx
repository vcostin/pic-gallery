'use client';

import React from 'react';
import { FeatureTemplateBridge } from './FeatureTemplateBridge';
import type { FeatureTemplateBridgeProps } from './FeatureTemplateBridge';

/**
 * Props for the legacy component
 */
export type FeatureTemplateProps = FeatureTemplateBridgeProps;

/**
 * @deprecated Use FeatureTemplateWithZod instead. This component will be removed in a future release.
 * Import from '@/components/examples/FeatureTemplate' directly.
 */
export function FeatureTemplate(props: FeatureTemplateProps) {
  console.warn(
    'FeatureTemplate is deprecated. Please use FeatureTemplateWithZod instead. ' +
    'Import from @/components/examples/FeatureTemplate directly.'
  );
  
  // Forward to bridge component that preserves API
  return <FeatureTemplateBridge {...props} />;
}
