'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
    // Handle empty gallery state
    if (gallery.images.length === 0) {
      return (
        <div className="text-center py-12" data-testid="empty-gallery-state">
          <div className="text-gray-400 mb-4">
            <svg 
              className="w-16 h-16 mx-auto"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No images yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            This gallery doesn&apos;t have any images.
          </p>
          {isOwner && (
            <button
              onClick={() => window.location.href = `/galleries/${gallery.id}/edit`}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              data-testid="add-images-cta-button"
            >
              Add Images
            </button>
          )}
        </div>
      );
    }

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

      <motion.div 
        data-testid="gallery-content" 
        className="gallery-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderGalleryContent()}
      </motion.div>

      {/* Only show GalleryFullscreen when NOT in slideshow mode */}
      {fullscreenImageInfo && displayMode !== 'slideshow' && gallery.images[fullscreenImageInfo.originalIndex] && (
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
