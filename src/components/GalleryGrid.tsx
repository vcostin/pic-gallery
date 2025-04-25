'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Tag {
  id: string;
  name: string;
}

interface ImageInGallery {
  id: string;
  description: string | null;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  images: ImageInGallery[];
}

interface GalleryGridProps {
  galleries: Gallery[];
  isOwner: boolean;
}

export function GalleryGrid({ galleries, isOwner }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {galleries.map(gallery => (
        <Link
          key={gallery.id}
          href={`/galleries/${gallery.id}`}
          className="group block"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="aspect-square relative">
              {gallery.images[0] ? (
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
              <div className="absolute bottom-2 right-2 flex gap-2">
                {!isOwner && gallery.isPublic && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Public
                  </span>
                )}
                <span className="bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {gallery.images.length} {gallery.images.length === 1 ? 'image' : 'images'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1 group-hover:text-blue-500 transition-colors">
                {gallery.title}
              </h3>
              {gallery.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {gallery.description}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
