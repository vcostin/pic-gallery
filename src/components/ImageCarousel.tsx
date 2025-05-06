'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LoadingSpinner, ErrorMessage } from './StatusMessages';
import { ErrorBoundary } from './ErrorBoundary';
import { ImageTags } from './ui/ImageTags';

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

interface ImageCarouselProps {
  images: GalleryImage[];
  initialImageIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageCarousel({ images, initialImageIndex, isOpen, onClose }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    setCurrentIndex(initialImageIndex);
  }, [initialImageIndex]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  
  // Reset loading state and error when navigating between images
  const handleImageNavigation = (index: number) => {
    setImageError(null);
    setIsImageLoading(true);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    handleImageNavigation((currentIndex + 1) % images.length);
  };

  const goToPrevious = () => {
    handleImageNavigation((currentIndex - 1 + images.length) % images.length);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError('Failed to load image. The image might be unavailable or deleted.');
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <div 
          ref={dialogRef}
          className="relative w-full max-w-5xl mx-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white bg-gray-900 bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center">
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 text-white bg-gray-900 bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-full">
              <div className="aspect-[4/3] relative">
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <LoadingSpinner size="large" text="Loading image..." />
                  </div>
                )}
                
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <ErrorMessage error={imageError} className="max-w-md mx-auto" />
                  </div>
                )}
                
                <Image
                  src={currentImage.image.url}
                  alt={currentImage.image.title}
                  fill
                  className="object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  priority
                />
              </div>

              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{currentImage.image.title}</h3>
                {currentImage.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{currentImage.description}</p>
                )}
                <ImageTags tags={currentImage.image.tags} max={3} />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} of {images.length}
                </div>
              </div>
            </div>

            <button
              onClick={goToNext}
              className="absolute right-4 z-10 text-white bg-gray-900 bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
