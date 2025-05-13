'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorMessage, EmptyState } from "@/components/StatusMessages";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Import schema-derived types
import { GalleryViewType } from "@/lib/utils/galleryViewMappers";

interface GalleryViewProps {
  gallery: GalleryViewType;
  isOwner: boolean;
}

export function GalleryView({ gallery, isOwner }: GalleryViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const router = useRouter();
  
  return (
    <ErrorBoundary fallback={(error) => (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={error} 
          retry={() => router.refresh()}
          className="mb-4"
        />
        <button
          onClick={() => router.push('/galleries')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Galleries
        </button>
      </div>
    )}>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Galleries', href: '/galleries' },
            { label: gallery.title, href: `/galleries/${gallery.id}` },
          ]}
        />
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{gallery.title}</h1>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/galleries/${gallery.id}/edit`)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit Gallery
                </button>
              </div>
            )}
          </div>
          {gallery.description && (
            <p className="text-gray-600 dark:text-gray-300">{gallery.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            {gallery.user.image && (
              <Image
                src={gallery.user.image}
                alt={gallery.user.name || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">
              By {gallery.user.name}
            </span>
            {gallery.isPublic ? (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                Public
              </span>
            ) : isOwner && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Private
              </span>
            )}
          </div>
        </div>

        {gallery.images.length === 0 ? (
          <EmptyState
            title="This gallery has no images yet"
            description={isOwner ? "Go to the Edit Gallery page to add images." : "The gallery owner hasn't added any images yet."}
            action={isOwner && (
              <button
                onClick={() => router.push(`/galleries/${gallery.id}/edit`)}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Gallery
              </button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.images.map((galleryImage, index) => (
              <div
                key={galleryImage.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer ${
                  gallery.coverImageId === galleryImage.image.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={galleryImage.image.url}
                    alt={galleryImage.image.title}
                    fill
                    className="object-cover hover:opacity-90 transition-opacity"
                  />
                  {gallery.coverImageId === galleryImage.image.id && isOwner && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Cover
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{galleryImage.image.title}</h3>
                  {galleryImage.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {galleryImage.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {galleryImage.image.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {gallery.images.length > 0 && (
          <ImageCarousel
            images={gallery.images.map(img => ({
              id: img.id,
              description: img.description || null,
              image: {
                id: img.image.id,
                url: img.image.url,
                title: img.image.title,
                tags: img.image.tags || []
              }
            }))}
            initialImageIndex={selectedImageIndex ?? 0}
            isOpen={selectedImageIndex !== null}
            onClose={() => setSelectedImageIndex(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
