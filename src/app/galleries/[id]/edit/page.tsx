'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '@/components/StatusMessages';
import { useApi } from '@/lib/hooks/useApi';
import { deepEqual } from '@/lib/deepEqual';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use } from 'react';
import logger from '@/lib/logger';
import { z } from 'zod';
import { FullGallerySchema, ImageSchema, ImageInGallerySchema, CreateGallerySchema } from '@/lib/schemas';

// Define types from schemas instead of importing from types.ts
type FullGallery = z.infer<typeof FullGallerySchema>;
type Image = z.infer<typeof ImageSchema>;
type ImageInGallery = z.infer<typeof ImageInGallerySchema>;
type GalleryFormData = z.infer<typeof CreateGallerySchema>;

// Define a compatibility type for the GallerySortable component
type FullImageInGallery = ImageInGallery & {
  image: Image & { tags?: { id: string; name: string }[] };
};

// Import components
import { GalleryDetailsFormWithZod } from '@/components/GalleryDetailsFormWithZod';
import { GalleryViewSelector } from '@/components/GalleryViewSelector';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';

/**
 * Simplified Gallery Edit Page
 * This component has been refactored to solve the infinite loop issue
 * by centralizing state management and ensuring proper dependency handling
 */
export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  const router = useRouter();
  
  // API client for data fetching
  const galleryApi = useApi(FullGallerySchema);
  
  // Main state
  const [galleryData, setGalleryData] = useState<FullGallery | null>(null);
  const [originalGalleryData, setOriginalGalleryData] = useState<FullGallery | null>(null);
  const [images, setImages] = useState<FullImageInGallery[]>([]);
  const [coverImageId, setCoverImageId] = useState<string | ''>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); 
  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Note: These variables are used in the UI but handlers not yet implemented
  // They're kept for compatibility with existing UI elements
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDeleteGalleryDialog, setShowDeleteGalleryDialog] = useState(false);
  const [isDeleting] = useState(false);
  const [deleteError] = useState<Error | null>(null);

  // Set up react-hook-form with zod validation
  // TypeScript doesn't correctly infer all the properties from useForm with zod,
  // so we need type assertions to avoid errors with form properties
  const form = useForm<GalleryFormData>({
    resolver: zodResolver(CreateGallerySchema),
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
      themeColor: '',
      backgroundColor: '',
      backgroundImageUrl: '',
      accentColor: '',
      fontFamily: '',
      displayMode: '',
      layoutType: ''
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any; // Type assertion needed for compatibility with zod schema types

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset: resetForm,
    watch
  } = form;

  // Run form validation
  watch();

  // Load gallery data when the gallery ID changes
  useEffect(() => {
    if (!galleryId) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    galleryApi.fetch(`/api/galleries/${galleryId}`)
      .then(result => {
        if (!result.success || !result.data) {
          throw new Error("Failed to load gallery data");
        }
        
        const data = result.data;
        
        // Update form with gallery data
        resetForm({
          title: data.title,
          description: data.description || '',
          isPublic: data.isPublic,
          themeColor: data.themeColor || '',
          backgroundColor: data.backgroundColor || '',
          backgroundImageUrl: data.backgroundImageUrl || '',
          accentColor: data.accentColor || '',
          fontFamily: data.fontFamily || '',
          displayMode: data.displayMode || '',
          layoutType: data.layoutType || '',
        });
        
        setCoverImageId(data.coverImageId || '');
        setGalleryData(data);
        setOriginalGalleryData(data);
        
        // Update images - this is safe because setImages isn't in dependencies
        setImages(data.images);
      })
      .catch(error => {
        logger.error('Error fetching gallery:', error);
        setLoadError(error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]); 
  /* IMPORTANT: We intentionally leave out galleryApi, setImages, resetForm, etc. from dependencies
   * to prevent infinite rerenders because those functions are called inside the effect.
   * Including galleryApi would create a dependency cycle since its fetch method
   * gets a new reference on each render even though its behavior remains the same.
   */

  // Update hasUnsavedChanges whenever relevant state changes
  useEffect(() => {
    if (!originalGalleryData) return;
    
    const formIsDirty = isDirty;
    const imagesChanged = !deepEqual(images, originalGalleryData.images);
    const coverImageChanged = coverImageId !== (originalGalleryData.coverImageId || '');
    
    setHasUnsavedChanges(formIsDirty || imagesChanged || coverImageChanged);
  }, [originalGalleryData, isDirty, images, coverImageId]);

  // Image management functions
  const handleImageDescriptionChange = useCallback((id: string, newDescription: string) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, description: newDescription } : img
    ));
  }, []);
  
  const handleRemoveImage = useCallback((id: string) => {
    setImageToRemove(id);
    setShowRemoveImageDialog(true);
  }, []);
  
  const confirmRemoveImage = useCallback(async () => {
    if (!galleryId || !imageToRemove) {
      setShowRemoveImageDialog(false);
      setImageToRemove(null);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Import the GalleryService for accessing the removeImage method
      const { GalleryService } = await import('@/lib/services/galleryService');
      
      // Use GalleryService.removeImage to update the gallery on the server
      const updatedGallery = await GalleryService.removeImage(galleryId, imageToRemove);
      
      // Update the local state with the response from the server
      setImages(updatedGallery.images);
      
      // If the cover image was removed, update the cover image ID
      if (updatedGallery.coverImageId !== coverImageId) {
        setCoverImageId(updatedGallery.coverImageId || '');
      }
      
      // Update the original gallery data to reflect these changes
      setOriginalGalleryData(updatedGallery);
      setGalleryData(updatedGallery);
      
      // Set a success message
      setToastMessage('Image removed from gallery');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      logger.error("Error removing image:", err);
      
      // Show error toast
      setToastMessage(`Error removing image: ${err instanceof Error ? err.message : String(err)}`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsLoading(false);
      setShowRemoveImageDialog(false);
      setImageToRemove(null);
    }
  }, [imageToRemove, coverImageId, galleryId]);
  
  const cancelRemoveImage = useCallback(() => {
    setShowRemoveImageDialog(false);
    setImageToRemove(null);
  }, []);

  // Handle adding images to the gallery
  const handleAddImages = async (imageIds: string[]) => {
    if (!galleryId || imageIds.length === 0) return;
    
    try {
      const result = await galleryApi.fetch(`/api/galleries/${galleryId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });
      
      if (result.success && result.data) {
        // Add the new images to the state
        setImages(result.data.images);
        
        // Show success toast
        setToastMessage(`Added ${imageIds.length} image${imageIds.length > 1 ? 's' : ''} to gallery`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      logger.error("Error adding images:", err);
      setSubmitError(err instanceof Error ? err : new Error(String(err)));
      
      // Show error toast
      setToastMessage(`Error adding images: ${err instanceof Error ? err.message : String(err)}`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  // Handle form submission
  const onSubmit = async (formData: GalleryFormData) => {
    if (!galleryId) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Ensure all images have valid order values
      const updatedImages = images.map((img, index) => {
        const orderValue = typeof img.order === 'number' && Number.isInteger(img.order) && img.order >= 0 
          ? img.order 
          : index;
        
        return { 
          id: img.id,
          ...(img.imageId ? { imageId: img.imageId } : {}),
          description: img.description,
          order: orderValue,
        };
      });
      
      const payload = {
        id: galleryId,
        ...formData,
        coverImageId: coverImageId || null,
        images: updatedImages
      };
      
      // Update the gallery using the API
      const result = await galleryApi.fetch(`/api/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (result.success && result.data) {
        // Update all state with the new data from the server
        setOriginalGalleryData(result.data);
        setGalleryData(result.data);
        
        // This is safe since it's in response to user action
        setImages(result.data.images);
        
        setSuccessMessage("Gallery updated successfully");
        setHasUnsavedChanges(false);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error("Failed to update gallery");
      }
    } catch (err) {
      logger.error("Error updating gallery:", err);
      setSubmitError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  // Navigation and state reset
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/galleries/${galleryId}`);
    }
  };

  const handleDiscardChanges = () => {
    if (originalGalleryData) {
      // Reset form to original values
      resetForm({
        title: originalGalleryData.title,
        description: originalGalleryData.description || '',
        isPublic: originalGalleryData.isPublic,
        themeColor: originalGalleryData.themeColor || '',
        backgroundColor: originalGalleryData.backgroundColor || '',
        backgroundImageUrl: originalGalleryData.backgroundImageUrl || '',
        accentColor: originalGalleryData.accentColor || '',
        fontFamily: originalGalleryData.fontFamily || '',
        displayMode: originalGalleryData.displayMode || '',
        layoutType: originalGalleryData.layoutType || '',
      });
      
      // Reset other state to original values
      setCoverImageId(originalGalleryData.coverImageId || '');
      
      // This is safe as it's a user-triggered action
      setImages(originalGalleryData.images);
      
      setShowConfirmDialog(false);
      setHasUnsavedChanges(false);
      setSuccessMessage("Changes discarded");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle loading state
  if (isLoading && !galleryData) {
    return <LoadingSpinner size="large" text="Loading gallery..." />;
  }

  // Handle error state
  if (loadError && !galleryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={loadError} 
          retry={() => {
            // Re-trigger the load by resetting state
            setIsLoading(true);
            setLoadError(null);
            galleryApi.fetch(`/api/galleries/${galleryId}`)
              .then(result => {
                if (!result.success || !result.data) throw new Error("Failed to load gallery");
                setGalleryData(result.data);
                setOriginalGalleryData(result.data);
                setImages(result.data.images);
                resetForm({
                  title: result.data.title,
                  description: result.data.description || '',
                  isPublic: result.data.isPublic,
                  themeColor: result.data.themeColor || '',
                  backgroundColor: result.data.backgroundColor || '',
                  backgroundImageUrl: result.data.backgroundImageUrl || '',
                  accentColor: result.data.accentColor || '',
                  fontFamily: result.data.fontFamily || '',
                  displayMode: result.data.displayMode || '',
                  layoutType: result.data.layoutType || '',
                });
                setCoverImageId(result.data.coverImageId || '');
              })
              .catch(err => {
                setLoadError(err instanceof Error ? err : new Error(String(err)));
              })
              .finally(() => {
                setIsLoading(false);
              });
          }}
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

  // Handle empty state
  if (!galleryData && !isLoading && !loadError) {
    return <div className="container mx-auto px-4 py-8">Gallery not found or failed to load.</div>;
  }

  // Render the form
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Galleries', href: '/galleries' },
            { label: galleryData?.title || 'Gallery', href: `/galleries/${galleryId}` },
            { label: 'Edit', href: `/galleries/${galleryId}/edit` },
          ]}
        />
        
        <h1 className="text-2xl font-bold mb-6">Edit Gallery: {galleryData?.title}</h1>
        
        {submitError && (
          <ErrorMessage 
            error={submitError} 
            retry={() => setSubmitError(null)} 
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Gallery details form */}
          <GalleryDetailsFormWithZod
            register={register}
            errors={errors}
            control={control}
          />
          
          {/* Images section */}
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
              <GalleryViewSelector viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            
            <GallerySortable 
              galleryImages={images
                .filter(img => img.image !== undefined)
                .map(img => ({
                  ...img,
                  image: {
                    ...img.image,
                    // Ensure tags is always an array, never undefined
                    tags: img.image.tags || []
                  }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                })) as any
              }
              coverImageId={coverImageId}
              viewMode={viewMode} 
              onImagesReordered={setImages} 
              onDescriptionChange={handleImageDescriptionChange} 
              onSetCoverImage={setCoverImageId}
              onRemoveImage={handleRemoveImage} 
            />
          </div>
          
          {/* Danger zone */}
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
              disabled={isDeleting || isSubmitting} 
            >
              {isDeleting ? "Deleting..." : "Delete Gallery"}
            </button>
          </div>
          
          {/* Form buttons */}
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
              type="submit" 
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
          onConfirm={() => {
            // Wrap in a function to match ConfirmDialog's expected onConfirm type
            const e = new Event('submit') as unknown as React.FormEvent<Element>;
            handleSubmit(onSubmit)(e);
          }}
          onCancel={() => handleDiscardChanges()}
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
          message="Are you sure you want to remove this image from the gallery?"
          confirmButtonText="Remove"
          cancelButtonText="Cancel"
        />
        
        {showSelectImagesDialog && (
          <SelectImagesDialog
            isOpen={showSelectImagesDialog}
            onClose={() => setShowSelectImagesDialog(false)}
            onImagesSelected={handleAddImages}
            existingImageIds={images.map(img => img.imageId).filter(Boolean) as string[]}
          />
        )}
        
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
