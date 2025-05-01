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
import { ErrorMessage, LoadingSpinner, SuccessMessage, EmptyState } from '@/components/StatusMessages';
import { useAsync, useFetch, useSubmit } from '@/lib/hooks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  order: number;
  image: {
    id: string;
    url: string;
    title: string;
    tags: Tag[];
  };
  imageId?: string; // Add imageId property for temporary images
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
  coverImageId: string | null;
  images: GalleryImage[];
  user: GalleryUser;
}

// View mode options for gallery image cards
enum ViewMode {
  Compact = 'compact',
  Standard = 'standard',
  Grid = 'grid'
}

// A simple card component for the drag overlay
function DragOverlayCard({ image }: { image: GalleryImage }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 w-72">
      <div className="flex space-x-3">
        <div className="w-16 h-16 relative flex-shrink-0">
          <Image
            src={image.image.url}
            alt={image.image.title}
            fill
            className="object-cover rounded-md"
          />
        </div>
        
        <div className="flex-grow">
          <h3 className="font-medium text-sm mb-1 truncate">{image.image.title}</h3>
          <div className="text-xs text-gray-500">#{image.order}</div>
        </div>
      </div>
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: galleryImage.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${isCover ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="cursor-move flex items-center" {...attributes} {...listeners}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
            <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
          </svg>
          <span className="ml-2 text-xs text-gray-500">#{galleryImage.order}</span>
        </div>
        <div className="flex space-x-1">
          <button
            type="button" 
            onClick={() => setCoverImage(galleryImage.image.id)}
            className={`text-xs px-2 py-1 rounded-md ${isCover 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50'}`}
          >
            {isCover ? 'Cover ✓' : 'Set Cover'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemoveImage(galleryImage.id);
            }}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex space-x-3">
        <div className="w-16 h-16 relative flex-shrink-0">
          <Image
            src={galleryImage.image.url}
            alt={galleryImage.image.title}
            fill
            className="object-cover rounded-md"
          />
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-sm mb-1 truncate" title={galleryImage.image.title}>
            {galleryImage.image.title}
          </h3>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {galleryImage.image.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
              >
                {tag.name}
              </span>
            ))}
            {galleryImage.image.tags.length > 2 && (
              <span className="text-xs px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                +{galleryImage.image.tags.length - 2}
              </span>
            )}
          </div>
          
          <textarea
            value={galleryImage.description || ''}
            onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
            className="w-full px-2 py-1 border text-xs rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="Add description"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

