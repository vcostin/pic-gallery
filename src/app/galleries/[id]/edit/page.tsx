'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '@/components/StatusMessages';
import { useApi } from '@/lib/hooks/useApi';
import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use } from 'react';
import logger from '@/lib/logger';
// Import schemas for validation
import { FullGallerySchema, FullGallery } from '@/lib/schemas'; 

// Import gallery components from feature directory
import { GalleryDetailsForm } from '@/components/GalleryDetails';
import { GalleryViewSelector } from '@/components/GalleryViewSelector';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';

// Import our custom form hook
import { useGalleryEditForm } from '@/lib/hooks/useGalleryEditForm';

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  
  // API hook for performing gallery deletions
  const { fetch: deleteGallery } = useApi(z.object({ message: z.string() })); 
  
  const { 
    images, 
    setImages, 
    addImages, 
    handleRemoveImage, 
    handleImageDescriptionChange, 
    showRemoveImageDialog, 
    confirmRemoveImage,    
    cancelRemoveImage,     
    showSuccessToast,      
    toastMessage           
  } = useEnhancedGalleryImages(galleryId);

  const { fetch: fetchGalleryAsync, isLoading: galleryIsLoading, error: galleryError, data: galleryData } = useApi(FullGallerySchema);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); 
  const [showDeleteGalleryDialog, setShowDeleteGalleryDialog] = useState(false); 
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  const [coverImageId, setCoverImageId] = useState<string | ''>('');
  const [originalGalleryData, setOriginalGalleryData] = useState<FullGallery | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const router = useRouter();

  // Set up form with our custom hook
  const {
    reset: resetForm,
    watch,
    isDirty,
    form
  } = useGalleryEditForm();
  
  // Watch form values to detect changes
  const watchedValues = watch();
  
  // Use React Hook Form's built-in dirty state detection
  const hasUnsavedChanges = isDirty;
  
  // Ref to track if initial data has been loaded to prevent infinite loops
  const hasLoadedInitialData = useRef(false);

  // Prepare gallery data for submission
  const prepareGalleryUpdatePayload = () => {
    if (!originalGalleryData) throw new Error("Original gallery data not loaded.");
    
    // Get current form values
    const currentValues = watchedValues;
    
    // Ensure all images have valid order values before sending to backend
    const updatedImages = images.map((img, index) => ({ 
      id: img.id,
      imageId: img.imageId,
      description: img.description,
      order: typeof img.order === 'number' ? img.order : index,
    }));
    
    return {
      id: galleryId,
      title: currentValues.title,
      description: currentValues.description,
      isPublic: currentValues.isPublic,
      coverImageId: coverImageId || null,
      images: updatedImages,
      themeColor: currentValues.themeColor,
      backgroundColor: currentValues.backgroundColor,
      backgroundImageUrl: currentValues.backgroundImageUrl,
      accentColor: currentValues.accentColor,
      fontFamily: currentValues.fontFamily,
      displayMode: currentValues.displayMode,
      layoutType: currentValues.layoutType,
    };
  };
  
  // API hook for updating the gallery with schema validation
  const { fetch: updateGallery, isLoading: isSubmitting, error: submitErrorEncountered, reset: resetSubmitState } = useApi(FullGallerySchema);

  useEffect(() => {
    // Only fetch gallery data once on mount
    if (hasLoadedInitialData.current) return;
    
    const loadGalleryData = async () => {
      try {
        const result = await fetchGalleryAsync(`/api/galleries/${galleryId}`);
        if (result.success && result.data) {
          const data = result.data;
          
          // Set images and cover image
          setImages(data.images); 
          setCoverImageId(data.coverImageId || '');
          
          // Reset the form with the loaded data
          resetForm({
            title: data.title,
            description: data.description || '',
            isPublic: data.isPublic,
            themeColor: data.themeColor || null,
            backgroundColor: data.backgroundColor || null,
            backgroundImageUrl: data.backgroundImageUrl || null,
            accentColor: data.accentColor || null,
            fontFamily: data.fontFamily || null,
            displayMode: data.displayMode || null,
            layoutType: data.layoutType || null,
          });
          
          // Store original data for comparison and restoration
          setOriginalGalleryData(data);
          hasLoadedInitialData.current = true;
        }
      } catch {
        // Error is handled by useApi and useFetch hooks
      }
    };
    
    loadGalleryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]); // Only depend on galleryId to prevent infinite loops

  // Form submission handler using react-hook-form
  const onSubmit = form.handleSubmit(async () => {
    setShowConfirmDialog(false);
    try {
      const payload = prepareGalleryUpdatePayload();
      const result = await updateGallery(`/api/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (result.success && result.data) {
        setOriginalGalleryData(result.data);
        setImages(result.data.images);
        setSuccessMessage("Gallery updated successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      logger.error("Submit error caught in form submission:", err);
    }
  });

  // Helper function for confirming the form submission
  const handleConfirmSubmit = () => {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    onSubmit(event as unknown as React.FormEvent<Element>);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/galleries/${galleryId}`);
    }
  };

  const handleDiscardChanges = () => {
    if (originalGalleryData) {
      // Reset the form to original values using React Hook Form
      resetForm({
        title: originalGalleryData.title,
        description: originalGalleryData.description || '',
        isPublic: originalGalleryData.isPublic,
        themeColor: originalGalleryData.themeColor || null,
        backgroundColor: originalGalleryData.backgroundColor || null,
        backgroundImageUrl: originalGalleryData.backgroundImageUrl || null,
        accentColor: originalGalleryData.accentColor || null,
        fontFamily: originalGalleryData.fontFamily || null,
        displayMode: originalGalleryData.displayMode || null,
        layoutType: originalGalleryData.layoutType || null,
      });
      
      // Reset other state to original values
      setCoverImageId(originalGalleryData.coverImageId || '');
      setImages(originalGalleryData.images);
      
      setShowConfirmDialog(false);
      setSuccessMessage("Changes discarded");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAddImages = useCallback((imageIds: string[]) => {
    setShowSelectImagesDialog(false);
    addImages(imageIds);
  }, [addImages]);

  const handleDeleteGallery = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteGallery(`/api/galleries/${galleryId}`, { method: 'DELETE' });
      if (result.success) {
        setSuccessMessage("Gallery deleted successfully.");
        setTimeout(() => {
          router.push('/galleries'); 
        }, 2000);
      }
    } catch (err) {
      logger.error("Error deleting gallery:", err);
      setDeleteError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsDeleting(false);
      setShowDeleteGalleryDialog(false);
    }
  };

  // Only use galleryError for initial load error
  let initialLoadErrorTypeSafe: Error | null = null;
  if (galleryError && !galleryData) {
    initialLoadErrorTypeSafe = galleryError;
  }

  if (initialLoadErrorTypeSafe && !galleryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={initialLoadErrorTypeSafe}
          retry={() => fetchGalleryAsync(`/api/galleries/${galleryId}`)} 
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

  if (!galleryData && !galleryIsLoading && !initialLoadErrorTypeSafe) { 
    return <div className="container mx-auto px-4 py-8">Gallery not found or failed to load.</div>;
  }
  
  if (!galleryData) { 
      return <LoadingSpinner size="large" text="Preparing gallery editor..." />;
  }

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
        
        {submitErrorEncountered && (
          <ErrorMessage 
            error={submitErrorEncountered} 
            retry={() => {
              resetSubmitState();
              handleConfirmSubmit();
            }}
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
        
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Use the modern Zod-validated form component */}
          <GalleryDetailsForm 
            register={form.register}
            errors={form.formState.errors}
            isSubmitting={isSubmitting}
          />
          
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
              galleryImages={images}
              coverImageId={coverImageId}
              viewMode={viewMode} 
              onImagesReordered={setImages} 
              onDescriptionChange={handleImageDescriptionChange} 
              onSetCoverImage={setCoverImageId}
              onRemoveImage={handleRemoveImage} 
            />
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
              disabled={isDeleting || isSubmitting} 
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
              type="submit" 
              disabled={isSubmitting || !hasUnsavedChanges}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              data-testid="edit-gallery-save-button"
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
        
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmSubmit}
          onCancel={handleDiscardChanges}
          title="Save Changes?"
          message="You have unsaved changes. Do you want to save them before leaving?"
          confirmButtonText="Save Changes"
          cancelButtonText="Discard"
        />
        
        <ConfirmDialog
          isOpen={showDeleteGalleryDialog}
          onClose={() => setShowDeleteGalleryDialog(false)}
          onConfirm={handleDeleteGallery}
          title="Delete Gallery"
          message="Are you sure you want to delete this gallery? This action cannot be undone."
          confirmButtonText="Delete Gallery"
          confirmButtonColor="red"
        />
        
        <SelectImagesDialog
          isOpen={showSelectImagesDialog}
          onClose={() => setShowSelectImagesDialog(false)}
          onImagesSelected={handleAddImages}
          existingImageIds={images.map(img => img.imageId || '')}
        />
        
        <ConfirmDialog
          isOpen={showRemoveImageDialog.isOpen}
          onClose={cancelRemoveImage}
          onConfirm={confirmRemoveImage}
          title="Remove Image"
          message="Are you sure you want to remove this image from the gallery?"
          confirmButtonText="Remove Image"
        />
        
        {toastMessage && showSuccessToast && (
          <div className="fixed bottom-4 right-4 pointer-events-none">
            <SuccessMessage message={toastMessage} className="mb-4 pointer-events-auto" onDismiss={() => {}} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
