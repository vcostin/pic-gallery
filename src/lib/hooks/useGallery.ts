/**
 * Custom hooks for interacting with galleries
 */
import { useState, useCallback, useEffect } from 'react';
import { GalleryService } from '../services/galleryService';
import { UpdateGallerySchema, CreateGallerySchema, ImageInGallerySchema } from '../schemas';
import { z } from 'zod';
import { arrayMove } from '@dnd-kit/sortable';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import logger from '@/lib/logger';

type FullGallery = Awaited<ReturnType<typeof GalleryService.getGallery>>;
type GalleryCreationData = z.infer<typeof CreateGallerySchema>;
type GalleryUpdateData = z.infer<typeof UpdateGallerySchema>;

/**
 * Hook for fetching a gallery by ID
 */
export function useGallery(id: string | undefined) {
  const [gallery, setGallery] = useState<FullGallery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGallery = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.getGallery(id);
      setGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateGallery = useCallback(async (updateData: GalleryUpdateData) => {
    if (!id) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.updateGallery(id, updateData);
      setGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return {
    gallery,
    loading,
    error,
    fetchGallery,
    updateGallery
  };
}

/**
 * Hook for creating a new gallery
 */
export function useCreateGallery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [newGallery, setNewGallery] = useState<FullGallery | null>(null);

  const createGallery = useCallback(async (galleryData: GalleryCreationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.createGallery(galleryData);
      setNewGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    newGallery,
    createGallery
  };
}

/**
 * Enhanced hook for managing gallery images with UI functionality
 * Combines API operations with UI management (drag/drop, description updates, etc.)
 */

export function useGalleryImages(
  galleryId: string | undefined, 
  initialImages: z.infer<typeof ImageInGallerySchema>[] = []
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gallery, setGallery] = useState<FullGallery | null>(null);
  const [images, setImages] = useState<z.infer<typeof ImageInGallerySchema>[]>(initialImages);
  
  // UI state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Get the active image for drag overlay
  const activeImage = activeId ? images.find(img => img.id === activeId) : null;
  
  // Add images to gallery through API
  const addImages = useCallback(async (imageIds: string[]) => {
    if (!galleryId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.addImages(galleryId, imageIds);
      setGallery(data);
      setImages(data.images);
      
      // Show success toast
      setToastMessage(`Added ${imageIds.length} image${imageIds.length > 1 ? 's' : ''} to gallery`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      
      // Show error toast
      setToastMessage(`Error adding images: ${errorObj.message}`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  // Remove image from gallery through API
  const removeImage = useCallback(async (imageInGalleryId: string) => {
    if (!galleryId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await GalleryService.removeImage(galleryId, imageInGalleryId);
      
      // Update local state to remove the image
      setGallery(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.filter(img => img.id !== imageInGalleryId)
        };
      });
      
      setImages(prev => prev.filter(img => img.id !== imageInGalleryId));
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      return false;
    } finally {
      setLoading(false);
    }
  }, [galleryId]);
  
  // Handle image description change
  const handleImageDescriptionChange = useCallback((id: string, newDescription: string) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, description: newDescription } : img
    ));
  }, []);
  
  // Handle opening the remove image dialog
  const handleRemoveImage = useCallback((id: string) => {
    setImageToRemove(id);
    setShowRemoveImageDialog(true);
  }, []);
  
  // Confirm removing an image
  const confirmRemoveImage = useCallback(() => {
    if (imageToRemove) {
      // Use the API function to remove the image
      removeImage(imageToRemove);
    }
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
    return true;
  }, [imageToRemove, removeImage]);
  
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
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        // Safety check: if either index is not found, don't proceed
        if (oldIndex === -1 || newIndex === -1) {
          logger.error("Unable to find one or both images during drag operation", { 
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
        
        // Update order values to match new positions
        return reorderedItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
      
      // TODO: Add API call to update image order in the database
      
      return true; // Return true to indicate changes were made
    }
    
    setActiveId(null);
    return false; // Return false to indicate no changes were made
  }, []);
  
  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);
  
  // Update gallery images (from API or parent component)
  const updateImages = useCallback((newImages: z.infer<typeof ImageInGallerySchema>[]) => {
    try {
      // Validate that all images have appropriate order values
      const validatedImages = newImages.map((img, index) => {
        // If order is missing or invalid, set it based on position
        if (typeof img.order !== 'number' || !Number.isInteger(img.order) || img.order < 0) {
          logger.warn(`Image with ID ${img.id} has invalid order value: ${img.order}, setting to ${index}`);
          return { ...img, order: index };
        }
        return img;
      });
      
      setImages(validatedImages);
    } catch (err) {
      logger.error("Error updating images:", err);
      // Fall back to the passed images to avoid breaking the UI
      setImages(newImages);
    }
  }, []);
  
  // Fetch gallery data when galleryId changes
  useEffect(() => {
    if (galleryId) {
      setLoading(true);
      GalleryService.getGallery(galleryId)
        .then(data => {
          setGallery(data);
          setImages(data.images);
        })
        .catch(err => {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          setError(errorObj);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [galleryId]);

  return {
    gallery,
    images,
    loading,
    error,
    activeImage,
    showRemoveImageDialog,
    imageToRemove,
    showSuccessToast,
    toastMessage,
    // API methods
    addImages,
    removeImage,
    // UI methods
    setImages: updateImages,
    handleImageDescriptionChange,
    handleRemoveImage,
    confirmRemoveImage,
    cancelRemoveImage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
}
