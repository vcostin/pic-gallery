'use client';

import React from 'react';
import { EnhancedCarousel } from '@/components/gallery-display/EnhancedCarousel';
import { EnhancedGalleryGrid } from '@/components/gallery-display/EnhancedGalleryGrid';
import { EnhancedSlideshow } from '@/components/gallery-display/EnhancedSlideshow';
import { DisplayImage } from '@/lib/utils/typeMappers';

// Sample test images
const testImages: DisplayImage[] = [
  {
    id: '1',
    url: 'https://picsum.photos/800/600?random=1',
    title: 'Beautiful Landscape',
    description: 'A stunning landscape with mountains and lakes',
    tags: [
      { id: '1', name: 'nature' },
      { id: '2', name: 'landscape' }
    ]
  },
  {
    id: '2',
    url: 'https://picsum.photos/800/900?random=2',
    title: 'Abstract Art',
    description: 'Modern abstract composition with vibrant colors',
    tags: [
      { id: '3', name: 'abstract' },
      { id: '4', name: 'modern' }
    ]
  },
  {
    id: '3',
    url: 'https://picsum.photos/600/800?random=3',
    title: 'Portrait Study',
    description: 'Character portrait with dramatic lighting',
    tags: [
      { id: '5', name: 'portrait' },
      { id: '6', name: 'dramatic' }
    ]
  },
  {
    id: '4',
    url: 'https://picsum.photos/800/600?random=4',
    title: 'Urban Architecture',
    description: 'Modern building design in the city',
    tags: [
      { id: '7', name: 'architecture' },
      { id: '8', name: 'urban' }
    ]
  },
  {
    id: '5',
    url: 'https://picsum.photos/700/700?random=5',
    title: 'Still Life',
    description: 'Classic still life arrangement',
    tags: [
      { id: '9', name: 'still-life' },
      { id: '10', name: 'classic' }
    ]
  }
];

export default function TestGalleryPage() {
  const [currentView, setCurrentView] = React.useState<'carousel' | 'grid' | 'slideshow'>('carousel');
  const [showSlideshow, setShowSlideshow] = React.useState(false);

  const handleImageClick = (image: DisplayImage) => {
    console.log('Image clicked:', image.title);
    if (currentView === 'grid') {
      setShowSlideshow(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Enhanced Gallery Components Test
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Testing the modern gallery display components with improved animations and mobile support
          </p>
          
          {/* View Mode Selector */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setCurrentView('carousel')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'carousel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Carousel View
            </button>
            <button
              onClick={() => setCurrentView('grid')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setShowSlideshow(true)}
              className="px-6 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Open Slideshow
            </button>
          </div>
        </div>

        {/* Enhanced Components Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {currentView === 'carousel' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Enhanced Carousel
              </h2>
              <EnhancedCarousel
                images={testImages}
                autoPlay={true}
                showThumbnails={true}
                themeColor="#6366f1"
                accentColor="#10b981"
                onImageClick={handleImageClick}
              />
            </div>
          )}

          {currentView === 'grid' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Enhanced Gallery Grid
              </h2>
              <EnhancedGalleryGrid
                images={testImages}
                layout="masonry"
                themeColor="#6366f1"
                onImageClick={handleImageClick}
              />
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🎠 Enhanced Carousel
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Auto-play, thumbnails, smooth transitions, and touch/swipe support for mobile devices.
            </p>
            <ul className="mt-3 text-sm text-gray-500 dark:text-gray-500">
              <li>• Touch/swipe gestures on mobile</li>
              <li>• Auto-play with pause on hover</li>
              <li>• Responsive thumbnail navigation</li>
              <li>• Smooth CSS transitions</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🔲 Advanced Grid
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Multiple layout options (masonry, uniform, compact) with responsive design and hover effects.
            </p>
            <ul className="mt-3 text-sm text-gray-500 dark:text-gray-500">
              <li>• Masonry, uniform & compact layouts</li>
              <li>• Responsive breakpoints</li>
              <li>• Smooth hover animations</li>
              <li>• Mobile-optimized touch areas</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              🖼️ Full-Screen Slideshow
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Immersive full-screen experience with info overlays and keyboard navigation.
            </p>
            <ul className="mt-3 text-sm text-gray-500 dark:text-gray-500">
              <li>• Full-screen modal display</li>
              <li>• Keyboard arrow navigation</li>
              <li>• Touch gestures for mobile</li>
              <li>• Smooth fade transitions</li>
            </ul>
          </div>
        </div>

        {/* Mobile Testing Tips */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            📱 Mobile Testing
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-3">
            To test mobile responsiveness and touch features:
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Open browser developer tools (F12)</li>
            <li>Toggle device toolbar or use device simulation</li>
            <li>Test swipe gestures on carousel</li>
            <li>Verify responsive grid layouts</li>
            <li>Check touch targets and tap responsiveness</li>
          </ol>
        </div>
      </div>

      {/* Enhanced Slideshow Modal */}
      {showSlideshow && (
        <EnhancedSlideshow
          images={testImages}
          initialIndex={0}
          isOpen={showSlideshow}
          onClose={() => setShowSlideshow(false)}
          autoPlay={false}
          themeColor="#6366f1"
        />
      )}
    </div>
  );
}
