'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

interface Tag {
  id: string;
  name: string;
}

interface ImageType {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: Tag[];
}

interface CreateGalleryProps {
  availableImages: ImageType[];
}

export function CreateGallery({ availableImages }: CreateGalleryProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{ id: string; description?: string }[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          isPublic,
          images: selectedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create gallery');
      }

      const createdGallery = await response.json();
      
      // Show success message with the title from the response
      // (safer in case of server-side title sanitization)
      setSuccessMessage(`Gallery "${createdGallery.title}" created successfully!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setSelectedImages([]);
      
      // Refresh the router to update the UI with the new gallery data
      router.refresh();
      
      // Automatically redirect to the gallery page after a short delay
      setTimeout(() => {
        router.push(`/galleries/${createdGallery.id}`);
      }, 1500);
    } catch (error) {
      logger.error('Error creating gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to create gallery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const exists = prev.some(img => img.id === imageId);
      if (exists) {
        return prev.filter(img => img.id !== imageId);
      }
      return [...prev, { id: imageId }];
    });
  };

  const updateImageDescription = (imageId: string, description: string) => {
    setSelectedImages(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, description } : img
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Create New Gallery</h2>
      </CardHeader>
      
      <CardContent>
        {successMessage && (
          <SuccessMessage 
            message={successMessage} 
            className="mb-4" 
            onDismiss={() => setSuccessMessage(null)}
          />
        )}
        
        {error && (
          <ErrorMessage 
            error={error} 
            className="mb-4" 
            retry={() => setError(null)}
          />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter gallery title"
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium">Make gallery public</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Images</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableImages.map(image => (
                <div key={image.id} className="relative">
                  <div
                    onClick={() => toggleImageSelection(image.id)}
                    className={`cursor-pointer relative aspect-square ${
                      selectedImages.some(img => img.id === image.id)
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                    {selectedImages.some(img => img.id === image.id) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg" />
                    )}
                  </div>
                  {selectedImages.some(img => img.id === image.id) && (
                    <textarea
                      placeholder="Add description (optional)"
                      className="mt-2 w-full text-sm px-2 py-1 border rounded"
                      onChange={(e) => updateImageDescription(image.id, e.target.value)}
                      value={selectedImages.find(img => img.id === image.id)?.description || ''}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!title || selectedImages.length === 0 || isSubmitting}
          >
            Create Gallery
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
