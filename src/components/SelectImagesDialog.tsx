'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
import { useFetch } from '@/lib/hooks';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Tag {
  id: string;
  name: string;
}

interface ImageType {
  id: string;
  title: string;
  description: string | null;
  url: string;
  userId: string;
  tags: Tag[];
}

interface SelectImagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesSelected: (addedImageIds: string[]) => void; // Changed from optional to required
  existingImageIds?: string[];
  galleryId?: string; // Added galleryId as optional prop
}

export function SelectImagesDialog({ 
  isOpen, 
  onClose, 
  onImagesSelected,
  existingImageIds = [] 
}: SelectImagesDialogProps) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  
  const { fetchApi, isLoading, error } = useFetch();
  
  // Fetch user's images when component mounts
  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await fetchApi<ImageType[]>('/api/images');
        
        // Filter out images that are already in the gallery
        const filteredImages = data.filter(
          (img) => !existingImageIds.includes(img.id)
        );
        
        setImages(filteredImages);
      } catch (error) {
        // Error handled by useFetch hook
        logger.error('Error fetching images:', error);
      }
    }

    if (isOpen) {
      fetchImages();
      setSelectedImages(new Set()); // Reset selection when dialog opens
    }
  }, [isOpen, existingImageIds, fetchApi]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach(image => {
      image.tags.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!selectedTag) return images;
    return images.filter(image => 
      image.tags.some(tag => tag.name === selectedTag)
    );
  }, [images, selectedTag]);

  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  }, []);

  const handleAddImages = useCallback(() => {
    if (selectedImages.size === 0) {
      // Return empty array instead of undefined
      onImagesSelected([]);
      return;
    }
    
    const selectedImageIds = Array.from(selectedImages);
    logger.log(`Selected ${selectedImageIds.length} images to add to gallery`);
    
    // Pass the selected image IDs back to the parent component
    onImagesSelected(selectedImageIds);
  }, [selectedImages, onImagesSelected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Select Images</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-1"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        <CardContent className="p-6">
          {error && (
            <ErrorMessage 
              error={error} 
              className="mb-4" 
            />
          )}

          {isLoading ? (
            <LoadingSpinner size="medium" text="Loading images..." />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={!selectedTag ? "primary" : "secondary"}
                  onClick={() => setSelectedTag('')}
                >
                  All
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={selectedTag === tag ? "primary" : "secondary"}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

              {filteredImages.length === 0 ? (
                <EmptyState
                  title="No images available"
                  description="No images available to add. All your images might already be in this gallery."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredImages.map(image => (
                    <div 
                      key={image.id} 
                      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer
                        ${selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''}
                      `}
                      onClick={() => toggleImageSelection(image.id)}
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={image.url}
                          alt={image.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover"
                          unoptimized
                        />
                        {selectedImages.has(image.id) && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-sm truncate">{image.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag.id}
                              className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {image.tags.length > 2 && (
                            <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              +{image.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6 space-x-3">
                <Button 
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddImages}
                  disabled={selectedImages.size === 0}
                >
                  Add Selected ({selectedImages.size})
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
