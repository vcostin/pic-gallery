'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DeleteImageConfirmDialog } from './DeleteImageConfirmDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from './StatusMessages';
import { useFetch, useSubmit } from '@/lib/hooks';

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
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description || '');
  const [tags, setTags] = useState(image.tags?.map(t => t.name).join(', ') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const { fetchApi } = useFetch();
  
  const { 
    handleSubmit: submitUpdate, 
    isSubmitting, 
    error: updateError,
    reset: resetUpdateState
  } = useSubmit(async () => {
    await fetchApi(`/api/images/${image.id}`, {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Edit Image</h2>
          
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
          
          <form onSubmit={(e) => { e.preventDefault(); submitUpdate(); }} className="space-y-4">
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
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                Delete
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
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
