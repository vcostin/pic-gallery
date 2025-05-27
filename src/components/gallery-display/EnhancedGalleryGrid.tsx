'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { DisplayImage } from '@/lib/utils/typeMappers';

interface EnhancedGalleryGridProps {
  images: DisplayImage[];
  layout?: 'masonry' | 'uniform' | 'compact' | 'magazine' | 'polaroid';
  onImageClick?: (image: DisplayImage, index: number) => void;
  themeColor?: string;
  className?: string;
}

export function EnhancedGalleryGrid({ 
  images, 
  layout = 'masonry', 
  onImageClick,
  themeColor = '#6366f1',
  className = '' 
}: EnhancedGalleryGridProps) {
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  const [columns, setColumns] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);

  // Responsive column calculation
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return;
      const width = gridRef.current.offsetWidth;
      if (width < 640) setColumns(1);
      else if (width < 768) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(4);
      else setColumns(5);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Load image dimensions for masonry layout
  useEffect(() => {
    if (layout !== 'masonry') return;

    const loadImageDimensions = async () => {
      const heights: Record<string, number> = {};
      
      await Promise.all(
        images.map((img) => {
          return new Promise<void>((resolve) => {
            const image = new window.Image();
            image.onload = () => {
              const aspectRatio = image.height / image.width;
              heights[img.id] = aspectRatio * 300; // Base width of 300px
              resolve();
            };
            image.onerror = () => {
              heights[img.id] = 300; // Fallback height
              resolve();
            };
            image.src = img.url;
          });
        })
      );
      
      setImageHeights(heights);
    };

    loadImageDimensions();
  }, [images, layout]);

  // Distribute images across columns for masonry
  const distributeImages = () => {
    if (layout !== 'masonry') return { columnsArray: [], heights: [] };
    
    const columnsArray: DisplayImage[][] = Array.from({ length: columns }, () => []);
    const columnHeights = Array(columns).fill(0);

    images.forEach((image) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      columnsArray[shortestColumn].push(image);
      columnHeights[shortestColumn] += imageHeights[image.id] || 300;
    });

    return { columnsArray, heights: columnHeights };
  };

  const { columnsArray } = distributeImages();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const renderMasonryLayout = () => (
    <motion.div 
      ref={gridRef}
      className={`flex gap-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {columnsArray.map((column, columnIndex) => (
        <div key={columnIndex} className="flex-1 flex flex-col gap-4">
          {column.map((image) => {
            const globalIndex = images.findIndex(img => img.id === image.id);
            return (
              <motion.div
                key={image.id}
                variants={itemVariants}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300"
                style={{ height: imageHeights[image.id] || 300 }}
                onClick={() => onImageClick?.(image, globalIndex)}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative h-full overflow-hidden">
                  <Image
                    src={image.url}
                    alt={image.title || 'Gallery image'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-semibold text-lg mb-1">{image.title || 'Untitled'}</h3>
                    {image.description && (
                      <p className="text-sm opacity-90 line-clamp-2">{image.description}</p>
                    )}
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {image.tags.slice(0, 3).map((tag: { id: string; name: string }) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );

  const renderUniformGrid = () => (
    <motion.div 
      ref={gridRef}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          variants={itemVariants}
          className="group cursor-pointer"
          onClick={() => onImageClick?.(image, index)}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="aspect-square overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="relative h-full">
              <Image
                src={image.url}
                alt={image.title || 'Gallery image'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Modern overlay with blur effect */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              
              {/* Floating info card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="font-semibold text-sm truncate">{image.title || 'Untitled'}</h3>
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {image.tags.slice(0, 2).map((tag: { id: string; name: string }) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${themeColor}20`,
                          color: themeColor 
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderCompactGrid = () => (
    <motion.div 
      ref={gridRef}
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          variants={itemVariants}
          className="group cursor-pointer"
          onClick={() => onImageClick?.(image, index)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <Image
              src={image.url}
              alt={image.title || 'Gallery image'}
              width={200}
              height={200}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 12.5vw"
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderMagazineLayout = () => (
    <motion.div 
      ref={gridRef}
      className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {images.map((image, index) => {
        const isFeatured = index === 0 || (index + 1) % 7 === 0;
        const isHorizontal = (index + 1) % 3 === 0;
        
        return (
          <motion.div
            key={image.id}
            variants={itemVariants}
            className={`group cursor-pointer ${
              isFeatured ? 'md:col-span-2 md:row-span-2' : 
              isHorizontal ? 'md:col-span-2' : ''
            }`}
            onClick={() => onImageClick?.(image, index)}
            whileHover={{ y: -6 }}
          >
            <div className={`overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 ${
              isFeatured ? 'aspect-[4/3]' : 'aspect-square'
            }`}>
              <div className="relative h-full">
                <Image
                  src={image.url}
                  alt={image.title || 'Gallery image'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes={isFeatured ? "50vw" : "25vw"}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className={`font-semibold ${isFeatured ? 'text-xl' : 'text-lg'} mb-1`}>
                    {image.title || 'Untitled'}
                  </h3>
                  {image.description && isFeatured && (
                    <p className="text-sm opacity-90 line-clamp-2">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );

  const renderPolaroidLayout = () => {
    const initialRotations = useMemo(() => 
      images.map(() => Math.random() * 6 - 3), 
      [images]
    );

    return (
      <motion.div 
        ref={gridRef}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            variants={itemVariants}
            className="group cursor-pointer"
            onClick={() => onImageClick?.(image, index)}
            whileHover={{ 
              rotate: Math.random() * 6 - 3,
              scale: 1.05,
              y: -10
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              rotate: initialRotations[index] // Memoized initial rotation
            }}
          >
          <div className="bg-white dark:bg-gray-100 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="aspect-square overflow-hidden rounded-sm mb-4">
              <Image
                src={image.url}
                alt={image.title || 'Gallery image'}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="text-center">
              <h3 className="font-handwriting text-lg text-gray-800 dark:text-gray-700">
                {image.title || 'Untitled'}
              </h3>
              {image.description && (
                <p className="text-sm text-gray-600 dark:text-gray-500 mt-1 line-clamp-2">
                  {image.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  // Render based on layout type
  switch (layout) {
    case 'masonry':
      return renderMasonryLayout();
    case 'uniform':
      return renderUniformGrid();
    case 'compact':
      return renderCompactGrid();
    case 'magazine':
      return renderMagazineLayout();
    case 'polaroid':
      return renderPolaroidLayout();
    default:
      return renderUniformGrid();
  }
}
