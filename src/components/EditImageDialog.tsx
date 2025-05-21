'use client';

import React from 'react';
import { EditImageDialogBridge } from './EditImageDialogBridge';
import logger from '@/lib/logger';

/**
 * @deprecated Use EditImageDialogWithZod instead. This component will be removed in a future release.
 * Import from '@/components/EditImageDialogWithZod' directly.
 */
interface EditImageDialogProps {
  image: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    tags: { id: string; name: string }[];
  };
  isOpen: boolean;
  onClose: (deletedImageId?: string) => void;
}

export function EditImageDialog({ 
  image, 
  isOpen, 
  onClose 
}: EditImageDialogProps): React.ReactElement {
  logger.log('Using deprecated EditImageDialog component - consider switching to EditImageDialogWithZod');
  return <EditImageDialogBridge image={image} isOpen={isOpen} onClose={onClose} />;
}
