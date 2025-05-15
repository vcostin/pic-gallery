'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';
// Import the schema-derived types directly
import { FullImageInGallery } from '@/lib/schemas';
// Using the legacy version of GalleryDetailsForm that doesn't require react-hook-form
import { GalleryDetailsForm } from '@/components/GalleryDetailsForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { GalleryFormData } from '@/components/GalleryDetailsForm';

// The component no longer needs AvailableImageType, availableImages, or CreateGalleryProps
// since useEnhancedGalleryImages handles fetching images internally

// The CreateGallery component now uses the enhanced hooks and doesn't need availableImages directly
export function CreateGallery(): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Theming state
  const [themeColor, setThemeColor] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<string>('');
  const [layoutType, setLayoutType] = useState<string>('');

  // States from EditGalleryPage - using enhanced hooks
  const {
    images,
    setImages,
    showRemoveImageDialog,
    showSuccessToast, // This is for the hook's internal toast, we have our own successMessage
    toastMessage, // Hook's toast message
    handleImageDescriptionChange,
    handleRemoveImage,
    confirmRemoveImage,
    cancelRemoveImage,
    addImages: addImagesToGallery // Renamed in enhanced hook
  } = useEnhancedGalleryImages(undefined, []); // First param is galleryId (undefined for new gallery)

  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [viewMode] = useState<ViewMode>('compact');
  const [coverImageId, setCoverImageId] = useState<string>(''); // For GallerySortable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare images data for the API
      const imagesToSubmit = images
        .filter(img => img.image) // Filter out images without valid image property
        .map((img, index) => ({
          id: img.image!.id, // We filtered out undefined above, so this is safe
          description: img.description,
          order: index, // The GallerySortable and useGalleryImages hook should manage the order
        }));

      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          isPublic,
          images: imagesToSubmit, // Send the structured image data
          coverImageId: coverImageId || null, // Send cover image id
          // Theming options
          themeColor: themeColor || null,
          backgroundColor: backgroundColor || null,
          backgroundImageUrl: backgroundImageUrl || null,
          accentColor: accentColor || null,
          fontFamily: fontFamily || null,
          displayMode: displayMode || null,
          layoutType: layoutType || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If errorData.error is an array (likely Zod errors), format it.
        let errorMessage = 'Failed to create gallery';
        if (errorData.error) {
          if (Array.isArray(errorData.error)) {
            // Assuming ZodError format: { message: string, ...otherProps }[]
            errorMessage = errorData.error.map((err: { message?: unknown }) => 
              typeof err.message === 'string' ? err.message : JSON.stringify(err)
            ).join(', ');
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        }
        throw new Error(errorMessage);
      }

      const created = await response.json();
      const createdGallery = created.data;
      setSuccessMessage(`Gallery "${createdGallery.title}" created successfully!`);
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setImages([]); // Reset images from the hook
      setCoverImageId('');
      router.refresh();
      setTimeout(() => {
        router.push(`/galleries/${createdGallery.id}`);
      }, 1500);
    } catch (error) {
      logger.error('Error creating gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to create gallery');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler to add images to the gallery from SelectImagesDialog
  const handleAddImages = useCallback((selectedImageIds: string[]) => {
    setShowSelectImagesDialog(false);
    
    if (selectedImageIds.length > 0) {
      // Enhanced hook only needs the image IDs - it handles fetching images internally
      addImagesToGallery(selectedImageIds);
    }
  }, [addImagesToGallery]);

  // Handle image reordering from GallerySortable
  const handleImagesReordered = useCallback((reorderedImages: FullImageInGallery[]) => {
    setImages(reorderedImages);
  }, [setImages]);

  // The old toggleImageSelection and updateImageDescription are no longer needed
  // as useGalleryImages and GallerySortable handle this.

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Create New Gallery</h2>
      </CardHeader>
      
      <CardContent>
        {successMessage && (
          <SuccessMessage 
            message={successMessage} 
            className="mb-4" 
            onDismiss={() => setSuccessMessage(null)}
          />
        )}
        
        {error && (
          <ErrorMessage 
            error={error} 
            className="mb-4" 
            retry={() => setError(null)}
          />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <GalleryDetailsForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            // Pass theming state and setters
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
            // Add empty react-hook-form props since we're using legacy mode
            register={function() { return { name: '' }; } as unknown as UseFormRegister<GalleryFormData>}
            errors={{} as FieldErrors<GalleryFormData>}
            control={{} as Control<GalleryFormData>}
            useReactHookForm={false}
          />

          {/* Images Section - similar to EditGalleryPage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Images ({images.length})</h2>
              <Button
                type="button"
                onClick={() => setShowSelectImagesDialog(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isSubmitting}
              >
                Add Images
              </Button>
            </div>

            {images.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop to reorder images. You can also set a cover image and edit descriptions.
                </p>
              </div>
            )}

            <GallerySortable 
              galleryImages={images.filter(img => img.image !== undefined) as FullImageInGallery[]}
              coverImageId={coverImageId} 
              viewMode={viewMode}
              onImagesReordered={handleImagesReordered}
              onDescriptionChange={handleImageDescriptionChange}
              onSetCoverImage={(imageId) => setCoverImageId(imageId)}
              onRemoveImage={handleRemoveImage}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!title || images.length === 0 || isSubmitting} 
          >
            Create Gallery
          </Button>
        </form>

        <SelectImagesDialog
          isOpen={showSelectImagesDialog}
          onClose={() => setShowSelectImagesDialog(false)}
          onImagesSelected={handleAddImages} 
          existingImageIds={images
            .filter(img => img.image) // Filter out items without image
            .map(img => img.image!.id) // Safe assertion since we filtered
          }
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

        {/* Toast notification from enhanced gallery hook */}
        {showSuccessToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center animate-fade-in-up z-50">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {toastMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
