'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react'; // Removed useMemo
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
import { useFetch } from '@/lib/hooks';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageTags } from '@/components/ui/ImageTags';

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
  
  const { fetchApi, isLoading, error } = useFetch(); // Removed resetApiState
  
  const loadImages = useCallback(async () => {
    if (!isOpen) return;
    try {
      const queryParams = new URLSearchParams();
      if (currentSearchQuery) queryParams.set('searchQuery', currentSearchQuery);
      if (currentTagFilter) queryParams.set('tag', currentTagFilter);
      // Always expect the API to return { data: ImageType[] }
      const response = await fetchApi<{ data: { data: ImageType[]; meta?: unknown } }>(`/api/images?${queryParams.toString()}`);
      const fetchedImages = response.data.data;
      const filteredImages = Array.isArray(fetchedImages)
        ? fetchedImages.filter(img => !existingImageIds.includes(img.id))
        : [];
      setImages(filteredImages);
    } catch (fetchError) {
      logger.error('Error fetching images for dialog:', fetchError);
      setImages([]);
    }
  }, [isOpen, currentSearchQuery, currentTagFilter, fetchApi, existingImageIds]);

  useEffect(() => {
    if (isOpen) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      const timeoutId = setTimeout(() => {
        loadImages();
      }, DEBOUNCE_DELAY);
      setDebounceTimeout(timeoutId);

      setSelectedImages(new Set()); 
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSearchQuery, currentTagFilter, loadImages]); // loadImages is stable due to its own useCallback deps
  
  // Effect to load images once when dialog opens, without debounce for initial load
  useEffect(() => {
    if (isOpen) {
      loadImages();
      setSelectedImages(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only run when isOpen changes for the initial load


  // Client-side filtering is largely replaced by backend, but this can be a secondary filter if needed.
  // For now, `filteredImages` will just be `images` as the backend does the heavy lifting.
  const displayImages = images;

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
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col"> {/* Added flex flex-col */}
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

        <CardContent className="p-6 flex-grow overflow-y-auto"> {/* Added flex-grow and overflow-y-auto */}
          {/* Filter Inputs */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"> {/* Changed to md:grid-cols-2 since Apply button is removed */}
              <div>
                <label htmlFor="dialogImageSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Title/Desc.
                </label>
                <input
                  type="text"
                  id="dialogImageSearch"
                  value={currentSearchQuery}
                  onChange={(e) => setCurrentSearchQuery(e.target.value)}
                  // Removed onKeyDown
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Beach, Portrait"
                />
              </div>
              <div>
                <label htmlFor="dialogTagFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Tag
                </label>
                <input
                  type="text"
                  id="dialogTagFilter"
                  value={currentTagFilter}
                  onChange={(e) => setCurrentTagFilter(e.target.value)}
                  // Removed onKeyDown
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., travel, food"
                />
              </div>
              {/* Apply Filters Button Removed */}
            </div>
          </div>
          
          {error && (
            <ErrorMessage 
              error={error} 
              className="mb-4"
              retry={loadImages} // Allow retry on error
            />
          )}

          {isLoading ? (
            <LoadingSpinner size="medium" text="Loading images..." />
          ) : (
            <>
              {/* Tag selector UI - can be removed if tag input is preferred, or enhance to use fetched tags */}
              {/* <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={!currentTagFilter ? "primary" : "secondary"}
                  onClick={() => { setCurrentTagFilter(''); loadImages(); }} // Also trigger loadImages
                >
                  All
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={currentTagFilter === tag ? "primary" : "secondary"}
                    onClick={() => { setCurrentTagFilter(tag); loadImages(); }} // Also trigger loadImages
                  >
                    {tag}
                  </Button>
                ))}
              </div> */}

              {displayImages.length === 0 ? (
                <EmptyState
                  title="No images match your criteria"
                  description="Try adjusting your search or tag filters, or upload new images."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> {/* Added lg:grid-cols-5 */}
                  {displayImages.map(image => (
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
                        <ImageTags tags={image.tags} max={2} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate Buttons Removed From Here */}
            </>
          )}
        </CardContent>

        {/* Footer with action buttons - ensure it's sticky or visible */} 
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 mt-auto"> 
            <div className="flex justify-end space-x-3">
                <Button 
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading} // Disable if loading to prevent closing during fetch
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddImages}
                  disabled={selectedImages.size === 0 || isLoading}
                >
                  Add Selected ({selectedImages.size})
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
}
