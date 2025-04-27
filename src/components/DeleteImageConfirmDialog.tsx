'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmDialog } from './ConfirmDialog';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Define checkGalleryUsage as useCallback to avoid recreation on each render
  const checkGalleryUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use a GET request to check if the image is used in galleries without actually deleting it
      const response = await fetch(`/api/images/${imageId}/usage`);
      
      if (!response.ok) {
        throw new Error('Failed to check image usage');
      }
      
      const data = await response.json();
      if (data.galleries && data.galleries.length > 0) {
        setGalleries(data.galleries);
      } else {
        setGalleries([]);
      }
    } catch (error) {
      console.error('Error checking image usage:', error);
      setError('Failed to check if this image is used in galleries');
    } finally {
      setIsLoading(false);
    }
  }, [imageId]);

  // Fetch gallery usage information when the dialog opens
  useEffect(() => {
    if (isOpen) {
      checkGalleryUsage();
    }
  }, [isOpen, checkGalleryUsage]);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Always use force=true since we've already shown the gallery usage info
      const forceParam = galleries.length > 0 ? '?force=true' : '';
      const response = await fetch(`/api/images/${imageId}${forceParam}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      router.refresh();
      onDeleted();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Image"
      message={
        <div>
          {isLoading ? (
            <p>Checking if this image is used in galleries...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
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
        </div>
      }
      confirmButtonText={isDeleting ? "Deleting..." : galleries.length > 0 ? "Delete Anyway" : "Delete"}
      confirmButtonColor="red"
      cancelButtonText="Cancel"
    />
  );
}
