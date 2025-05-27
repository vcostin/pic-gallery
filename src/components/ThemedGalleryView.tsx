'use client';

import React from 'react';
// Import schema-derived types and mappers
import { 
  DisplayGallery, 
  DisplayImage,
  mapGalleryImageToDisplayImage,
  mapGalleryImagesToDisplayImages
} from '@/lib/utils/typeMappers';
import { EnhancedCarousel } from '@/components/gallery-display/EnhancedCarousel';
import { EnhancedGalleryGrid } from '@/components/gallery-display/EnhancedGalleryGrid';
import { EnhancedSlideshow } from '@/components/gallery-display/EnhancedSlideshow';
import { GalleryFullscreen } from '@/components/gallery-display/GalleryFullscreen';

interface ThemedGalleryViewProps {
  gallery: DisplayGallery;
  isOwner?: boolean;
}


export function ThemedGalleryView({ gallery, isOwner = false }: ThemedGalleryViewProps) {
  const [fullscreenImageInfo, setFullscreenImageInfo] = React.useState<{ image: DisplayImage, originalIndex: number } | null>(null);

  const openFullscreen = (imageInGallery: typeof gallery.images[0], index: number) => {
    setFullscreenImageInfo({ 
      image: mapGalleryImageToDisplayImage(imageInGallery), 
      originalIndex: index 
    });
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
    setFullscreenImageInfo({ 
      image: mapGalleryImageToDisplayImage(nextImageInGallery), 
      originalIndex: newIndex 
    });
  };

  const {
    themeColor,
    backgroundColor,
    backgroundImageUrl,
    fontFamily,
    displayMode,
    layoutType,
    // Keep accentColor in the destructuring since it's passed to child components
  } = gallery;

  const galleryStyle: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(backgroundImageUrl && { backgroundImage: `url(${backgroundImageUrl})` }),
    ...(fontFamily && { fontFamily }),
  };

  const containerClass = layoutType === 'full-width' ? 'w-full' : 'container mx-auto';

  // Prepare images for child components using our fixed utility function
  const imagesForDisplay = mapGalleryImagesToDisplayImages(gallery.images);

  const renderGalleryContent = () => {
    switch (displayMode) {
      case 'carousel':
        return (
          <EnhancedCarousel
            images={imagesForDisplay}
            autoPlay={true}
            showThumbnails={true}
            themeColor={gallery.themeColor || '#6366f1'}
            accentColor={gallery.accentColor || '#10b981'}
            onImageClick={(image) => {
              const imageId = image.id;
              const galleryImageIndex = gallery.images.findIndex(img => img.image && img.image.id === imageId);
              if (galleryImageIndex >= 0) {
                const imageInGallery = gallery.images[galleryImageIndex];
                openFullscreen(imageInGallery, galleryImageIndex);
              }
            }}
          />
        );
      case 'slideshow':
        return (
          <div>
            <EnhancedGalleryGrid
              images={imagesForDisplay}
              layout="uniform"
              themeColor={gallery.themeColor || '#6366f1'}
              onImageClick={(image) => {
                const imageId = image.id;
                const galleryImageIndex = gallery.images.findIndex(img => img.image && img.image.id === imageId);
                if (galleryImageIndex >= 0) {
                  const imageInGallery = gallery.images[galleryImageIndex];
                  openFullscreen(imageInGallery, galleryImageIndex);
                }
              }}
            />
            {fullscreenImageInfo && (
              <EnhancedSlideshow
                images={imagesForDisplay}
                initialIndex={fullscreenImageInfo.originalIndex}
                isOpen={!!fullscreenImageInfo}
                onClose={closeFullscreen}
                autoPlay={false}
                themeColor={gallery.themeColor || '#6366f1'}
              />
            )}
          </div>
        );
      case 'grid':
      default:
        // Determine layout type based on gallery settings
        const gridLayout = (() => {
          switch (layoutType) {
            case 'masonry': return 'masonry';
            case 'uniform': return 'uniform';
            case 'compact': return 'compact';
            default: return 'masonry';
          }
        })();
        
        return (
          <EnhancedGalleryGrid
            images={imagesForDisplay}
            layout={gridLayout}
            themeColor={gallery.themeColor || '#6366f1'}
            onImageClick={(image) => {
              const imageId = image.id;
              const galleryImageIndex = gallery.images.findIndex(img => img.image && img.image.id === imageId);
              if (galleryImageIndex >= 0) {
                const imageInGallery = gallery.images[galleryImageIndex];
                openFullscreen(imageInGallery, galleryImageIndex);
              }
            }}
          />
        );
    }
  };

  return (
    <div style={galleryStyle} className={`py-8 ${containerClass}`} data-testid="gallery-view">
      <div className="mb-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: themeColor || undefined }} data-testid="gallery-detail-title">
            {gallery.title}
          </h1>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = `/galleries/${gallery.id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                data-testid="edit-gallery-button"
              >
                Edit Gallery
              </button>
            </div>
          )}
        </div>
        {gallery.description && (
          <p className="text-lg mt-2" style={{ color: themeColor || undefined }} data-testid="gallery-detail-description">
            {gallery.description}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="gallery-detail-author">
          By {gallery.user.name || 'Anonymous'}
        </p>
      </div>

      {renderGalleryContent()}

      {fullscreenImageInfo && gallery.images[fullscreenImageInfo.originalIndex] && (
        <GalleryFullscreen
          image={fullscreenImageInfo.image}
          onClose={closeFullscreen}
          onNext={() => navigateFullscreen('next')}
          onPrev={() => navigateFullscreen('prev')}
        />
      )}
    </div>
  );
}
