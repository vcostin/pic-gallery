'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, useCallback, memo } from 'react';
import { EditImageDialogWithZod } from './EditImageDialogWithZod';
import { EmptyState, SkeletonLoader } from './StatusMessages';
import { useAsync } from '@/lib/hooks';
import { ErrorBoundary } from './ErrorBoundary';
import logger from '@/lib/logger';
import { ImageTags } from './ui/ImageTags';

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

interface ImageGridProps {
  images: ImageType[];
}

// Memoized image card component to prevent unnecessary re-renders
const ImageCard = memo(({ image, onEdit }: { image: ImageType; onEdit: (image: ImageType) => void }) => {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false} // Only prioritize loading for visible images
          loading="lazy"
          className="object-cover"
          onError={() => logger.error(`Failed to load image: ${image.url}`)}
        />
        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-gray-900/30 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={() => onEdit(image)}
            className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Edit
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-2">{image.title}</h3>
        {image.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {image.description}
          </p>
        )}
        <ImageTags tags={image.tags} max={3} />
      </div>
    </div>
  );
});

ImageCard.displayName = 'ImageCard';

// Memoized tag filter button component
const TagFilterButton = memo(({ 
  tag, 
  isSelected, 
  onClick 
}: { 
  tag: string; 
  isSelected: boolean; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm ${
      isSelected
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-200 dark:bg-gray-700'
    }`}
  >
    {tag}
  </button>
));

TagFilterButton.displayName = 'TagFilterButton';

export function ImageGrid({ images }: ImageGridProps) {
  const [editingImage, setEditingImage] = useState<ImageType | null>(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Use state to store and filter images
  const { data: imagesData, setData: setImagesData } = useAsync<ImageType[]>(images);

  // Set initial data
  useEffect(() => {
    setImagesData(images);
    // Small delay to prevent flickering of skeleton loader on fast page loads
    const timer = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(timer);
  }, [images, setImagesData]);

  // Extract all unique tags from images
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    if (imagesData) {
      imagesData.forEach(image => {
        image.tags.forEach(tag => tagSet.add(tag.name));
      });
    }
    return Array.from(tagSet).sort();
  }, [imagesData]);

  // Filter images based on selected tag
  const filteredImages = useMemo(() => {
    if (!imagesData) return [];
    if (!selectedTag) return imagesData;
    return imagesData.filter(image => 
      image.tags.some(tag => tag.name === selectedTag)
    );
  }, [imagesData, selectedTag]);

  // Memoized callbacks
  const handleImageEdit = useCallback((image: ImageType) => {
    setEditingImage(image);
  }, []);

  const handleImageUpdated = useCallback((deletedImageId?: string) => {
    setEditingImage(null);
    
    // If an image was deleted, immediately update the state to remove it
    if (deletedImageId && imagesData) {
      setImagesData(imagesData.filter(img => img.id !== deletedImageId));
    }
    // Router.refresh() will still be called for server data refresh
  }, [imagesData, setImagesData]);

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(tag);
  }, []);

  const clearTagFilter = useCallback(() => {
    setSelectedTag('');
  }, []);

  if (isInitializing) {
    return <SkeletonLoader count={8} type="card" />;
  }

  if (!imagesData || imagesData.length === 0) {
    return (
      <EmptyState
        title="No images found"
        description="Upload some images to get started."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <TagFilterButton 
            tag="All" 
            isSelected={!selectedTag} 
            onClick={clearTagFilter} 
          />
          
          {allTags.map(tag => (
            <TagFilterButton
              key={tag}
              tag={tag}
              isSelected={selectedTag === tag}
              onClick={() => handleTagSelect(tag)}
            />
          ))}
        </div>

        {filteredImages.length === 0 ? (
          <EmptyState
            title="No images match this tag"
            description="Try selecting a different tag filter."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map(image => (
              <ImageCard 
                key={image.id} 
                image={image} 
                onEdit={handleImageEdit} 
              />
            ))}
          </div>
        )}

        {editingImage && (
          <EditImageDialogWithZod
            image={editingImage}
            isOpen={true}
            onClose={handleImageUpdated}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
