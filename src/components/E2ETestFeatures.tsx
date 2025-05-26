'use client';

import React from 'react';
import { E2ETestCleanupButton } from '@/components/E2ETestCleanup';

/**
 * This component adds the E2E test cleanup button to the layout
 * without requiring the entire layout to be a client component.
 */
export function E2ETestFeatures() {
  return <E2ETestCleanupButton />;
}
