/**
 * Example refactoring of SelectImagesDialog to use schema-derived types
 * This is for demonstration purposes and should be done in the actual component file
 */
'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageTags } from '@/components/ui/ImageTags';
// Import useApi hook and image schema
import { useApi } from '@/lib/hooks/useApi';
import { createPaginatedResponseSchema, ImageSchema } from '@/lib/schemas';
import { z } from 'zod';

// Create a schema for the paginated images response
const PaginatedImagesSchema = createPaginatedResponseSchema(ImageSchema);
type ImageType = z.infer<typeof ImageSchema>;

interface SelectImagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesSelected: (addedImageIds: string[]) => void;
  existingImageIds?: string[];
  galleryId?: string;
}

const DEBOUNCE_DELAY = 500; // 500ms delay for debouncing

export function SelectImagesDialog({ 
  isOpen, 
  onClose, 
  onImagesSelected,
  existingImageIds = [] 
}: SelectImagesDialogProps) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentTagFilter, setCurrentTagFilter] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Use the schema-validated API hook
  const { fetch: fetchApi, isLoading, error } = useApi(PaginatedImagesSchema);
  
  const loadImages = useCallback(async () => {
    if (!isOpen) return;
    try {
      const queryParams = new URLSearchParams();
      if (currentSearchQuery) queryParams.set('searchQuery', currentSearchQuery);
      if (currentTagFilter) queryParams.set('tag', currentTagFilter);
      
      const result = await fetchApi(`/api/images?${queryParams.toString()}`);
      
      if (result.success) {
        const fetchedImages = result.data.data;
        const filteredImages = Array.isArray(fetchedImages)
          ? fetchedImages.filter(img => !existingImageIds.includes(img.id))
          : [];
        setImages(filteredImages);
      }
    } catch (err) {
      logger.error('Failed to load images', err);
    }
  }, [isOpen, fetchApi, currentSearchQuery, currentTagFilter, existingImageIds]);
  
  // Rest of the component implementation...
}
