'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DndContext, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  CollisionDetection,
  rectIntersection,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage, EmptyState } from '@/components/StatusMessages';
import { useAsync, useFetch, useSubmit, useGalleryImages } from '@/lib/hooks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use } from 'react';
import logger from '@/lib/logger';

// Import newly created components
import { CompactGalleryCard, StandardGalleryCard, GridGalleryCard, DragOverlayCard } from '@/components/GalleryImageCards';
import { GalleryDetailsForm } from '@/components/GalleryDetailsForm';
import { GalleryViewSelector, ViewMode } from '@/components/GalleryViewSelector';

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
  imageId?: string;
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

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  
  // Basic gallery state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageId, setCoverImageId] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [showDeleteGalleryDialog, setShowDeleteGalleryDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Compact);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Use our custom hook for gallery images
  const {
    images,
    setImages,
    activeImage,
    showRemoveImageDialog,
    showSuccessToast,
    toastMessage,
    handleImageDescriptionChange,
    handleRemoveImage,
    confirmRemoveImage,
    cancelRemoveImage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    addImagesToGallery
  } = useGalleryImages();
  
  // Router and API hooks
  const router = useRouter();
  const { fetchApi, isLoading: isFetching, error: fetchError } = useFetch();
  
  // Add state for active dragging
  const [isDragging, setIsDragging] = useState(false);
  
  // Configure the sensors for drag and drop with improved sensitivity
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

  // Add a collision detection function with memory for better dragging experience
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      // First, find all intersections
      const intersections = rectIntersection(args);
      
      if (!intersections.length) {
        return intersections;
      }

      // Just return intersections without state updates during render
      return intersections;
    },
    []
  );

  // Use an effect to safely manage state updates related to dragging
  useEffect(() => {
    // This is safe as it's in a useEffect, not during render
  }, [isDragging]);

  // Enhanced drag handlers
  const enhancedDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
    handleDragStart(event);
  }, [handleDragStart]);

  // Remove the unused parameter by using _event to indicate it's intentionally unused
  const enhancedDragOver = useCallback((_event: DragOverEvent) => {
    // Safe to update state here as this is an event handler, not during render
    // No need to track the over ID if we're not using it
  }, []);

  const enhancedDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    const didChange = handleDragEnd(event);
    if (didChange) {
      setHasUnsavedChanges(true);
    }
  }, [handleDragEnd, setHasUnsavedChanges]);

  const enhancedDragCancel = useCallback(() => {
    setIsDragging(false);
    handleDragCancel();
  }, [handleDragCancel]);

  // Gallery update submission handler
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
      headers: { 'Content-Type': 'application/json' },
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
  
  // Fetch the gallery data
  const { 
    data: gallery,
    error: galleryError,
    run: fetchGallery
  } = useAsync<Gallery>();
  
  // Load gallery data on component mount
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await fetchApi<Gallery>(`/api/galleries/${galleryId}`);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublic(data.isPublic);
        setCoverImageId(data.coverImageId || '');
        setImages(data.images);
        return data;
      } catch (error) {
        logger.error('Error fetching gallery:', error);
        throw error;
      }
    };
    
    fetchGallery(loadGallery());
  }, [galleryId, fetchApi, fetchGallery, setImages]);

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

  // Cancel edit handler
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/galleries/${galleryId}`);
    }
  };

  // Handler to add images to the gallery
  const handleAddImages = useCallback((imageIds: string[]) => {
    setShowSelectImagesDialog(false);
    
    // Add proper type annotation to match the expected type in addImagesToGallery
    const fetchImagesForGallery = async (): Promise<Array<{id: string; [key: string]: unknown}>> => {
      return await fetchApi<Array<{id: string; [key: string]: unknown}>>('/api/images');
    };
    
    addImagesToGallery(imageIds, fetchImagesForGallery)
      .then(changed => {
        if (changed) {
          setHasUnsavedChanges(true);
        }
      });
  }, [fetchApi, addImagesToGallery]);

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
          {/* Gallery Details Section */}
          <GalleryDetailsForm 
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
          />
          
          {/* Images Section */}
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
              
              {/* View Mode Selector Component */}
              <GalleryViewSelector viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            
            {images.length === 0 ? (
              <EmptyState
                title="This gallery has no images"
                description="Click the 'Add Images' button to add some."
              />
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={enhancedDragStart}
                onDragOver={enhancedDragOver}
                onDragEnd={enhancedDragEnd}
                onDragCancel={enhancedDragCancel}
                measuring={{
                  droppable: {
                    strategy: MeasuringStrategy.Always
                  }
                }}
              >
                <SortableContext 
                  items={images.map(img => img.id)}
                  strategy={viewMode === ViewMode.Compact ? rectSortingStrategy : viewMode === ViewMode.Grid ? rectSortingStrategy : verticalListSortingStrategy}
                >
                  <div 
                    className={`grid gap-3 ${
                      viewMode === ViewMode.Compact 
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                        : viewMode === ViewMode.Standard
                          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    } ${isDragging ? 'drop-shadow-md' : ''}`}
                  >
                    {images.map((galleryImage) => {
                      // Extract the key and create a separate props object without the key
                      const componentProps = {
                        galleryImage,
                        isCover: coverImageId === galleryImage.image.id,
                        onDescriptionChange: handleImageDescriptionChange,
                        setCoverImage: setCoverImageId,
                        onRemoveImage: handleRemoveImage
                      };

                      switch (viewMode) {
                        case ViewMode.Standard:
                          return <StandardGalleryCard key={galleryImage.id} {...componentProps} />;
                        case ViewMode.Grid:
                          return <GridGalleryCard key={galleryImage.id} {...componentProps} />;
                        default:
                          return <CompactGalleryCard key={galleryImage.id} {...componentProps} />;
                      }
                    })}
                  </div>
                </SortableContext>
                
                <DragOverlay adjustScale={true} dropAnimation={{
                  duration: 300,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                  {activeImage ? <DragOverlayCard image={activeImage} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* Danger Zone */}
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
          
          {/* Form Buttons */}
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
        
        {/* Dialogs */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
          title="Save Changes?"
          message="You have unsaved changes. Do you want to save them before leaving?"
          confirmButtonText="Save Changes"
          cancelButtonText="Discard"
        />
        
        <ConfirmDialog
          isOpen={showRemoveImageDialog}
          onClose={cancelRemoveImage}
          onConfirm={confirmRemoveImage}
          title="Remove Image"
          message="Are you sure you want to remove this image from the gallery? This action cannot be undone."
          confirmButtonText="Remove"
          cancelButtonText="Cancel"
          confirmButtonColor="red"
        />
        
        <SelectImagesDialog
          isOpen={showSelectImagesDialog}
          onClose={() => setShowSelectImagesDialog(false)}
          galleryId={galleryId}
          onImagesSelected={handleAddImages}
          existingImageIds={images.map(img => img.image.id)}
        />

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

        {/* Toast notification */}
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
