'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner, ErrorMessage } from '@/components/StatusMessages';
import { useApi } from '@/lib/hooks/useApi';
import { z } from 'zod';
import { ImageUsageResponseSchema } from '@/lib/schemas/imageUsage';
import logger from '@/lib/logger';

// Use types from the schema instead of redefinining
import type { GalleryReference as Gallery } from '@/lib/schemas/imageUsage';

interface DeleteImageConfirmDialogProps {
  imageId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteImageConfirmDialog({ 
  imageId, 
  isOpen, 
  onClose,
  onDeleted
}: DeleteImageConfirmDialogProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const router = useRouter();
  
  // Create AbortController refs for cancelling API requests
  const imageUsageControllerRef = useRef<AbortController | null>(null);
  const deleteImageControllerRef = useRef<AbortController | null>(null);
  
  // Use schema-validated API hook for checking image usage
  const usageApi = useApi(ImageUsageResponseSchema);
  
  // Use schema-validated API hook for delete operation with a simple success schema
  const deleteApi = useApi(z.object({ success: z.boolean() }));
  
  // Create state for delete operation
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);
  
  // Create a function to handle the delete submission
  const deleteHandler = async () => {
    // Cancel any existing delete request
    if (deleteImageControllerRef.current) {
      deleteImageControllerRef.current.abort();
    }
    
    // Set loading state
    setIsDeleting(true);
    setDeleteError(null);
    
    // Create a new AbortController
    const abortController = new AbortController();
    deleteImageControllerRef.current = abortController;
    
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.refresh();
        // Make sure to call onDeleted callback to update parent state immediately
        onDeleted();
      } else {
        throw new Error(data.error || 'Failed to delete image');
      }
    } catch (error) {
      // Only set error if request wasn't aborted
      if (!abortController.signal.aborted) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        logger.error('Error deleting image:', errorObj);
      }
    } finally {
      if (deleteImageControllerRef.current === abortController) {
        deleteImageControllerRef.current = null;
      }
      setIsDeleting(false);
    }
  };

  // This function is now directly used as onConfirm in ConfirmDialog  // Create a stable function that doesn't change on each render
  const checkGalleryUsage = useCallback(() => {
    // Reset galleries first to avoid showing stale data
    setGalleries([]);
    
    // Cancel any existing request
    if (imageUsageControllerRef.current) {
      imageUsageControllerRef.current.abort();
    }
    
    // Create a new AbortController
    const abortController = new AbortController();
    imageUsageControllerRef.current = abortController;
    
    // Define the fetch function
    const fetchUsageData = async () => {
      try {
        const response = await fetch(`/api/images/${imageId}/usage`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        });

        const data = await response.json();
        
        // Only process if the request wasn't aborted
        if (!abortController.signal.aborted && imageUsageControllerRef.current === abortController) {
          if (data.success && data.data && data.data.galleries) {
            setGalleries(data.data.galleries);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error('Error checking image usage:', error);
        }
      } finally {
        if (imageUsageControllerRef.current === abortController) {
          imageUsageControllerRef.current = null;
        }
      }
    };
    
    // Execute the fetch function
    fetchUsageData();
  }, [imageId]);

  // Fetch gallery usage information when the dialog opens
  useEffect(() => {
    if (isOpen) {
      checkGalleryUsage();
    }
    
    // Cleanup function to abort any in-flight requests when component unmounts or dialog closes
    return () => {
      if (imageUsageControllerRef.current) {
        imageUsageControllerRef.current.abort();
        imageUsageControllerRef.current = null;
      }
      
      if (deleteImageControllerRef.current) {
        deleteImageControllerRef.current.abort();
        deleteImageControllerRef.current = null;
      }
    };
  }, [isOpen, checkGalleryUsage]);

  // Function to open gallery in a new tab without causing dialog to close
  const openGallery = (galleryId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/galleries/${galleryId}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={deleteHandler}
      title="Delete Image"
      message={
        <div>
          {usageApi.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="small" text="Checking if this image is used in galleries..." />
            </div>
          ) : usageApi.error ? (
            <ErrorMessage 
              error={usageApi.error} 
              retry={checkGalleryUsage}
              className="mb-4"
            />
          ) : galleries.length > 0 ? (
            <>
              <p className="mb-4 text-amber-500 font-semibold">Warning: This image is used in galleries</p>
              <p className="mb-2">This image is used in the following galleries:</p>
              <ul className="list-disc pl-5 mb-4">
                {galleries.map(gallery => (
                  <li key={gallery.id} className="mb-1">
                    <button 
                      onClick={(e) => openGallery(gallery.id, e)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium focus:outline-none"
                      type="button"
                    >
                      {gallery.title}
                    </button>
                    {gallery.isCover && <span className="text-amber-500 ml-2">(Used as cover image)</span>}
                  </li>
                ))}
              </ul>
              <p className="text-amber-500 font-medium">
                Deleting this image will remove it from all these galleries.
                {galleries.some(g => g.isCover) && 
                  " Galleries using this as a cover image will need a new cover image."}
              </p>
            </>
          ) : (
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
          )}
          
          {(deleteError || deleteApi.error) && (
            <div className="mt-4">
              <ErrorMessage error={deleteError || deleteApi.error} />
            </div>
          )}
          
          {(isDeleting || deleteApi.isLoading) && (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner size="small" text="Deleting image..." />
            </div>
          )}
        </div>
      }
      confirmButtonText={(isDeleting || deleteApi.isLoading) ? "Deleting..." : "Delete"}
      confirmButtonColor="red"
      cancelButtonText="Cancel"
    />
  );
}
