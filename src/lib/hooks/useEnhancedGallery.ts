/**
 * Enhanced gallery hooks for UI and API operations
 */
import { useState, useCallback, useEffect } from 'react';
import { GalleryService } from '@/lib/services/galleryService';
import { FullGallery, FullImageInGallery } from '@/lib/schemas';
import { arrayMove } from '@dnd-kit/sortable';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import logger from '@/lib/logger';

/**
 * Enhanced hook for managing gallery images with UI functionality
 * Combines API operations with UI management (drag/drop, description updates, etc.)
 */
export function useEnhancedGalleryImages(
  galleryId: string | undefined, 
  initialImages: FullImageInGallery[] = []
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gallery, setGallery] = useState<FullGallery | null>(null);
  const [images, setImages] = useState<FullImageInGallery[]>(initialImages);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState({ isOpen: false });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Clear toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
      }
    };
  }, [toastTimeoutId]);

  // Function to hide toast
  const hideToast = useCallback(() => {
    setShowSuccessToast(false);
    setToastMessage('');
    
    // Clear timeout if it exists
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      setToastTimeoutId(null);
    }
  }, [toastTimeoutId]);

  // Function to show toast with proper cleanup
  const showToast = useCallback((message: string, duration = 3000) => {
    // Clear any existing timeout
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      setToastTimeoutId(null);
    }
    
    setToastMessage(message);
    setShowSuccessToast(true);
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      hideToast();
    }, duration);
    
    setToastTimeoutId(timeoutId);
  }, [toastTimeoutId, hideToast]);
  
  // Get the active image for drag overlay
  const activeImage = activeId ? images.find(img => img.id === activeId) : null;
  
  // Add images to gallery (local state only, not API)
  const addImages = useCallback(async (imageIds: string[]) => {
    // Check if we have valid image IDs to add
    if (!imageIds || imageIds.length === 0) {
      console.warn('No image IDs provided to addImages');
      return null;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Fetch images to store in local state
      const response = await fetch(`/api/images?ids=${imageIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Make sure we have valid image data
      if (data && data.success && data.data && data.data.data && Array.isArray(data.data.data)) {
        // In dev mode, log the structure we received for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.log('useEnhancedGalleryImages - Image data structure received:', {
            hasSuccessFlag: !!data.success,
            hasNestedDataObject: !!data.data,
            nestedDataIsArray: Array.isArray(data.data),
            nestedDataHasDataProperty: data.data && 'data' in data.data,
            nestedDataDataIsArray: data.data && data.data.data && Array.isArray(data.data.data),
            itemCount: data.data && data.data.data ? data.data.data.length : 0
          });
        }
        
        // Convert to FullImageInGallery format - handle potential partial data
        const newImages = data.data.data.map((image: { id: string; title?: string; url?: string; [key: string]: unknown }, index: number) => ({
          id: `temp-${Date.now()}-${index}`, // Temporary ID for the gallery image
          imageId: image.id,
          galleryId: galleryId || 'temp', // Use actual gallery ID if available, otherwise temp
          description: null,
          order: images.length + index,
          createdAt: new Date(),
          image: image // Use the full image object
        }));
        
        // Add to local state
        setImages(prev => [...prev, ...newImages]);
        
        // Show success toast
        showToast(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} to gallery`);
        
        // Mark that we have unsaved changes (this will be used by the edit page)
        setHasUnsavedChanges(true);
      } else {
        // Log more details about the invalid data structure
        logger.error('Invalid image data structure received:', {
          dataType: typeof data,
          hasSuccessFlag: data && typeof data.success === 'boolean',
          dataStructure: data ? Object.keys(data) : 'null or undefined',
          responseFormat: data && data.data ? Object.keys(data.data) : 'missing data property'
        });
        
        throw new Error('Invalid image data received');
      }
      
      return null;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      
      // Show error toast
      showToast(`Error adding images: ${errorObj.message}`);
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [galleryId, images.length, showToast]);

  // Remove image from gallery (local state only, not API)
  const removeImage = useCallback(async (imageInGalleryId: string) => {
    // Update local state by filtering out the image to remove
    setImages(prevImages => prevImages.filter(img => img.id !== imageInGalleryId));
    
    // Show success toast
    showToast('Image removed from gallery');
    
    // Mark that we have unsaved changes (this will be used by the edit page)
    setHasUnsavedChanges(true);
    
    return true;
  }, [showToast]);
  
  // Handle image description change
  const handleImageDescriptionChange = useCallback((id: string, newDescription: string) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, description: newDescription } : img
    ));
    
    // Mark that we have unsaved changes
    setHasUnsavedChanges(true);
  }, []);
  
  // Handle opening the remove image dialog
  const handleRemoveImage = useCallback((id: string) => {
    setImageToRemove(id);
    setShowRemoveImageDialog({ isOpen: true });
  }, []);
  
  // Confirm removing an image
  const confirmRemoveImage = useCallback(() => {
    if (imageToRemove) {
      // Update local state immediately for better UX
      setImages(prevImages => prevImages.filter(img => img.id !== imageToRemove));
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
      
      // Then use the API function to remove the image
      removeImage(imageToRemove);
    }
    setShowRemoveImageDialog({ isOpen: false });
    setImageToRemove(null);
    return true;
  }, [imageToRemove, removeImage]);
  
  // Cancel removing an image
  const cancelRemoveImage = useCallback(() => {
    setShowRemoveImageDialog({ isOpen: false });
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
  
  // Handle drag end with improved animations (local state only, not API)
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
        
        // Update order values to match new positions - ensure they're integers
        return reorderedItems.map((item, index) => ({
          ...item,
          order: index // Integer order starting from 0
        }));
      });
      
      // Mark that we have unsaved changes (this will be used by the edit page)
      setHasUnsavedChanges(true);
      
      // Show a success toast
      setToastMessage('Image order updated (changes not saved yet)');
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setToastMessage('');
      }, 3000);
      
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
  const updateImages = useCallback((newImages: FullImageInGallery[]) => {
    try {
      // Filter out any images where image is undefined
      const validImages = newImages.filter((img): img is FullImageInGallery => 
        img.image !== undefined
      );
      
      // Validate that all images have appropriate order values
      const validatedImages = validImages.map((img, index) => {
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
      setImages(newImages.filter(img => img.image !== undefined) as FullImageInGallery[]);
    }
  }, []);
  
  // Fetch gallery data when galleryId changes
  useEffect(() => {
    if (galleryId) {
      setLoading(true);
      GalleryService.getGallery(galleryId)
        .then(data => {
          setGallery(data);
          setImages(data.images.filter(img => img.image !== undefined));
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
    activeId,
    showRemoveImageDialog,
    imageToRemove,
    showSuccessToast,
    toastMessage,
    setShowSuccessToast,
    setToastMessage,
    hasUnsavedChanges,
    setHasUnsavedChanges,
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
    handleDragCancel,
    // Toast functions
    showToast,
    hideToast
  };
}
