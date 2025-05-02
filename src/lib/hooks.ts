'use client';

import { useState, useCallback } from 'react';
import logger from '@/lib/logger';
import { arrayMove } from '@dnd-kit/sortable';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  run: (promise: Promise<T>) => Promise<T | null>;
  setData: (data: T) => void;
  reset: () => void;
}

/**
 * A hook for handling asynchronous operations with consistent loading and error states
 * @param initialData Initial data value
 * @returns Object containing data, loading state, error state, and functions to control them
 */
export function useAsync<T>(initialData: T | null = null): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      logger.error('Error in useAsync:', err);
      const errorObject = err instanceof Error ? err : new Error(String(err));
      setError(errorObject);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return { data, isLoading, error, run, setData, reset };
}

/**
 * A hook for handling form submissions with consistent loading and error states
 * @param onSubmit The submission handler function
 * @returns Object containing submit function, loading state, and error state
 */
export function useSubmit<T>(
  onSubmit: (data: T) => Promise<unknown>
): {
  handleSubmit: (data: T) => Promise<unknown>;
  isSubmitting: boolean;
  error: Error | null;
  reset: () => void;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setError(null);

      try {
        return await onSubmit(data);
      } catch (err) {
        logger.error('Error in form submission:', err);
        const errorObject = err instanceof Error ? err : new Error(String(err));
        setError(errorObject);
        throw errorObject;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit]
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
  }, []);

  return { handleSubmit, isSubmitting, error, reset };
}

/**
 * A hook to handle API requests with automatic error handling and response parsing
 * @returns Object containing fetch function and state
 */
export function useFetch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApi = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Parse the response based on content type
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMessage = isJson && data.error ? data.error : `Request failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (err) {
      logger.error('Fetch error:', err);
      const errorObject = err instanceof Error ? err : new Error(String(err));
      setError(errorObject);
      throw errorObject;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchApi, isLoading, error, setError };
}

// Interface for Tag
interface Tag {
  id: string;
  name: string;
}

// Interface for Gallery Image
export interface GalleryImage {
  id: string;
  description: string | null;
  order: number;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
  imageId?: string;
}

// Hook for managing gallery images
export function useGalleryImages(initialImages: GalleryImage[] = []) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Get the active image for drag overlay
  const activeImage = activeId ? images.find(img => img.id === activeId) : null;
  
  // Handle image description change
  const handleImageDescriptionChange = useCallback((id: string, newDescription: string) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, description: newDescription } : img
    ));
  }, []);
  
  // Handle removing an image
  const handleRemoveImage = useCallback((id: string) => {
    setImageToRemove(id);
    setShowRemoveImageDialog(true);
  }, []);
  
  // Confirm removing an image
  const confirmRemoveImage = useCallback(() => {
    if (imageToRemove) {
      setImages(prevImages => prevImages.filter(img => img.id !== imageToRemove));
    }
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
    return true; // Return true to indicate changes were made
  }, [imageToRemove]);
  
  // Cancel removing an image
  const cancelRemoveImage = useCallback(() => {
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
  }, []);
  
  // Handle drag start with improved feedback
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);
  
  // Handle drag end with improved animations
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        // Find the actual items by ID
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        // Safety check: if either index is not found, don't proceed
        if (oldIndex === -1 || newIndex === -1) {
          console.error("Unable to find one or both images during drag operation", { 
            activeId: active.id, 
            overId: over.id,
            oldIndex,
            newIndex
          });
          return items;
        }
        
        // Add haptic feedback on successful drop
        if (navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        
        // Reorder the items
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Check if the reordering has changed the actual positions compared to original data
        // Only update order numbers if needed
        const needsOrderUpdate = reorderedItems.some((item, index) => {
          // If the original order of items doesn't match their position, we need to update
          return item.order !== index;
        });
        
        if (needsOrderUpdate) {
          // Update order values to match new positions
          return reorderedItems.map((item, index) => ({
            ...item,
            order: index
          }));
        }
        
        // If the items are back in their original order, preserve original order numbers
        return reorderedItems;
      });
      
      return true; // Return true to indicate changes were made
    }
    
    setActiveId(null);
    return false; // Return false to indicate no changes were made
  }, []);
  
  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);
  
  // Add images to gallery
  const addImagesToGallery = useCallback(async (imageIds: string[], fetchImages: () => Promise<Array<{id: string; [key: string]: unknown}>>) => {
    // Only proceed if we have image IDs to add
    if (!imageIds?.length) return false;
    
    try {
      const allImages = await fetchImages();
      
      // Create a map of all available images
      const availableImagesMap = new Map();
      allImages.forEach(img => {
        availableImagesMap.set(img.id, img);
      });
      
      // Get all images that aren't already in the gallery
      const newImageIds = imageIds.filter(id => 
        !images.some(img => img.image.id === id)
      );
      
      if (!newImageIds.length) {
        setToastMessage("These images are already in the gallery");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return false;
      }
      
      // Find the highest order value
      const maxOrder = images.length > 0
        ? Math.max(...images.map(img => img.order))
        : 0;
      
      // Create new temp images for the UI with unique and consistent IDs
      const timestamp = Date.now();
      const newImages = newImageIds.map((id, index) => {
        const imageInfo = availableImagesMap.get(id);
        
        // If we don't have the image information, log a warning
        if (!imageInfo) {
          logger.warn(`Image with ID ${id} not found in available images`);
          return null;
        }
        
        // Create a temporary ID for the gallery image with a more consistent format
        // Using a string ID that's guaranteed to be unique but still stable
        const tempId = `temp-${timestamp}-${index}`;
        
        return {
          id: tempId,
          description: null,
          order: maxOrder + index + 1,
          image: {
            ...imageInfo,
            id: imageInfo.id || id // Ensure image.id is always set
          },
          // Store the real image ID for when we save
          imageId: id
        };
      }).filter(Boolean) as GalleryImage[];
      
      // Add the new images to the state
      setImages(prev => [...prev, ...newImages]);
      
      // Show success toast
      setToastMessage(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} to gallery`);
      setShowSuccessToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      
      return true; // Return true to indicate changes were made
    } catch (err) {
      logger.error("Error adding images to gallery:", err);
      setToastMessage("Error adding images to gallery");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      return false;
    }
  }, [images]);
  
  // Set images (used when initializing from API)
  const updateImages = useCallback((newImages: GalleryImage[]) => {
    setImages(newImages);
  }, []);
  
  return {
    images,
    setImages: updateImages,
    activeImage,
    showRemoveImageDialog,
    imageToRemove,
    showSuccessToast,
    toastMessage,
    handleImageDescriptionChange,
    handleRemoveImage,
    confirmRemoveImage,
    cancelRemoveImage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    addImagesToGallery
  };
}
