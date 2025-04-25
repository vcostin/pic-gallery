'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { useMemo, useEffect, useState } from 'react';

// This component automatically generates breadcrumbs based on the current path
export function Breadcrumbs() {
  const pathname = usePathname();
  const [galleryTitle, setGalleryTitle] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string | null>(null);
  
  // Fetch gallery or image title for dynamic routes
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if we're on a gallery detail page
    if (segments.length === 2 && segments[0] === 'galleries' && segments[1].length > 10) {
      const galleryId = segments[1];
      // Fetch gallery info
      fetch(`/api/galleries/${galleryId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch gallery');
        })
        .then(data => {
          setGalleryTitle(data.title);
        })
        .catch(err => {
          console.error('Error fetching gallery info:', err);
        });
    }
    
    // Check if we're on an image detail page
    if (segments.length === 2 && segments[0] === 'images' && segments[1].length > 10) {
      const imageId = segments[1];
      // Fetch image info
      fetch(`/api/images/${imageId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch image');
        })
        .then(data => {
          setImageTitle(data.title);
        })
        .catch(err => {
          console.error('Error fetching image info:', err);
        });
    }
  }, [pathname]);
  
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Create an array of breadcrumb items with labels and hrefs
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      
      // Handle special cases like gallery ID pages
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // If we're in a dynamic route, use the fetched title if available
      if (segments[index - 1] === 'galleries' && segment.length > 10) {
        label = galleryTitle || 'Gallery Details';
      } else if (segments[index - 1] === 'images' && segment.length > 10) {
        label = imageTitle || 'Image Details';
      }
      
      return {
        label,
        href,
      };
    });
  }, [pathname, galleryTitle, imageTitle]);

  // Don't show breadcrumbs on the home page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="container mx-auto px-4 py-2 text-sm" aria-label="Breadcrumbs">
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
          >
            <HomeIcon className="h-4 w-4 mr-1" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            {index === breadcrumbs.length - 1 ? (
              <span className="ml-1 font-medium text-gray-700 dark:text-gray-300" title={breadcrumb.label}>
                {breadcrumb.label && breadcrumb.label.length > 20
                  ? `${breadcrumb.label.substring(0, 20)}...`
                  : breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={breadcrumb.label}
              >
                {breadcrumb.label && breadcrumb.label.length > 20
                  ? `${breadcrumb.label.substring(0, 20)}...`
                  : breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
