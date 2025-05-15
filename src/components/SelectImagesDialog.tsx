'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/StatusMessages';
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

const DEBOUNCE_DELAY = 300; // 300ms delay for debouncing - responsive yet not too frequent

export function SelectImagesDialog({ 
  isOpen, 
  onClose, 
  onImagesSelected,
  existingImageIds = [] 
}: SelectImagesDialogProps) {
  const [images, setImages] = useState<SelectableImage[]>([]);
  const [inputValue, setInputValue] = useState(''); // Track the input value for immediate UI updates
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentTagFilter, setCurrentTagFilter] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  // No need for a filter ref as we're using the current state values directly
  
  // Reference to track if this is the first render
  const didFetchRef = useRef(false);
  
  // State for loading UI and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Last fetch controller - used to cancel ongoing requests when a new one is made
  const lastRequestRef = useRef<AbortController | null>(null);
  
  // Fetch images from API with query and tag filters
  const fetchImages = useCallback(async (query: string, tag: string) => {
    // Clean up previous request if it exists
    if (lastRequestRef.current) {
      lastRequestRef.current.abort();
    }
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    lastRequestRef.current = controller;
    
    // Show loading state
    setIsLoading(true);
    setError(null);
    
    // Build URL with query params
    const params = new URLSearchParams();
    if (query) params.append('searchQuery', query);
    if (tag) params.append('tag', tag);
    const url = `/api/images${params.toString() ? `?${params.toString()}` : ''}`;
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.log(`Fetching images: query="${query}", tag="${tag}"`);
    }
    
    try {
      // Make the API request with abort signal
      const response = await fetch(url, { signal: controller.signal });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Validate the response with schema 
      const validData = SelectableImageResponseSchema.parse(data);
      
      // Update state with the validated data
      setImages(validData.data.data);
      setIsLoading(false);
    } 
    catch (err: unknown) {
      // Skip setting error if request was aborted (need type assertion for unknown)
      if (err instanceof Error && err.name === 'AbortError') return;
      
      logger.error('Error loading images:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, []);
  
  // Effect to fetch images when dialog opens
  useEffect(() => {
    if (isOpen && !didFetchRef.current) {
      fetchImages('', '');
      didFetchRef.current = true;
    }
    
    if (!isOpen) {
      didFetchRef.current = false;
    }
    
    return () => {
      // Clean up any ongoing request when component unmounts or dialog closes
      if (lastRequestRef.current) {
        lastRequestRef.current.abort();
      }
    };
  }, [isOpen, fetchImages]);
  
  // Effect for search and tag filters
  useEffect(() => {
    if (!isOpen || !didFetchRef.current) return;
    
    // Fetch with current filters
    fetchImages(currentSearchQuery, currentTagFilter);
  }, [currentSearchQuery, currentTagFilter, isOpen, fetchImages]);
  
  // This effect syncs the UI display value with the actual search query
  // We're using a ref to track if this change is from a user typing or programmatic update
  // to prevent potential loops
  const isUserTypingRef = useRef(false);
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setInputValue(currentSearchQuery);
    }
    isUserTypingRef.current = false;
  }, [currentSearchQuery]);
  
  // Reset selection and search state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImages(new Set());
      setInputValue('');
      setCurrentSearchQuery('');
      
      // Clear any pending timeouts when closing
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
    }
    
    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [isOpen, debounceTimeout]);

  // The inputValue state is already declared above
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // Set flag to indicate this change is from user typing
    isUserTypingRef.current = true;
    
    // Update the input value immediately for a responsive UI
    setInputValue(query);
    
    // Clear any existing timeout to implement debouncing
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set a timeout to update the search query after the user stops typing
    const timeoutId = setTimeout(() => {
      setCurrentSearchQuery(query);
      // When this state changes, the useEffect will trigger fetchImages
    }, DEBOUNCE_DELAY);
    
    // Store the timeout ID so we can clear it if the user types again
    setDebounceTimeout(timeoutId);
  };

  const toggleTagFilter = (tag: string) => {
    const newFilter = currentTagFilter === tag ? '' : tag;
    
    // Reset search query and input value when changing tag filter
    setCurrentSearchQuery('');
    setInputValue('');
    
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set the tag filter - effect will trigger fetchImages directly
    setCurrentTagFilter(newFilter);
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
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('SelectImagesDialog - Selected IDs to add:', selectedImageIds);
      }
      // Call the callback with selected image IDs
      onImagesSelected(selectedImageIds);
    } else {
      logger.warn('No images selected in SelectImagesDialog');
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
              value={inputValue}
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
              <LoadingSpinner size="large" text="Loading images..." />
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
