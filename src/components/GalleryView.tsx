'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SelectImagesDialog } from "@/components/SelectImagesDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import logger from "@/lib/logger";

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
    coverImageId?: string | null;
    images: GalleryImage[];
    user: GalleryUser;
  };
  isOwner: boolean;
}

export function GalleryView({ gallery, isOwner }: GalleryViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isSelectImagesOpen, setIsSelectImagesOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectImages = () => {
    setIsSelectImagesOpen(true);
  };

  const handleImagesSelected = () => {
    setIsSelectImagesOpen(false);
    router.refresh();
  };

  const handleDeleteGallery = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete gallery');
      }
      
      // Redirect to galleries list
      router.push('/galleries');
      router.refresh();
    } catch (error) {
      logger.error('Error deleting gallery:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete gallery');
      setIsDeleteDialogOpen(false); // Close the dialog if there's an error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
              <button
                onClick={handleSelectImages}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add Images
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete Gallery
              </button>
            </div>
          )}
        </div>
        {deleteError && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {deleteError}
          </div>
        )}
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
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">This gallery has no images yet</h3>
          {isOwner ? (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Add some images to start building your gallery.
              </p>
              <button
                onClick={handleSelectImages}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Images
              </button>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              The gallery owner hasn't added any images yet.
            </p>
          )}
        </div>
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
      )}

      {gallery.images.length > 0 && (
        <ImageCarousel
          images={gallery.images}
          initialImageIndex={selectedImageIndex ?? 0}
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}

      {isOwner && (
        <>
          <SelectImagesDialog
            isOpen={isSelectImagesOpen}
            onClose={() => setIsSelectImagesOpen(false)}
            galleryId={gallery.id}
            onImagesSelected={handleImagesSelected}
            existingImageIds={gallery.images.map(img => img.image.id)}
          />
          
          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteGallery}
            title="Delete Gallery"
            message={
              <div>
                <p className="mb-2">Are you sure you want to delete this gallery?</p>
                <p className="text-red-500 font-semibold">This action cannot be undone.</p>
                {gallery.images.length > 0 && (
                  <p className="mt-2 text-gray-600">
                    Note: Your images will not be deleted, only removed from this gallery.
                  </p>
                )}
                {isDeleting && (
                  <div className="mt-2 flex items-center text-blue-500">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                    <span>Deleting...</span>
                  </div>
                )}
              </div>
            }
            confirmButtonText={isDeleting ? "Deleting..." : "Delete Gallery"}
            confirmButtonColor="red"
          />
        </>
      )}
    </div>
  );
}
