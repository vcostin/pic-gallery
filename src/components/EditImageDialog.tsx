'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DeleteImageConfirmDialog } from './DeleteImageConfirmDialog';
import { ErrorMessage, SuccessMessage } from './StatusMessages';
import { deepEqual } from '@/lib/deepEqual';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageSchema } from '@/lib/schemas';
import logger from '@/lib/logger';

interface Tag {
  id: string;
  name: string;
}

interface EditImageDialogProps {
  image: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    tags: { id: string; name: string }[];
  };
  isOpen: boolean;
  onClose: (deletedImageId?: string) => void;
}

export function EditImageDialog({ image, isOpen, onClose }: EditImageDialogProps) {
  const [title, setTitle] = useState(image.title || ''); // Ensure title is always a string
  const [description, setDescription] = useState(image.description || '');
  const [tags, setTags] = useState(image.tags?.map(t => t.name).join(', ') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Store original values for comparison using useMemo to prevent unnecessary re-renders
  const originalData = useMemo(() => ({
    title: image.title,
    description: image.description || '',
    tags: image.tags?.map((t: Tag) => t.name).join(', ') || ''
  }), [image]);
  
  // Track if form has changes
  useEffect(() => {
    const currentData = {
      title,
      description,
      tags
    };
    
    setHasChanges(!deepEqual(currentData, originalData));
  }, [title, description, tags, originalData]);
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Do nothing if already submitting or no changes
    if (isSubmitting || !hasChanges) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Set loading state
    setIsSubmitting(true);
    setError(null);
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: image.id, // Include the image ID to satisfy schema validation
          title,
          description,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
        signal: abortController.signal
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update image');
      }
      
      if (data.success && data.data) {
        // Type check the response data
        const imageData = ImageSchema.parse(data.data);
        
        // Update the local state with the returned data
        setTitle(imageData.title);
        setDescription(imageData.description || '');
        setTags(imageData.tags?.map(t => t.name).join(', ') || '');
        
        // This will force Next.js to refresh the page data
        router.refresh();
        
        // Show success message
        setSuccessMessage('Image updated successfully!');
        
        // Clear success message after 2 seconds and close
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        logger.error('Error updating image:', error);
      }
    } finally {
      // Only update state if this is still the current request
      if (abortControllerRef.current === abortController) {
        setIsSubmitting(false);
        abortControllerRef.current = null;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h2 className="text-xl font-semibold">Edit Image</h2>
          </CardHeader>
          
          <CardContent>
            {/* Show success message */}
            {successMessage && (
              <SuccessMessage 
                message={successMessage} 
                className="mb-4"
              />
            )}
            
            {/* Show error message */}
            {error && (
              <ErrorMessage 
                error={error} 
                retry={() => setError(null)}
                className="mb-4"
              />
            )}
            
            {/* Image thumbnail */}
            <div className="mb-4 flex justify-center">
              <div className="relative w-40 h-40 rounded-md overflow-hidden">
                <Image
                  src={image.url}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter image title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter image description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => onClose()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !hasChanges}
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <DeleteImageConfirmDialog 
        imageId={image.id}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDeleted={() => {
          // Pass the deleted image ID to update UI immediately
          onClose(image.id);
        }}
      />
    </>
  );
}
