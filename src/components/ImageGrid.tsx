'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, useCallback, memo } from 'react';
import { EditImageDialog } from '@/components/EditImage';
import { EmptyState, SkeletonLoader } from '@/components/StatusMessages';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ImageViewer } from '@/components/ui/ImageViewer';
import logger from '@/lib/logger';
import { ImageTags } from '@/components/ui/ImageTags';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { type Image as ImageType } from '@/lib/services/imageService';

interface ImageGridProps {
  images: ImageType[];
  'data-testid'?: string;
}

// Memoized image card component to prevent unnecessary re-renders
const ImageCard = memo(({ 
  image, 
  onEdit, 
  onView 
}: { 
  image: ImageType; 
  onEdit: (image: ImageType) => void;
  onView: (image: ImageType) => void;
}) => {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden gallery-image" data-testid="gallery-image">
      <div 
        className="aspect-square relative cursor-pointer"
        onClick={() => onView(image)}
      >
        <Image
          src={image.url}
          alt={image.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false} // Only prioritize loading for visible images
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => logger.error(`Failed to load image: ${image.url}`)}
        />
        
        {/* Overlay with action buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(image);
            }}
            className="opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full transition-all duration-200 transform scale-95 hover:scale-100"
            title="View full image"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(image);
            }}
            className="opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full transition-all duration-200 transform scale-95 hover:scale-100"
            title="Edit image"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Click indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            Click to view
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onView(image)}>
          {image.title}
        </h3>
        {image.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
            {image.description}
          </p>
        )}
        <ImageTags tags={image.tags || []} max={3} />
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
    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
      isSelected
        ? 'bg-blue-500 text-white hover:bg-blue-600' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
    data-testid={`image-grid-tag-filter-${tag.toLowerCase().replace(/\s+/g, '-')}`}
  >
    {tag}
  </button>
));

TagFilterButton.displayName = 'TagFilterButton';

export function ImageGrid({ images, 'data-testid': testId }: ImageGridProps) {
  const [editingImage, setEditingImage] = useState<ImageType | null>(null);
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [imagesData, setImagesData] = useState<ImageType[]>(images);

  // Set initial data
  useEffect(() => {
    setImagesData(images);
    // Small delay to prevent flickering of skeleton loader on fast page loads
    const timer = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(timer);
  }, [images]);

  // Extract all unique tags from images
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    if (imagesData) {
      imagesData.forEach(image => {
        (image.tags || []).forEach(tag => tagSet.add(tag.name));
      });
    }
    return Array.from(tagSet).sort();
  }, [imagesData]);

  // Filter images based on selected tag
  const filteredImages = useMemo(() => {
    if (!imagesData) return [];
    if (!selectedTag) return imagesData;
    return imagesData.filter(image => 
      (image.tags || []).some(tag => tag.name === selectedTag)
    );
  }, [imagesData, selectedTag]);

  // Memoized callbacks
  const handleImageEdit = useCallback((image: ImageType) => {
    setEditingImage(image);
  }, []);

  const handleImageView = useCallback((image: ImageType) => {
    setViewingImageId(image.id);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid={testId}>
            {filteredImages.map(image => (
              <ImageCard 
                key={image.id} 
                image={image} 
                onEdit={handleImageEdit}
                onView={handleImageView}
              />
            ))}
          </div>
        )}

        {editingImage && (
          <EditImageDialog
            image={editingImage}
            isOpen={true}
            onClose={handleImageUpdated}
          />
        )}

        {viewingImageId && (
          <ImageViewer
            images={filteredImages}
            currentImageId={viewingImageId}
            isOpen={!!viewingImageId}
            onClose={() => setViewingImageId(null)}
            onImageChange={(imageId) => setViewingImageId(imageId)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
