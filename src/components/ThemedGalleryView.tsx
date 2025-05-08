'use client';

import React from 'react';
// Import the centralized types
import { FullGallery, FullImageInGallery, ImageType } from '@/lib/types'; 
import { GalleryCarousel } from './gallery-display/GalleryCarousel';
import { ImageGrid } from './ImageGrid'; 
import { GalleryFullscreen } from './gallery-display/GalleryFullscreen';

interface ThemedGalleryViewProps {
  gallery: FullGallery;
}

// Helper to map FullImageInGallery to ImageType, ensuring description compatibility
const mapToImageType = (fig: FullImageInGallery): ImageType => ({
  id: fig.image.id,
  url: fig.image.url,
  title: fig.image.title,
  description: fig.description, // Use gallery-specific description
  tags: fig.image.tags,
});

// Helper to map FullImageInGalleryImage (from FullImageInGallery.image) to ImageType
// This helper seems to be used for the fullscreen view.
// We need to ensure it also uses the correct description if the intent is to show gallery-specific one.
// However, GalleryFullscreen might be intended to show the master image details.
// For now, let's assume Fullscreen should also show gallery-specific description if available.
// This requires passing the FullImageInGallery to mapPrismaImageToImageType or finding it.
// Let's adjust mapPrismaImageToImageType to accept FullImageInGallery
const mapFullImageInGalleryToImageType = (fig: FullImageInGallery): ImageType => ({
  id: fig.image.id,
  url: fig.image.url,
  title: fig.image.title,
  description: fig.description, // Use gallery-specific description
  tags: fig.image.tags,
});


export function ThemedGalleryView({ gallery }: ThemedGalleryViewProps) { // Removed isOwner
  const [fullscreenImageInfo, setFullscreenImageInfo] = React.useState<{ image: ImageType, originalIndex: number } | null>(null);

  const openFullscreen = (imageInGallery: FullImageInGallery, index: number) => {
    setFullscreenImageInfo({ image: mapToImageType(imageInGallery), originalIndex: index });
  };

  const closeFullscreen = () => {
    setFullscreenImageInfo(null);
  };

  const navigateFullscreen = (direction: 'next' | 'prev') => {
    if (!fullscreenImageInfo) return;
    const { originalIndex } = fullscreenImageInfo;
    const newIndex = direction === 'next'
      ? (originalIndex + 1) % gallery.images.length
      : (originalIndex - 1 + gallery.images.length) % gallery.images.length;
    
    const nextImageInGallery = gallery.images[newIndex];
    // Use the corrected mapping for fullscreen
    setFullscreenImageInfo({ image: mapFullImageInGalleryToImageType(nextImageInGallery), originalIndex: newIndex });
  };

  const {
    themeColor,
    backgroundColor,
    backgroundImageUrl,
    fontFamily,
    displayMode,
    layoutType,
    accentColor,
  } = gallery;

  const galleryStyle: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(backgroundImageUrl && { backgroundImage: `url(${backgroundImageUrl})` }),
    ...(fontFamily && { fontFamily }),
  };

  const containerClass = layoutType === 'full-width' ? 'w-full' : 'container mx-auto';

  // Prepare images for child components, ensuring they match ImageType
  const imagesForDisplay: ImageType[] = gallery.images.map(mapToImageType);

  const renderGalleryContent = () => {
    switch (displayMode) {
      case 'carousel':
        return (
          <GalleryCarousel
            images={imagesForDisplay}
            onImageClick={(image, index) => {
              // Find the original FullImageInGallery object based on id or use index if arrays correspond
              const originalImageInGallery = gallery.images.find(img => img.image.id === image.id) || gallery.images[index];
              if (originalImageInGallery) {
                openFullscreen(originalImageInGallery, gallery.images.findIndex(img => img.image.id === image.id));
              }
            }}
            themeColor={gallery.themeColor}
            accentColor={gallery.accentColor}
          />
        );
      case 'grid':
        return (
          <ImageGrid
            images={imagesForDisplay}
            // If ImageGrid needs onImageClick that expects FullImageInGallery, adjust accordingly
            // For now, assuming ImageGrid might not have a click handler or uses ImageType
          />
        );
      default:
        return (
          <GalleryCarousel
            images={imagesForDisplay}
            onImageClick={(image, index) => {
              const originalImageInGallery = gallery.images.find(img => img.image.id === image.id) || gallery.images[index];
              if (originalImageInGallery) {
                openFullscreen(originalImageInGallery, gallery.images.findIndex(img => img.image.id === image.id));
              }
            }}
            themeColor={gallery.themeColor}
            accentColor={gallery.accentColor}
          />
        );
    }
  };

  return (
    <div style={galleryStyle} className={`py-8 ${containerClass}`}>
      <div className="mb-4 px-4">
        <h1 className="text-3xl font-bold" style={{ color: themeColor || undefined }}>
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="text-lg mt-2" style={{ color: themeColor || undefined }}>
            {gallery.description}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          By {gallery.user.name || 'Anonymous'}
        </p>
      </div>

      {renderGalleryContent()}

      {fullscreenImageInfo && gallery.images[fullscreenImageInfo.originalIndex] && (
        <GalleryFullscreen
          image={mapFullImageInGalleryToImageType(gallery.images[fullscreenImageInfo.originalIndex])}
          onClose={closeFullscreen}
          onNext={() => navigateFullscreen('next')}
          onPrev={() => navigateFullscreen('prev')}
        />
      )}
    </div>
  );
}
