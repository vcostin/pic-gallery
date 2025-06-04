'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { ImageTags } from '@/components/ui/ImageTags';
import { type Image as ImageType } from '@/lib/services/imageService';

interface ImageViewerProps {
  images: ImageType[];
  currentImageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onImageChange?: (imageId: string) => void;
}

export function ImageViewer({ images, currentImageId, isOpen, onClose, onImageChange }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentIndex = images.findIndex(img => img.id === currentImageId);
  const currentImage = currentIndex >= 0 ? images[currentIndex] : null;

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
    setIsDragging(false);
  }, [currentImageId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case ' ':
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]);

  const handlePrevious = useCallback(() => {
    if (images.length <= 1) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    const prevImage = images[prevIndex];
    onImageChange?.(prevImage.id);
  }, [currentIndex, images, onImageChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    onImageChange?.(nextImage.id);
  }, [currentIndex, images, onImageChange]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.5, 5));
    setIsZoomed(true);
  }, []);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.5, 1);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  }, [scale]);

  const toggleZoom = useCallback(() => {
    if (scale === 1) {
      setScale(2);
      setIsZoomed(true);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  }, [scale]);

  const handleImageClick = useCallback(() => {
    if (!isZoomed) {
      toggleZoom();
    }
  }, [isZoomed, toggleZoom]);

  if (!isOpen || !currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-viewer-title"
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm">
                {currentIndex + 1} of {images.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={scale <= 1}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out (-)"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="w-5 h-5" />
              </button>
              
              <span className="text-white/80 text-sm min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={scale >= 5}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in (+)"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5" />
              </button>
              
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title="Close (Esc)"
                aria-label="Close viewer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                title="Previous image (←)"
                aria-label="Previous image"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                title="Next image (→)"
                aria-label="Next image"
              >
                <ArrowRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="relative cursor-zoom-in"
              style={{
                cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
              }}
              animate={{
                scale,
                x: position.x,
                y: position.y
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag={isZoomed}
              dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onTap={handleImageClick}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.title}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain"
                priority
                unoptimized // For better zooming experience
              />
            </motion.div>
          </motion.div>

          {/* Image info panel */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2" id="image-viewer-title">{currentImage.title}</h2>
            {currentImage.description && (
              <p className="text-white/80 mb-3 line-clamp-3">{currentImage.description}</p>
            )}
            {currentImage.tags && currentImage.tags.length > 0 && (
              <div className="mb-2">
                <ImageTags tags={currentImage.tags} max={5} />
              </div>
            )}
            <div className="text-sm text-white/60">
              Click image or press space to zoom • Use arrow keys to navigate • Press Esc to close
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
