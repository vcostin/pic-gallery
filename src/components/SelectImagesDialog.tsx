'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';

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

interface SelectImagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
  onImagesSelected: () => void;
  existingImageIds?: string[]; // To filter out images already in the gallery
}

export function SelectImagesDialog({ 
  isOpen, 
  onClose, 
  galleryId,
  onImagesSelected,
  existingImageIds = [] 
}: SelectImagesDialogProps) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [addingImages, setAddingImages] = useState(false);
  
  // Fetch user's images when component mounts
  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        const response = await fetch('/api/images');
        if (!response.ok) throw new Error('Failed to fetch images');
        
        const data = await response.json();
        
        // Filter out images that are already in the gallery
        const filteredImages = data.filter(
          (img: ImageType) => !existingImageIds.includes(img.id)
        );
        
        setImages(filteredImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Failed to load your images');
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchImages();
      setSelectedImages(new Set()); // Reset selection when dialog opens
    }
  }, [isOpen, existingImageIds]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach(image => {
      image.tags.forEach(tag => tagSet.add(tag.name));
    });
    return Array.from(tagSet);
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!selectedTag) return images;
    return images.filter(image => 
      image.tags.some(tag => tag.name === selectedTag)
    );
  }, [images, selectedTag]);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  };

  const handleAddImages = async () => {
    if (selectedImages.size === 0) return;
    
    try {
      setAddingImages(true);
      setError(null);
      const selectedImageIds = Array.from(selectedImages);
      
      console.log(`Adding ${selectedImageIds.length} images to gallery ${galleryId}`);
      
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: selectedImageIds }),
        credentials: 'include' // Ensure cookies are sent for authentication
      });
      
      if (!response.ok) {
        // Try to extract error message from the response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add images (${response.status})`);
      }
      
      // Successfully added images
      onImagesSelected();
    } catch (error) {
      console.error('Error adding images to gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to add images to gallery');
      setAddingImages(false);
      // Don't close the dialog on error so user can see the error message
    } finally {
      if (!error) {
        setAddingImages(false);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Images</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3">Loading images...</span>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-sm ${
                  !selectedTag 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTag === tag 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {filteredImages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No images available to add. All your images might already be in this gallery.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredImages.map(image => (
                  <div 
                    key={image.id} 
                    className={`relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer
                      ${selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={image.url}
                        alt={image.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                      {selectedImages.has(image.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium text-sm truncate">{image.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {image.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag.id}
                            className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {image.tags.length > 2 && (
                          <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            +{image.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddImages}
                disabled={selectedImages.size === 0 || addingImages}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center"
              >
                {addingImages ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Adding...
                  </>
                ) : (
                  `Add Selected (${selectedImages.size})`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