// Standard view gallery image component
function StandardGalleryImage({ 
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: galleryImage.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow ${isCover ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="cursor-move flex items-center justify-between p-3 border-b dark:border-gray-700" {...attributes} {...listeners}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="18" r="1"/>
            <circle cx="16" cy="6" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="16" cy="18" r="1"/>
          </svg>
          <span className="ml-2 font-medium">{galleryImage.image.title}</span>
        </div>
        <div className="text-sm text-gray-500">#{galleryImage.order}</div>
      </div>

      <div className="aspect-square relative">
        <Image
          src={galleryImage.image.url}
          alt={galleryImage.image.title}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={galleryImage.description || ''}
            onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="Add a description for this image"
            rows={2}
          />
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {galleryImage.image.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
            >
              {tag.name}
            </span>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button" 
            onClick={() => setCoverImage(galleryImage.image.id)}
            className={`flex-1 py-2 text-sm rounded-md ${isCover 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50'}`}
          >
            {isCover ? 'Cover Image ✓' : 'Set as Cover'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemoveImage(galleryImage.id);
            }}
            className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Grid view gallery image component (minimal with large image)
function GridGalleryImage({ 
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: galleryImage.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow ${isCover ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="relative aspect-square group">
        <Image
          src={galleryImage.image.url}
          alt={galleryImage.image.title}
          fill
          className="object-cover rounded-t-lg"
        />
        
        <div className="absolute top-2 right-2 flex space-x-1">
          {isCover && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Cover
            </div>
          )}
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            #{galleryImage.order}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="p-2 flex space-x-2">
            <button 
              type="button"
              onClick={() => setCoverImage(galleryImage.image.id)}
              className={`p-2 rounded-full ${isCover ? 'bg-blue-500 text-white' : 'bg-white/80 hover:bg-blue-500 hover:text-white'}`}
              title={isCover ? 'Cover Image' : 'Set as Cover'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              type="button"
              {...attributes} {...listeners}
              className="p-2 rounded-full bg-white/80 hover:bg-yellow-500 hover:text-white"
              title="Drag to reorder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onRemoveImage(galleryImage.id);
              }}
              className="p-2 rounded-full bg-white/80 hover:bg-red-500 hover:text-white"
              title="Remove from gallery"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm truncate mb-1" title={galleryImage.image.title}>
          {galleryImage.image.title}
        </h3>
        <textarea
          value={galleryImage.description || ''}
          onChange={(e) => onDescriptionChange(galleryImage.id, e.target.value)}
          className="w-full px-2 py-1 border text-xs rounded-md dark:bg-gray-700 dark:border-gray-600"
          placeholder="Add description"
          rows={2}
        />
      </div>
    </div>
  );
}

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  
  // State management for gallery data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageId, setCoverImageId] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteGalleryDialog, setShowDeleteGalleryDialog] = useState(false);
  // View mode state for card display preferences
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Compact);
  
  // State for drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeImage = activeId ? images.find(img => img.id === activeId) : null;
  
  // Use our custom hooks for data fetching and submission
  const router = useRouter();
  const { fetchApi, isLoading: isFetching, error: fetchError } = useFetch();
  
  const { 
    isSubmitting,
    error: submitError, 
    handleSubmit: submitGalleryUpdate,
    reset: resetSubmitState
  } = useSubmit(async () => {
    // Prepare the image order and descriptions data
    const imageUpdates = images.map((img, index) => {
      // For temp images, include the real imageId property
      if (img.id.startsWith('temp-')) {
        return {
          id: img.id,
          imageId: img.imageId, // Include the real image ID for temp images
          description: img.description,
          order: index
        };
      }
      
      // For existing images, just include the regular properties
      return {
        id: img.id,
        description: img.description,
        order: index
      };
    });
    
    await fetchApi(`/api/galleries/${galleryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        isPublic,
        coverImageId: coverImageId || null,
        images: imageUpdates
      }),
    });
    
    setHasUnsavedChanges(false);
    return "Gallery updated successfully!";
  });
  
  // Delete gallery handler
  const { 
    handleSubmit: handleDeleteGallery, 
    isSubmitting: isDeleting, 
    error: deleteError 
  } = useSubmit(async () => {
    await fetchApi(`/api/galleries/${galleryId}`, { method: 'DELETE' });
    router.push('/galleries');
    router.refresh();
  });
  
  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
  const { 
    data: gallery,
    error: galleryError,
    run: fetchGallery
  } = useAsync<Gallery>();
  
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await fetchApi<Gallery>(`/api/galleries/${galleryId}`);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublic(data.isPublic);
        setCoverImageId(data.coverImageId || '');
        // Ensure images state is updated with the latest data
        setImages(data.images);
        return data;
      } catch (error) {
        logger.error('Error fetching gallery:', error);
        throw error;
      }
    };
    
    fetchGallery(loadGallery());
  }, [galleryId, fetchApi, fetchGallery]);

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
      setImages(prevImages => prevImages.filter(img => img.id !== imageToRemove));
      setHasUnsavedChanges(true);
    }
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
  }, [imageToRemove]);

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
    
    try {
      const message = await submitGalleryUpdate(e);
      setSuccessMessage(message as string);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch {
      // Error is already handled by the useSubmit hook
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/galleries/${galleryId}`);
    }
  };

  // Add image information to local gallery state
  const addImagesToGallery = useCallback(async (imageIds: string[]) => {
    // Only proceed if we have image IDs to add
    if (!imageIds?.length) return;
    
    // Load all images to make sure we have access to the ones being added
    try {
      // Define a proper interface for the image type
      interface ImageInfo {
        id: string;
        url: string;
        title: string;
        tags: Tag[];
      }
      
      const allImages = await fetchApi<ImageInfo[]>('/api/images');
      
      // Create a map of all available images
      const availableImagesMap = new Map<string, ImageInfo>();
      allImages.forEach(img => {
        availableImagesMap.set(img.id, {
          id: img.id,
          url: img.url,
          title: img.title,
          tags: img.tags || []
        });
      });
      
      // Get all images that aren't already in the gallery
      const newImageIds = imageIds.filter(id => 
        !images.some(img => img.image.id === id)
      );
      
      if (!newImageIds.length) {
        setToastMessage("These images are already in the gallery");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return;
      }
      
      // Find the highest order value
      const maxOrder = images.length > 0
        ? Math.max(...images.map(img => img.order))
        : -1;
      
      // Create new temp images for the UI
      const newImages = newImageIds.map((id, index) => {
        const imageInfo = availableImagesMap.get(id);
        
        // If we don't have the image information, log a warning
        if (!imageInfo) {
          logger.warn(`Image with ID ${id} not found in available images`);
          return null;
        }
        
        // Create a temporary ID for the gallery image that includes the real image ID
        return {
          id: `temp-${Date.now()}-${index}`,
          description: null,
          order: maxOrder + index + 1,
          image: imageInfo,
          // Store the real image ID for when we save
          imageId: id
        };
      }).filter(Boolean) as GalleryImage[];
      
      // Add the new images to the state
      setImages(prev => [...prev, ...newImages]);
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
      
      // Show success toast
      setToastMessage(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} to gallery`);
      setShowSuccessToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    } catch (err) {
      logger.error("Error adding images to gallery:", err);
      setToastMessage("Error adding images to gallery");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  }, [images, fetchApi]);

  // Render loading state
  if (isFetching && !gallery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="large" text="Loading gallery..." />
      </div>
    );
  }

  // Render error state if we couldn't load the gallery
  if ((galleryError || fetchError) && !gallery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={galleryError || fetchError} 
          retry={() => fetchGallery(fetchApi<Gallery>(`/api/galleries/${galleryId}`))}
          className="mb-4"
        />
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
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Galleries', href: '/galleries' },
            { label: gallery?.title || 'Gallery', href: `/galleries/${galleryId}` },
            { label: 'Edit', href: `/galleries/${galleryId}/edit` },
          ]}
        />
        
        <h1 className="text-2xl font-bold mb-6">Edit Gallery</h1>
        
        {submitError && (
          <ErrorMessage 
            error={submitError} 
            retry={() => resetSubmitState()}
            className="mb-4"
          />
        )}
        
        {successMessage && (
          <SuccessMessage
            message={successMessage}
            className="mb-4"
            onDismiss={() => setSuccessMessage(null)}
          />
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
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag and drop to reorder images. You can also set a cover image and edit descriptions.
              </p>
              
              <div className="flex rounded-md shadow-sm p-0.5 bg-gray-100 dark:bg-gray-700">
                <button
                  type="button"
                  onClick={() => setViewMode(ViewMode.Compact)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === ViewMode.Compact
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                  title="Compact view"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(ViewMode.Standard)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === ViewMode.Standard
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                  title="Standard view"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(ViewMode.Grid)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === ViewMode.Grid
                      ? 'bg-white dark:bg-gray-600 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                  title="Grid view"
                >
                  Grid
                </button>
              </div>
            </div>
            
            {images.length === 0 ? (
              <EmptyState
                title="This gallery has no images"
                description="Click the 'Add Images' button to add some."
              />
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
                  <div className={`grid gap-3 ${
                    viewMode === ViewMode.Compact 
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                      : viewMode === ViewMode.Standard
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}>
                    {images.map((galleryImage) => {
                      switch (viewMode) {
                        case ViewMode.Standard:
                          return (
                            <StandardGalleryImage
                              key={galleryImage.id}
                              galleryImage={galleryImage}
                              isCover={coverImageId === galleryImage.image.id}
                              onDescriptionChange={handleImageDescriptionChange}
                              setCoverImage={setCoverImageId}
                              onRemoveImage={handleRemoveImage}
                            />
                          );
                        case ViewMode.Grid:
                          return (
                            <GridGalleryImage
                              key={galleryImage.id}
                              galleryImage={galleryImage}
                              isCover={coverImageId === galleryImage.image.id}
                              onDescriptionChange={handleImageDescriptionChange}
                              setCoverImage={setCoverImageId}
                              onRemoveImage={handleRemoveImage}
                            />
                          );
                        default:
                          return (
                            <SortableGalleryImage
                              key={galleryImage.id}
                              galleryImage={galleryImage}
                              isCover={coverImageId === galleryImage.image.id}
                              onDescriptionChange={handleImageDescriptionChange}
                              setCoverImage={setCoverImageId}
                              onRemoveImage={handleRemoveImage}
                            />
                          );
                      }
                    })}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeImage ? <DragOverlayCard image={activeImage} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Once you delete a gallery, there is no going back. Please be certain.
            </p>
            
            {deleteError && (
              <ErrorMessage error={deleteError} className="mb-4" />
            )}
            
            <button
              type="button"
              onClick={() => setShowDeleteGalleryDialog(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Gallery"}
            </button>
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
          onImagesSelected={(addedImageIds) => {
            setShowSelectImagesDialog(false);
            addImagesToGallery(addedImageIds);
          }}
          existingImageIds={images.map(img => img.image.id)}
        />

        {/* Delete gallery confirmation dialog */}
        <ConfirmDialog
          isOpen={showDeleteGalleryDialog}
          onClose={() => setShowDeleteGalleryDialog(false)}
          onConfirm={() => handleDeleteGallery(undefined)}
          title="Delete Gallery"
          message={
            <div>
              <p className="mb-2">Are you sure you want to delete this gallery?</p>
              <p className="text-red-500 font-semibold">This action cannot be undone.</p>
              {images.length > 0 && (
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

        {/* Toast notification for successful image addition */}
        {showSuccessToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center animate-fade-in-up z-50">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
