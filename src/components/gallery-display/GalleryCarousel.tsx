'use client';

import React from 'react';
import Image from 'next/image'; // Import next/image

interface Image {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

interface GalleryCarouselProps {
  images: Image[];
  onImageClick?: (image: Image, index: number) => void;
  themeColor?: string | null;
  accentColor?: string | null;
}

export function GalleryCarousel({ images, onImageClick, themeColor, accentColor }: GalleryCarouselProps) {
  if (!images || images.length === 0) {
    return <div style={{color: themeColor || 'inherit'}}>No images to display in carousel.</div>;
  }

  // Basic placeholder rendering - replace with actual carousel implementation
  return (
    <div style={{ border: `2px solid ${accentColor || '#ccc'}`, padding: '1rem', color: themeColor || 'inherit' }}>
      <h2>Gallery Carousel (Placeholder)</h2>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {images.map((image, index) => (
          <div 
            key={image.id} 
            style={{ margin: '0.5rem', textAlign: 'center' }} 
            onClick={() => onImageClick && onImageClick(image, index)}
          >
            <Image src={image.url} alt={image.title || 'Gallery image'} width={200} height={150} style={{ display: 'block' }} />
            {image.title && <p>{image.title}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
