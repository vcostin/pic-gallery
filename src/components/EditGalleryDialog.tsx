'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { useFetch, useSubmit } from '@/lib/hooks';
import logger from '@/lib/logger';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Tag {
  id: string;
  name: string;
}

interface GalleryImage {
  id: string;
  description: string | null;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
}

interface EditGalleryDialogProps {
  gallery: {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    coverImageId?: string | null;
    images: GalleryImage[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export function EditGalleryDialog({ gallery, isOpen, onClose }: EditGalleryDialogProps) {
  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description || '');
  const [isPublic, setIsPublic] = useState(gallery.isPublic);
  const [coverImageId, setCoverImageId] = useState(gallery.coverImageId || '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const { fetchApi } = useFetch();
  
  const { 
    handleSubmit: submitUpdate, 
    isSubmitting, 
    error: updateError,
    reset: resetUpdateState
  } = useSubmit(async () => {
    await fetchApi(`/api/galleries/${gallery.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        isPublic,
        coverImageId: coverImageId || null,
      }),
    });
    
    router.refresh();
    
    // Show success message
    setSuccessMessage('Gallery updated successfully');
    
    // Clear success message after 2 seconds and close
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2000);
    
    return "Gallery updated successfully";
  });

  // Reset form state when the gallery or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTitle(gallery.title);
      setDescription(gallery.description || '');
      setIsPublic(gallery.isPublic);
      setCoverImageId(gallery.coverImageId || '');
      resetUpdateState();
    }
  }, [gallery, isOpen, resetUpdateState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Edit Gallery</h2>
        </CardHeader>
        
        <CardContent>
          {successMessage && (
            <SuccessMessage 
              message={successMessage} 
              className="mb-4"
            />
          )}
          
          {updateError && (
            <ErrorMessage 
              error={updateError} 
              retry={() => resetUpdateState()}
              className="mb-4"
            />
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); submitUpdate({}); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter gallery title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter gallery description"
                rows={3}
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <span>Make gallery public</span>
              </label>
            </div>
            
            {gallery.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {gallery.images.map((galleryImage) => (
                    <div 
                      key={galleryImage.id} 
                      className="relative"
                      onClick={() => {
                        logger.log("Selected image:", galleryImage.image.id);
                        setCoverImageId(galleryImage.image.id);
                      }}
                    >
                      <div className={`cursor-pointer relative aspect-square ${
                        coverImageId === galleryImage.image.id ? 'ring-2 ring-blue-500' : ''
                      }`}>
                        <Image
                          src={galleryImage.image.url}
                          alt={galleryImage.image.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                        {coverImageId === galleryImage.image.id && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Cover</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => submitUpdate({})}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
