'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { DisplayImage } from '@/lib/utils/typeMappers';

interface EnhancedCarouselProps {
  images: DisplayImage[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showThumbnails?: boolean;
  themeColor?: string;
  accentColor?: string;
  onImageClick?: (image: DisplayImage, index: number) => void;
  className?: string;
}

export function EnhancedCarousel({
  images,
  autoPlay = false,
  autoPlayInterval = 5000,
  showThumbnails = true,
  themeColor = '#6366f1',
  onImageClick,
  className = ''
}: EnhancedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [direction, setDirection] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const nextImage = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const previousImage = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        nextImage();
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPlaying, currentIndex, images.length, autoPlayInterval, nextImage]);

  // Handle drag gestures
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 50;
    
    if (info.offset.x > threshold) {
      previousImage();
    } else if (info.offset.x < -threshold) {
      nextImage();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') previousImage();
      if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextImage, previousImage, toggleAutoPlay]);

  if (!images.length) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }
    })
  };

  const currentImage = images[currentIndex];

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main carousel container */}
      <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 cursor-pointer"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onClick={() => !isDragging && onImageClick?.(currentImage, currentIndex)}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.title || 'Gallery image'}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Image info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentImage.title || 'Untitled'}</h2>
                {currentImage.description && (
                  <p className="text-lg opacity-90 mb-3 line-clamp-2">{currentImage.description}</p>
                )}
                {currentImage.tags && currentImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentImage.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Play/Pause button */}
        {images.length > 1 && (
          <button
            onClick={toggleAutoPlay}
            className="absolute top-4 right-4 p-3 bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-full text-white transition-all duration-200"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Progress indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <div className="flex space-x-3 pb-2">
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 relative overflow-hidden rounded-lg transition-all duration-200 ${
                  index === currentIndex
                    ? 'ring-2 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                whileHover={{ scale: index === currentIndex ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-20 h-20 md:w-24 md:h-24">
                  <Image
                    src={image.url}
                    alt={image.title || 'Gallery image'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    sizes="96px"
                  />
                </div>
                {index === currentIndex && (
                  <motion.div
                    layoutId="activeThumb"
                    className="absolute inset-0 border-2 rounded-lg"
                    style={{ borderColor: themeColor }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Image counter */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
