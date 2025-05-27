'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { DisplayImage } from '@/lib/utils/typeMappers';

interface EnhancedSlideshowProps {
  images: DisplayImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  themeColor?: string;
  showInfo?: boolean;
  className?: string;
}

export function EnhancedSlideshow({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  autoPlay = false,
  autoPlayInterval = 4000,
  showInfo = true,
  className = ''
}: EnhancedSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [isInfoVisible, setIsInfoVisible] = useState(showInfo);
  const [direction, setDirection] = useState(0);

  const nextImage = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const previousImage = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleInfo = useCallback(() => {
    setIsInfoVisible(!isInfoVisible);
  }, [isInfoVisible]);

  // Reset index when props change
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && images.length > 1 && isOpen) {
      const interval = setInterval(() => {
        nextImage();
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentIndex, images.length, isOpen, autoPlayInterval, nextImage]);

  // Hide controls on mouse inactivity
  useEffect(() => {
    if (!isOpen) return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const handleMouseMove = () => resetTimer();
    const handleKeyPress = () => resetTimer();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    resetTimer();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          previousImage();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoPlay();
          break;
        case 'Escape':
          onClose();
          break;
        case 'i':
        case 'I':
          toggleInfo();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, nextImage, previousImage, toggleAutoPlay, onClose, toggleInfo]);

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-black ${className}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Main image container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative w-full h-full flex items-center justify-center"
            >
              <Image
                src={currentImage.url}
                alt={currentImage.title || 'Gallery image'}
                fill
                className="object-contain"
                priority
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={onClose}
                      className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                      aria-label="Close slideshow"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="text-white">
                      <span className="text-lg font-medium">
                        {currentIndex + 1} / {images.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {images.length > 1 && (
                      <button
                        onClick={toggleAutoPlay}
                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                      >
                        {isPlaying ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={toggleInfo}
                      className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                      aria-label={isInfoVisible ? 'Hide info' : 'Show info'}
                    >
                      <ArrowsPointingOutIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 pointer-events-auto"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 pointer-events-auto"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="w-8 h-8" />
                  </button>
                </>
              )}

              {/* Progress bar */}
              {images.length > 1 && isPlaying && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: autoPlayInterval / 1000, 
                      ease: 'linear',
                      repeat: Infinity
                    }}
                    key={currentIndex}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image info overlay */}
        <AnimatePresence>
          {isInfoVisible && (currentImage.title || currentImage.description || currentImage.tags?.length) && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-8 pt-16 text-white pointer-events-auto"
            >
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {currentImage.title || 'Untitled'}
                </h2>
                
                {currentImage.description && (
                  <p className="text-lg md:text-xl opacity-90 mb-4 leading-relaxed">
                    {currentImage.description}
                  </p>
                )}
                
                {currentImage.tags && currentImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {currentImage.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail strip */}
        {images.length > 1 && showControls && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="flex space-x-2 bg-black/40 backdrop-blur-sm rounded-lg p-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`relative overflow-hidden rounded transition-all duration-200 ${
                    index === currentIndex
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16">
                    <Image
                      src={image.url}
                      alt={image.title || 'Gallery image'}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      sizes="64px"
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Instructions overlay (appears briefly) */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center pointer-events-none"
        >
          <p>Use arrow keys to navigate • Space to play/pause • I to toggle info • Esc to close</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
