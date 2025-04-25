'use client';

import { useState } from "react";
import Image from "next/image";
import { ImageCarousel } from "@/components/ImageCarousel";

interface Tag {
  id: string;
  name: string;
}

interface GalleryImage {
  id: string;
  description: string | null;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
}

interface GalleryUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface GalleryViewProps {
  gallery: {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    images: GalleryImage[];
    user: GalleryUser;
  };
  isOwner: boolean;
}

export function GalleryView({ gallery, isOwner }: GalleryViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{gallery.title}</h1>
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
          {gallery.isPublic && !isOwner && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Public
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {gallery.images.map((galleryImage, index) => (
          <div
            key={galleryImage.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer"
            onClick={() => setSelectedImageIndex(index)}
          >
            <div className="aspect-square relative">
              <Image
                src={galleryImage.image.url}
                alt={galleryImage.image.title}
                fill
                className="object-cover hover:opacity-90 transition-opacity"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{galleryImage.image.title}</h3>
              {galleryImage.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {galleryImage.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {galleryImage.image.tags.map((tag) => (
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

      <ImageCarousel
        images={gallery.images}
        initialImageIndex={selectedImageIndex ?? 0}
        isOpen={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
      />
    </div>
  );
}
