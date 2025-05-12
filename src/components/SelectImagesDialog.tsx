'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
import { useApi } from '@/lib/hooks/useApi'; // Updated to use schema-validated API hook
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageTags } from '@/components/ui/ImageTags';
import { SelectableImageResponseSchema, SelectableImage } from '@/lib/utils/imageSelectionMappers';

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
  const [images, setImages] = useState<SelectableImage[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentTagFilter, setCurrentTagFilter] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Use type-safe API hook with Zod schema
  const { fetch: fetchImages, isLoading, error } = useApi(SelectableImageResponseSchema);
  
  const loadImages = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (currentSearchQuery) {
        params.append('search', currentSearchQuery);
      }
      if (currentTagFilter) {
        params.append('tag', currentTagFilter);
      }
      
      // Fetch images with schema validation
      const result = await fetchImages(`/api/images?${params.toString()}`);
      
      // The fetchImages returns { success, data } where data is the validated response
      if (result && result.success) {
        setImages(result.data.data);
      }
    } catch (err) {
      logger.error('Error loading images:', err);
    }
  }, [isOpen, currentSearchQuery, currentTagFilter, fetchImages]);

  // Initial load when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, loadImages]);
  
  // Reset selection when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImages(new Set());
    }
  }, [isOpen]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCurrentSearchQuery(query);
    
    // Debounce search to avoid excessive API calls
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      loadImages();
    }, DEBOUNCE_DELAY);
    
    setDebounceTimeout(timeoutId);
  };

  const toggleTagFilter = (tag: string) => {
    const newFilter = currentTagFilter === tag ? '' : tag;
    setCurrentTagFilter(newFilter);
    
    // Reset search query when changing tag filter
    setCurrentSearchQuery('');
    
    // No need to debounce for tag filtering
    setTimeout(() => loadImages(), 0);
  };

  const handleSelectImage = (imageId: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  };

  const handleConfirmSelection = () => {
    const selectedImageIds = Array.from(selectedImages);
    if (selectedImageIds.length > 0) {
      onImagesSelected(selectedImageIds);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Extract all tags from images for filter options
  const allTags = Array.from(
    new Set(
      images
        .flatMap(img => img.tags || [])
        .map(tag => tag.name)
    )
  ).sort();
  
  // Filter out images that are already in the gallery
  const availableImages = images.filter(img => !existingImageIds.includes(img.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Select Images</h2>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search images..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white pl-10"
              value={currentSearchQuery}
              onChange={handleSearchInputChange}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div>
            <Button 
              onClick={handleConfirmSelection}
              disabled={selectedImages.size === 0}
              variant="primary"
            >
              Add {selectedImages.size} {selectedImages.size === 1 ? 'Image' : 'Images'}
            </Button>
          </div>
        </div>
        
        {allTags.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  currentTagFilter === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <ErrorMessage error={error} />
          ) : availableImages.length === 0 ? (
            <EmptyState
              title="No images found"
              description={
                existingImageIds.length > 0 && existingImageIds.length === images.length
                  ? "All images are already in the gallery."
                  : "Try a different search query or upload new images."
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {availableImages.map(image => {
                const isSelected = selectedImages.has(image.id);
                return (
                  <Card 
                    key={image.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    onClick={() => handleSelectImage(image.id)}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={image.url}
                        alt={image.title}
                        fill
                        className="object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                          <div className="rounded-full bg-blue-500 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{image.title}</h3>
                      {image.tags && image.tags.length > 0 && (
                        <div className="mt-1">
                          <ImageTags 
                            tags={image.tags.map(tag => ({ id: tag.id, name: tag.name }))}
                            max={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
