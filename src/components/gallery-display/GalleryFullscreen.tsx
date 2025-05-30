'use client';

import React from 'react';
import Image from 'next/image'; // Import next/image

interface Image {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

interface GalleryFullscreenProps {
  image: Image | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  themeColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
}

export function GalleryFullscreen({
  image,
  onClose,
  onNext,
  onPrev,
  themeColor,
  accentColor,
  backgroundColor
}: GalleryFullscreenProps) {
  if (!image) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor || 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: themeColor || 'white'
      }}
      onClick={onClose} // Close on backdrop click
      data-testid="gallery-fullscreen"
    >
      <div 
        style={{ padding: '20px', background: 'black', borderRadius: '5px', position: 'relative'}} 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image/controls area
      >
        <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '10px', right: '10px', background: accentColor || 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
        >
            Close
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ background:'transparent', border:'none', fontSize:'2rem', color: themeColor || 'white', marginRight: '10px' }} data-testid="gallery-prev-button">&#10094;</button>
          <Image 
            src={image.url} 
            alt={image.title || 'Fullscreen image'} 
            width={800} // Example width, adjust as needed
            height={600} // Example height, adjust as needed
            style={{ maxHeight: '80vh', maxWidth: '80vw', display: 'block', objectFit: 'contain' }}
            data-testid="gallery-fullscreen-image"
          />
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ background:'transparent', border:'none', fontSize:'2rem', color: themeColor || 'white', marginLeft: '10px' }} data-testid="gallery-next-button">&#10095;</button>
        </div>
        {image.title && <h3 style={{ textAlign: 'center', marginTop: '10px' }}>{image.title}</h3>}
        {image.description && <p style={{ textAlign: 'center', marginTop: '5px' }}>{image.description}</p>}
      </div>
    </div>
  );
}
