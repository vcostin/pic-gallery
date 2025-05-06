'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '@/components/StatusMessages';
import { useAsync, useFetch, useSubmit, useGalleryImages } from '@/lib/hooks';
import { deepEqual } from '@/lib/deepEqual';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use } from 'react';
import logger from '@/lib/logger';
import { PaginatedResponse, Image as ApiImageType } from '@/lib/types'; // Added PaginatedResponse and ApiImageType

// Import newly created components
import { GalleryDetailsForm } from '@/components/GalleryDetailsForm';
import { GalleryViewSelector } from '@/components/GalleryViewSelector';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';

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
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for filtering images within the gallery editor
  const [galleryImageSearchQuery, setGalleryImageSearchQuery] = useState('');
  const [galleryImageTag, setGalleryImageTag] = useState('');
  const [galleryFilterDebounceTimeout, setGalleryFilterDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Store original gallery data for deep comparison
  const [originalGalleryData, setOriginalGalleryData] = useState<{
    title: string;
    description: string;
    isPublic: boolean;
    coverImageId: string;
    images: GalleryImage[];
  } | null>(null);
  
  // Use our custom hook for gallery images
  const {
    images,
    setImages,
    showRemoveImageDialog,
    showSuccessToast,
    toastMessage,
    handleImageDescriptionChange,
    handleRemoveImage,
    confirmRemoveImage,
    cancelRemoveImage,
    addImagesToGallery
  } = useGalleryImages();
  
  // Router and API hooks
  const router = useRouter();
  const { fetchApi, isLoading: isFetching, error: fetchError } = useFetch();

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
    
    // Update the gallery on the server
    const updatedGallery = await fetchApi<Gallery>(`/api/galleries/${galleryId}`, {
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
    
    // Update state with the data returned directly from the PATCH response
    setTitle(updatedGallery.title);
    setDescription(updatedGallery.description || '');
    setIsPublic(updatedGallery.isPublic);
    setCoverImageId(updatedGallery.coverImageId || '');
    setImages(updatedGallery.images);
    
    // Update original gallery data with the data received from the server
    setOriginalGalleryData({
      title: updatedGallery.title,
      description: updatedGallery.description || '',
      isPublic: updatedGallery.isPublic,
      coverImageId: updatedGallery.coverImageId || '',
      images: updatedGallery.images
    });
    
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
  
  // Load gallery data on component mount and when filters change
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (galleryImageSearchQuery) {
          queryParams.set('imageSearchQuery', galleryImageSearchQuery);
        }
        if (galleryImageTag) {
          queryParams.set('imageTag', galleryImageTag);
        }
        const queryString = queryParams.toString();
        const apiUrl = `/api/galleries/${galleryId}${queryString ? `?${queryString}` : ''}`;

        const data = await fetchApi<Gallery>(apiUrl);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublic(data.isPublic);
        setCoverImageId(data.coverImageId || '');
        setImages(data.images); // These images are now filtered by the backend
        
        // Only set originalGalleryData on the initial load (no filters)
        if (!galleryImageSearchQuery && !galleryImageTag && !originalGalleryData) {
          setOriginalGalleryData({
            title: data.title,
            description: data.description || '',
            isPublic: data.isPublic,
            coverImageId: data.coverImageId || '',
            images: data.images // Store the initial, unfiltered images here
          });
        }
        return data;
      } catch (error) {
        logger.error('Error fetching gallery:', error);
        throw error;
      }
    };
    
    if (galleryFilterDebounceTimeout) {
      clearTimeout(galleryFilterDebounceTimeout);
    }

    const timeoutId = setTimeout(() => {
        fetchGallery(loadGallery());
    }, 500); // 500ms debounce

    setGalleryFilterDebounceTimeout(timeoutId);

    return () => {
        if (galleryFilterDebounceTimeout) {
            clearTimeout(galleryFilterDebounceTimeout);
        }
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId, fetchApi, fetchGallery, setImages, galleryImageSearchQuery, galleryImageTag]); // Add filter states to dependencies

  // Track unsaved changes
  useEffect(() => {
    if (!originalGalleryData) return;
    
    const currentData = {
      title,
      description,
      isPublic,
      coverImageId: coverImageId || '',
      images
    };
    
    setHasUnsavedChanges(!deepEqual(currentData, originalGalleryData));
  }, [originalGalleryData, title, description, isPublic, coverImageId, images]);

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

  // New function to handle discarding changes
  const handleDiscardChanges = () => {
    // Only reset if we have original data
    if (originalGalleryData) {
      // Reset all form fields to original values
      setTitle(originalGalleryData.title);
      setDescription(originalGalleryData.description);
      setIsPublic(originalGalleryData.isPublic);
      setCoverImageId(originalGalleryData.coverImageId);
      setImages(originalGalleryData.images);
      
      // Close the dialog
      setShowConfirmDialog(false);
      
      // Show feedback to the user
      setSuccessMessage("Changes discarded");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handler to add images to the gallery
  const handleAddImages = useCallback((imageIds: string[]) => {
    setShowSelectImagesDialog(false);
    
    const fetchImagesForGallery = async (): Promise<Array<{id: string; [key: string]: unknown}>> => {
      // Adjust limit to be within the API's accepted range (max 100)
      // This will fetch up to 100 images. If more images exist, pagination would be needed in SelectImagesDialog.
      const response = await fetchApi<PaginatedResponse<ApiImageType>>('/api/images?limit=100&page=1');
      
      // Add a guard to ensure the response is correctly structured
      if (response && typeof response === 'object' && Array.isArray(response.data)) {
        // Cast ApiImageType[] to Array<{id: string; [key: string]: unknown}> to satisfy the hook
        return response.data.map(image => ({ ...image, id: image.id } as {id: string; [key: string]: unknown}));
      }
      
      // Log an error and throw if the response format is unexpected
      logger.error(
        'fetchImagesForGallery: Unexpected response from fetchApi for /api/images. Expected PaginatedResponse.',
        response
      );
      throw new Error('Failed to fetch images due to unexpected API response format.');
    };
    
    addImagesToGallery(imageIds, fetchImagesForGallery);
  }, [fetchApi, addImagesToGallery]);

  // Handle image reordering from GallerySortable
  const handleImagesReordered = useCallback((reorderedImages: GalleryImage[]) => {
    setImages(reorderedImages);
  }, [setImages]);

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

            {/* Filter inputs for images within the gallery */}
            <div className="mb-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-700/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="galleryImageSearchQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Images in Gallery
                  </label>
                  <input
                    type="text"
                    id="galleryImageSearchQuery"
                    value={galleryImageSearchQuery}
                    onChange={(e) => setGalleryImageSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Filter by title/description..."
                  />
                </div>
                <div>
                  <label htmlFor="galleryImageTag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Filter by Tag in Gallery
                  </label>
                  <input
                    type="text"
                    id="galleryImageTag"
                    value={galleryImageTag}
                    onChange={(e) => setGalleryImageTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Filter by tag..."
                  />
                </div>
              </div>
            </div>
            
            {/* New GallerySortable Component */}
            <GallerySortable 
              galleryImages={images}
              coverImageId={coverImageId}
              viewMode={viewMode}
              onImagesReordered={handleImagesReordered}
              onDescriptionChange={handleImageDescriptionChange}
              onSetCoverImage={setCoverImageId}
              onRemoveImage={handleRemoveImage}
            />
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
          onCancel={handleDiscardChanges}
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
