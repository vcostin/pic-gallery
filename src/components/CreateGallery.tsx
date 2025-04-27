'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logger from '@/lib/logger';

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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error('Failed to create gallery');
      }

      setTitle('');
      setDescription('');
      setIsPublic(false);
      setSelectedImages([]);
      router.refresh();
    } catch (error) {
      logger.error('Error creating gallery:', error);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Gallery</h2>
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
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          disabled={!title || selectedImages.length === 0}
        >
          Create Gallery
        </button>
      </form>
    </div>
  );
}
