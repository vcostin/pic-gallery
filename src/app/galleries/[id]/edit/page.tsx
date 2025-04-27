'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent, 
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { use } from 'react';
import logger from '@/lib/logger';

// Types for gallery data
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
    createdAt: string;
    updatedAt: string;
  };
}

interface GalleryUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  coverImageId?: string | null;
  images: GalleryImage[];
  user: GalleryUser;
}

// A simple card component for the drag overlay
function DragOverlayCard({ image }: { image: GalleryImage }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-64">
      <div className="aspect-square relative mb-3">
        <Image
          src={image.image.url}
          alt={image.image.title}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      <h3 className="font-semibold truncate">{image.image.title}</h3>
    </div>
  );
}

// Sortable gallery image component
function SortableGalleryImage({ 
  galleryImage, 
  isCover, 
  onDescriptionChange, 
  setCoverImage, 
  onRemoveImage 
}: { 
  galleryImage: GalleryImage;
  isCover: boolean;
  onDescriptionChange: (id: string, description: string) => void;
  setCoverImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: galleryImage.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${isCover ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex justify-between mb-2">
        <div className="cursor-move" {...attributes} {...listeners}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
            <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
          </svg>
        </div>
        <button
          type="button" 
          onClick={() => setCoverImage(galleryImage.image.id)}
          className={`text-sm ${isCover ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
        >
          {isCover ? 'Cover Image ✓' : 'Set as Cover'}
        </button>
      </div>

      <div className="aspect-square relative mb-3">
        <Image
          src={galleryImage.image.url}
          alt={galleryImage.image.title}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      
      <h3 className="font-semibold mb-2">{galleryImage.image.title}</h3>
      
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Image Description</label>
        <textarea
          value={galleryImage.description || ''}
          onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          placeholder="Add a description for this image"
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {galleryImage.image.tags.map((tag) => (
          <span
            key={tag.id}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
          >
            {tag.name}
          </span>
        ))}
      </div>
      
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onRemoveImage(galleryImage.id);
        }}
        className="text-red-500 text-sm hover:underline"
      >
        Remove from gallery
      </button>
    </div>
  );
}

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageId, setCoverImageId] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // New state for image selection dialog
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  
  // State for drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeImage = activeId ? images.find(img => img.id === activeId) : null;
  
  const router = useRouter();
  
  // Configure the sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after moving 8px to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch the gallery data
  useEffect(() => {
    async function fetchGallery() {
      try {
        const response = await fetch(`/api/galleries/${galleryId}`);
        
        if (!response.ok) {
          // Handle specific error status codes
          if (response.status === 401) {
            throw new Error('You are not authorized to view this gallery. Please sign in or check your permissions.');
          } else if (response.status === 404) {
            throw new Error('Gallery not found. It may have been deleted.');
          } else {
            // Try to get the error message from the response
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch gallery');
          }
        }
        
        const data = await response.json();
        setGallery(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublic(data.isPublic);
        setCoverImageId(data.coverImageId || '');
        setImages(data.images);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error fetching gallery:', error);
        setError(error instanceof Error ? error.message : 'Failed to load gallery data');
        setIsLoading(false);
      }
    }

    fetchGallery();
  }, [galleryId]);

  // Track unsaved changes
  useEffect(() => {
    if (!gallery) return;
    
    const hasChanges = 
      title !== gallery.title ||
      description !== gallery.description ||
      isPublic !== gallery.isPublic ||
      coverImageId !== (gallery.coverImageId || '') ||
      JSON.stringify(images) !== JSON.stringify(gallery.images);
    
    setHasUnsavedChanges(hasChanges);
  }, [gallery, title, description, isPublic, coverImageId, images]);

  // Event handlers
  const handleImageDescriptionChange = useCallback((id: string, newDescription: string) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, description: newDescription } : img
    ));
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImageToRemove(id);
    setShowRemoveImageDialog(true);
  }, []);

  const confirmRemoveImage = useCallback(() => {
    if (imageToRemove) {
      // If removing the cover image, clear the coverImageId
      if (images.find(img => img.id === imageToRemove)?.image.id === coverImageId) {
        setCoverImageId('');
      }
      
      setImages(prevImages => prevImages.filter(img => img.id !== imageToRemove));
      setImageToRemove(null);
      
      // Mark that we have unsaved changes after removing an image
      setHasUnsavedChanges(true);
    }
  }, [imageToRemove, images, coverImageId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      
      // Mark as having unsaved changes after reordering
      setHasUnsavedChanges(true);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Prepare the image order and descriptions data
      const imageUpdates = images.map((img, index) => ({
        id: img.id,
        description: img.description,
        order: index
      }));
      
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          isPublic,
          coverImageId, // Send as is - API will handle empty string as null
          images: imageUpdates
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update gallery');
      }

      setSuccessMessage('Gallery updated successfully!');
      
      // Update local state to match server state
      setGallery(data);
      setHasUnsavedChanges(false);
      
      // After 2 seconds, redirect back to gallery view
      setTimeout(() => {
        router.push(`/galleries/${galleryId}`);
        router.refresh();
      }, 2000);
    } catch (error) {
      logger.error('Error updating gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to update gallery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/galleries/${galleryId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading gallery...</span>
        </div>
      </div>
    );
  }

  if (error && !gallery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/galleries')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Galleries
        </button>
      </div>
    );
  }

  if (!gallery) {
    return <div className="container mx-auto px-4 py-8">Gallery not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Galleries', href: '/galleries' },
          { label: gallery?.title || 'Gallery', href: `/galleries/${galleryId}` },
          { label: 'Edit', href: `/galleries/${galleryId}/edit` },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Edit Gallery</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={(e) => {
        e.preventDefault();
        if (hasUnsavedChanges) {
          setShowConfirmDialog(true);
        } else {
          router.push(`/galleries/${gallery.id}`);
        }
      }} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Gallery Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter gallery title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter gallery description"
                rows={3}
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Make gallery public</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Images ({images.length})</h2>
            <button
              type="button"
              onClick={() => setShowSelectImagesDialog(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={isSubmitting}
            >
              Add Images
            </button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Drag and drop to reorder images. You can also set a cover image and edit descriptions.
          </p>
          
          {images.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                This gallery has no images. Click the "Add Images" button to add some.
              </p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext 
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((galleryImage) => (
                    <SortableGalleryImage
                      key={galleryImage.id}
                      galleryImage={galleryImage}
                      isCover={coverImageId === galleryImage.image.id}
                      onDescriptionChange={handleImageDescriptionChange}
                      setCoverImage={setCoverImageId}
                      onRemoveImage={handleRemoveImage}
                    />
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeImage ? <DragOverlayCard image={activeImage} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasUnsavedChanges}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
      
      {/* Confirmation dialog for unsaved changes */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
        title="Save Changes?"
        message="You have unsaved changes. Do you want to save them before leaving?"
        confirmButtonText="Save Changes"
        cancelButtonText="Discard"
      />
      
      {/* Confirmation dialog for removing an image */}
      <ConfirmDialog
        isOpen={showRemoveImageDialog}
        onClose={() => {
          setShowRemoveImageDialog(false);
          setImageToRemove(null);
        }}
        onConfirm={confirmRemoveImage}
        title="Remove Image"
        message="Are you sure you want to remove this image from the gallery? This action cannot be undone."
        confirmButtonText="Remove"
        cancelButtonText="Cancel"
        confirmButtonColor="red"
      />
      
      {/* Image selection dialog */}
      <SelectImagesDialog
        isOpen={showSelectImagesDialog}
        onClose={() => setShowSelectImagesDialog(false)}
        galleryId={galleryId}
        onImagesSelected={() => {
          setShowSelectImagesDialog(false);
          // Refresh the gallery data after images are added
          router.refresh();
        }}
        existingImageIds={images.map(img => img.image.id)}
      />
    </div>
  );
}
