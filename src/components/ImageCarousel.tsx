'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
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
              <Image
                src={currentImage.image.url}
                alt={currentImage.image.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{currentImage.image.title}</h3>
              {currentImage.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {currentImage.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {currentImage.image.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Image {currentIndex + 1} of {images.length}
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
  );
}