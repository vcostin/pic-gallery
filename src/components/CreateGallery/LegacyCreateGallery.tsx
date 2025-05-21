'use client';

import React from 'react';
import { CreateGalleryBridge } from './CreateGalleryBridge';
import logger from '@/lib/logger';

/**
 * Props for the CreateGallery component to maintain compatibility with existing usage
 */
interface CreateGalleryProps {
  availableImages?: Array<{
    id: string;
    userId: string;
    title: string;
    description: string | null;
    url: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

/**
 * @deprecated Use the new CreateGallery component. This legacy component will be removed in a future release.
 * Import from '@/components/CreateGallery' directly to use the new version.
 */
export function CreateGallery({ availableImages }: CreateGalleryProps): React.ReactElement {
  logger.log('Using legacy CreateGallery component - please switch to the new CreateGallery implementation');
  return <CreateGalleryBridge availableImages={availableImages} />;
}
