'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { ErrorMessage, LoadingSpinner, SuccessMessage } from '@/components/StatusMessages';
import { useSubmit, useFetch } from '@/lib/hooks';
import { useApi } from '@/lib/hooks/useApi';
import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery';
import { deepEqual } from '@/lib/deepEqual';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { use } from 'react';
import logger from '@/lib/logger';
// Removed unused imports from @/lib/types
import { FullGallerySchema, FullGallery, FullImageInGallery } from '@/lib/schemas'; 

// Import newly created components
import { GalleryDetailsForm } from '@/components/GalleryDetailsForm';
import { GalleryViewSelector } from '@/components/GalleryViewSelector';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';

export default function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const galleryId = resolvedParams.id;
  
  const { fetchApi, error: fetchError } = useFetch(); 
  
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageId, setCoverImageId] = useState<string | ''>('');
  const [originalGalleryData, setOriginalGalleryData] = useState<FullGallery | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const router = useRouter();

  const [themeColor, setThemeColor] = useState<string | undefined>(undefined);
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [fontFamily, setFontFamily] = useState<string | undefined>(undefined);
  const [displayMode, setDisplayMode] = useState<string | undefined>(undefined);
  const [layoutType, setLayoutType] = useState<string | undefined>(undefined);

  const performGalleryUpdate = async () => {
    if (!originalGalleryData) throw new Error("Original gallery data not loaded.");
    
    // Ensure all images have valid order values before sending to backend
    const updatedImages = images.map((img, index) => ({ 
      id: img.id,
      imageId: img.imageId,
      description: img.description,
      order: typeof img.order === 'number' ? img.order : index,
    }));
    
    const payload = {
      id: galleryId, // Add the required id field
      title,
      description,
      isPublic,
      coverImageId: coverImageId || null,
      images: updatedImages,
      themeColor: themeColor || null,
      backgroundColor: backgroundColor || null,
      backgroundImageUrl: backgroundImageUrl || null,
      accentColor: accentColor || null,
      fontFamily: fontFamily || null,
      displayMode: displayMode || null,
      layoutType: layoutType || null,
    };
    const response = await fetchApi<{ data: FullGallery; message: string }>(`/api/galleries/${galleryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setOriginalGalleryData(response.data);
    setImages(response.data.images);
    // No need to set gallery data manually, the hook handles it 
    return response.message || "Gallery updated successfully";
  };
  
  const { handleSubmit: submitGalleryUpdate, isSubmitting, error: submitErrorEncountered, reset: resetSubmitState } = useSubmit(performGalleryUpdate);

  // Define a stable callback function for handling gallery data
  // This prevents unnecessary re-renders and potential dependency issues
  const handleGalleryData = useCallback((data: FullGallery) => {
    setTitle(data.title);
    setDescription(data.description || '');
    setIsPublic(data.isPublic);
    setCoverImageId(data.coverImageId || '');
    setImages(data.images); 
    setThemeColor(data.themeColor || undefined);
    setBackgroundColor(data.backgroundColor || undefined);
    setBackgroundImageUrl(data.backgroundImageUrl || undefined);
    setAccentColor(data.accentColor || undefined);
    setFontFamily(data.fontFamily || undefined);
    setDisplayMode(data.displayMode || undefined);
    setLayoutType(data.layoutType || undefined);
    
    const fullLoadedData = {
      ...data,
      title: data.title,
      description: data.description || '',
      isPublic: data.isPublic,
      coverImageId: data.coverImageId || '',
      images: data.images, 
      themeColor: data.themeColor || null, 
      backgroundColor: data.backgroundColor || null,
      backgroundImageUrl: data.backgroundImageUrl || null,
      accentColor: data.accentColor || null,
      fontFamily: data.fontFamily || null,
      displayMode: data.displayMode || null,
      layoutType: data.layoutType || null,
    };
    setOriginalGalleryData(fullLoadedData);
  // State setters from useState are stable and don't need to be dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch gallery data when galleryId changes
    // Changed to use fetchGalleryAsync as a URL-based fetcher
    fetchGalleryAsync(`/api/galleries/${galleryId}`).then(result => {
      if (result.success && result.data) {
        handleGalleryData(result.data);
      }
    }).catch(() => {
      // Error is handled by useApi and useFetch hooks, no need to handle 'err' parameter if unused
    });
    
    // Only galleryId should trigger a re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]);

  useEffect(() => {
    if (!originalGalleryData) return;
    const currentData = {
      title,
      description,
      isPublic,
      coverImageId: coverImageId || '',
      images,
      themeColor: themeColor || null,
      backgroundColor: backgroundColor || null,
      backgroundImageUrl: backgroundImageUrl || null,
      accentColor: accentColor || null,
      fontFamily: fontFamily || null,
      displayMode: displayMode || null,
      layoutType: layoutType || null,
    };
    // Construct originalComparableData with the same structure as currentData
    // to ensure accurate comparison by deepEqual.
    const originalComparableData = {
      title: originalGalleryData.title,
      description: originalGalleryData.description, // Already normalized to '' if null/undefined in originalGalleryData
      isPublic: originalGalleryData.isPublic,
      coverImageId: originalGalleryData.coverImageId, // Already normalized to '' if null/undefined in originalGalleryData
      images: originalGalleryData.images,
      themeColor: originalGalleryData.themeColor, // Already normalized to null if null/undefined in originalGalleryData
      backgroundColor: originalGalleryData.backgroundColor, // Already normalized
      backgroundImageUrl: originalGalleryData.backgroundImageUrl, // Already normalized
      accentColor: originalGalleryData.accentColor, // Already normalized
      fontFamily: originalGalleryData.fontFamily, // Already normalized
      displayMode: originalGalleryData.displayMode, // Already normalized
      layoutType: originalGalleryData.layoutType, // Already normalized
    };
    setHasUnsavedChanges(!deepEqual(currentData, originalComparableData));
  }, [originalGalleryData, title, description, isPublic, coverImageId, images, themeColor, backgroundColor, backgroundImageUrl, accentColor, fontFamily, displayMode, layoutType]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => { 
    if (e) e.preventDefault();
    setShowConfirmDialog(false); 
    try {
      const message = await submitGalleryUpdate({}); 
      setSuccessMessage(message as string);
      setHasUnsavedChanges(false); 
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      logger.error("Submit error caught in handleSubmit:", err);
    }
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
      setTitle(originalGalleryData.title);
      setDescription(originalGalleryData.description || '');
      setIsPublic(originalGalleryData.isPublic);
      setCoverImageId(originalGalleryData.coverImageId || '');
      setImages(originalGalleryData.images);
      setThemeColor(originalGalleryData.themeColor || undefined);
      setBackgroundColor(originalGalleryData.backgroundColor || undefined);
      setBackgroundImageUrl(originalGalleryData.backgroundImageUrl || undefined);
      setAccentColor(originalGalleryData.accentColor || undefined);
      setFontFamily(originalGalleryData.fontFamily || undefined);
      setDisplayMode(originalGalleryData.displayMode || undefined);
      setLayoutType(originalGalleryData.layoutType || undefined);
      setShowConfirmDialog(false);
      setHasUnsavedChanges(false); 
      setSuccessMessage("Changes discarded");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleAddImages = useCallback((imageIds: string[]) => {
    setShowSelectImagesDialog(false);
    // addImages from useEnhancedGalleryImages already handles fetching images internally
    addImages(imageIds);
  }, [addImages]);

  const handleDeleteGallery = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await fetchApi(`/api/galleries/${galleryId}`, { method: 'DELETE' });
      setSuccessMessage("Gallery deleted successfully.");
      setTimeout(() => {
        router.push('/galleries'); 
      }, 2000);
    } catch (err) {
      logger.error("Error deleting gallery:", err);
      setDeleteError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsDeleting(false);
      setShowDeleteGalleryDialog(false);
    }
  };

  // Use fetchError for initial load error, galleryError for async operations after load
  // Corrected initialLoadError definition to ensure it's Error | null
  let initialLoadErrorTypeSafe: Error | null = null;
  if (fetchError) {
    initialLoadErrorTypeSafe = fetchError;
  } else if (galleryError && !galleryData) {
    initialLoadErrorTypeSafe = galleryError;
  }

  if (initialLoadErrorTypeSafe && !galleryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={initialLoadErrorTypeSafe} // Use the type-safe version
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
              handleSubmit(); 
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
        
        <form onSubmit={handleSubmit} className="space-y-6"> {/* Corrected: form onSubmit calls handleSubmit directly */}
          <GalleryDetailsForm 
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            themeColor={themeColor}
            setThemeColor={setThemeColor}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            backgroundImageUrl={backgroundImageUrl}
            setBackgroundImageUrl={setBackgroundImageUrl}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            layoutType={layoutType}
            setLayoutType={setLayoutType}
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
          onConfirm={() => handleSubmit()} 
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
          onConfirm={handleDeleteGallery} 
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
