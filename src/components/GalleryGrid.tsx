'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { SkeletonLoader, EmptyState } from './StatusMessages';
import { ErrorBoundary } from './ErrorBoundary';
import { useAsync } from '@/lib/hooks';
import { Card, CardImage, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface GalleryImage {
  id: string;
  image: {
    id: string;
    url: string;
    title: string;
  };
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  coverImageId: string | null;
  images: GalleryImage[];
}

interface GalleryGridProps {
  galleries: Gallery[];
  isOwner: boolean;
}

export function GalleryGrid({ galleries, isOwner }: GalleryGridProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  
  // Use state to store galleries
  const { data: galleriesData, setData: setGalleriesData } = useAsync<Gallery[]>(galleries);

  // Set initial data
  useEffect(() => {
    setGalleriesData(galleries);
    // Small delay to prevent flickering of skeleton loader on fast page loads
    const timer = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(timer);
  }, [galleries, setGalleriesData]);

  const handleEditGallery = useCallback((e: React.MouseEvent, galleryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/galleries/${galleryId}/edit`);
  }, [router]);

  if (isInitializing) {
    return <SkeletonLoader count={4} type="card" />;
  }

  if (!galleriesData || galleriesData.length === 0) {
    return (
      <EmptyState
        title="You don't have any galleries yet"
        description="Create your first gallery to organize your images."
        action={
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => router.push('/galleries/create')}
          >
            Create a Gallery
          </Button>
        }
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleriesData.map(gallery => (
          <Link
            href={`/galleries/${gallery.id}`}
            key={gallery.id}
            className="block group"
          >
            <Card hover>
              <CardImage>
                <div className="aspect-[4/3] relative">
                  {gallery.images.length > 0 && gallery.coverImageId ? (
                    // Show the cover image if set
                    <Image
                      src={gallery.images.find(img => img.image.id === gallery.coverImageId)?.image.url || 
                          gallery.images[0].image.url}
                      alt={gallery.title}
                      fill
                      className="object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : gallery.images.length > 0 ? (
                    // Show the first image if no cover is set
                    <Image
                      src={gallery.images[0].image.url}
                      alt={gallery.title}
                      fill
                      className="object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400">No images</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 flex gap-2">
                  {!isOwner && gallery.isPublic && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Public
                    </span>
                  )}
                  {isOwner && !gallery.isPublic && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                  <span className="bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {gallery.images.length} {gallery.images.length === 1 ? 'image' : 'images'}
                  </span>
                </div>
                {isOwner && (
                  <Button
                    onClick={(e) => handleEditGallery(e, gallery.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                    variant="secondary"
                    size="sm"
                    aria-label="Edit gallery"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                )}
              </CardImage>
              <CardContent>
                <h3 className="font-semibold mb-1 group-hover:text-blue-500 transition-colors">
                  {gallery.title}
                </h3>
                {gallery.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {gallery.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </ErrorBoundary>
  );
}
