'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmDialog } from './ConfirmDialog';
import { LoadingSpinner, ErrorMessage } from './StatusMessages';
import { useFetch, useSubmit } from '@/lib/hooks';
import logger from '@/lib/logger';

interface Gallery {
  id: string;
  title: string;
  isCover: boolean;
}

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
  
  const { fetchApi, isLoading: isCheckingUsage, error: checkError, setError } = useFetch();
  
  const { 
    handleSubmit: handleDelete, 
    isSubmitting: isDeleting, 
    error: deleteError 
  } = useSubmit(async () => {
    // Always use force=true since we've already shown the gallery usage info
    const forceParam = galleries.length > 0 ? '?force=true' : '';
    
    await fetchApi(`/api/images/${imageId}${forceParam}`, {
      method: 'DELETE',
    });

    router.refresh();
    onDeleted();
  });

  // Define checkGalleryUsage as useCallback to avoid recreation on each render
  const checkGalleryUsage = useCallback(async () => {
    setError(null);
    
    try {
      // Use a GET request to check if the image is used in galleries without actually deleting it
      const data = await fetchApi<{ galleries: Gallery[] }>(`/api/images/${imageId}/usage`);
      
      if (data.galleries && data.galleries.length > 0) {
        setGalleries(data.galleries);
      } else {
        setGalleries([]);
      }
    } catch (error) {
      // Error handled by useFetch hook
      logger.error('Error checking image usage:', error);
    }
  }, [imageId, fetchApi, setError]);

  // Fetch gallery usage information when the dialog opens
  useEffect(() => {
    if (isOpen) {
      checkGalleryUsage();
    }
  }, [isOpen, checkGalleryUsage]);

  if (!isOpen) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Image"
      message={
        <div>
          {isCheckingUsage ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="small" text="Checking if this image is used in galleries..." />
            </div>
          ) : checkError ? (
            <ErrorMessage 
              error={checkError} 
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
                    <Link 
                      href={`/galleries/${gallery.id}`}
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                      onClick={(e) => {
                        // Prevent the confirm dialog from closing when clicking gallery links
                        e.stopPropagation();
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {gallery.title}
                    </Link>
                    {gallery.isCover && <span className="text-amber-500 ml-2">(Used as cover image)</span>}
                  </li>
                ))}
              </ul>
              <p className="text-red-500 font-semibold">
                Deleting this image will remove it from all these galleries.
                {galleries.some(g => g.isCover) && 
                  " Galleries using this as a cover image will need a new cover image."}
              </p>
            </>
          ) : (
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
          )}
          
          {deleteError && (
            <div className="mt-4">
              <ErrorMessage error={deleteError} />
            </div>
          )}
          
          {isDeleting && (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner size="small" text="Deleting image..." />
            </div>
          )}
        </div>
      }
      confirmButtonText={isDeleting ? "Deleting..." : galleries.length > 0 ? "Delete Anyway" : "Delete"}
      confirmButtonColor="red"
      cancelButtonText="Cancel"
    />
  );
}
