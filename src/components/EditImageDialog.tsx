'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DeleteImageConfirmDialog } from './DeleteImageConfirmDialog';
import { ErrorMessage, SuccessMessage } from './StatusMessages';
import { useFetch, useSubmit } from '@/lib/hooks';
import { deepEqual } from '@/lib/deepEqual';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Tag {
  id: string;
  name: string;
}

interface ImageData {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: Tag[];
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
  onClose: () => void;
}

export function EditImageDialog({ image, isOpen, onClose }: EditImageDialogProps) {
  const [title, setTitle] = useState(image.title || ''); // Ensure title is always a string
  const [description, setDescription] = useState(image.description || '');
  const [tags, setTags] = useState(image.tags?.map(t => t.name).join(', ') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const { fetchApi } = useFetch();
  
  const { 
    handleSubmit: submitUpdate, 
    isSubmitting, 
    error: updateError,
    reset: resetUpdateState
  } = useSubmit(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Send the update request and capture the returned updated image
    const updatedImage = await fetchApi<ImageData>(`/api/images/${image.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }),
    });

    // Update the local state with the returned data
    setTitle(updatedImage.title);
    setDescription(updatedImage.description || '');
    setTags(updatedImage.tags?.map((t: Tag) => t.name).join(', ') || '');
    
    // This will force Next.js to refresh the page data
    router.refresh();
    
    // Show success message
    setSuccessMessage('Image updated successfully!');
    
    // Clear success message after 2 seconds and close
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2000);
    
    return 'Image updated successfully!';
  });

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
            {updateError && (
              <ErrorMessage 
                error={updateError} 
                retry={() => resetUpdateState()}
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
            
            <form onSubmit={submitUpdate} className="space-y-4">
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
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={submitUpdate}
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
        onDeleted={onClose}
      />
    </>
  );
}
