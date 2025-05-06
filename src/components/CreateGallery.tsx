'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

// Imports from EditGalleryPage
import { useGalleryImages } from '@/lib/hooks';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';
import { GalleryImage } from '@/components/GalleryImageCards'; // Assuming this type is compatible or can be adapted
import { GalleryDetailsForm } from '@/components/GalleryDetailsForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Tag {
  id: string;
  name: string;
}

// This ImageType is for available images to select from, not GalleryImage type used by useGalleryImages
interface AvailableImageType {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: Tag[];
}

interface CreateGalleryProps {
  availableImages: AvailableImageType[]; // These are the images the user can pick from
}

export function CreateGallery({ availableImages }: CreateGalleryProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // States from EditGalleryPage
  const {
    images,
    setImages,
    showRemoveImageDialog, // We might not need remove dialog directly here if GallerySortable handles it
    showSuccessToast, // This is for the hook's internal toast, we have our own successMessage
    toastMessage, // Hook's toast message
    handleImageDescriptionChange,
    handleRemoveImage, // This is to trigger the hook's internal dialog
    confirmRemoveImage, // Confirms removal in the hook
    cancelRemoveImage, // Cancels removal in the hook
    addImagesToGallery
  } = useGalleryImages(); // Initialize with empty array for new gallery

  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [viewMode] = useState<ViewMode>('compact');
  const [coverImageId, setCoverImageId] = useState<string>(''); // For GallerySortable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare images data for the API
      const imagesToSubmit = images.map((img, index) => ({
        id: img.image.id, // This should be the actual Image ID
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
    // The fetchImagesForGallery function needs to be adapted or passed if SelectImagesDialog needs it
    // For CreateGallery, availableImages are already passed as props.
    // We need to map AvailableImageType to the structure expected by addImagesToGallery if it differs.
    const fetchImagesForHook = async (): Promise<Array<{id: string; [key: string]: unknown}>> => {
      // availableImages is already in scope, map it to the expected format.
      // The hook expects an array of objects with at least an 'id' property.
      return availableImages.filter(img => selectedImageIds.includes(img.id)).map(img => ({...img})); 
    };

    addImagesToGallery(selectedImageIds, fetchImagesForHook);
  }, [addImagesToGallery, availableImages]);

  // Handle image reordering from GallerySortable
  const handleImagesReordered = useCallback((reorderedImages: GalleryImage[]) => {
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
                {/* <GalleryViewSelector viewMode={viewMode} setViewMode={setViewMode} /> */}
                 {/* GalleryViewSelector can be added later if needed */}
              </div>
            )}

            <GallerySortable 
              galleryImages={images}
              coverImageId={coverImageId} // This is image.id from the actual image, not GalleryImage.id
              viewMode={viewMode} // Or a fixed mode like 'compact'
              onImagesReordered={handleImagesReordered}
              onDescriptionChange={handleImageDescriptionChange}
              onSetCoverImage={(imageId) => setCoverImageId(imageId)} // Manages which image is the cover
              onRemoveImage={handleRemoveImage} // Triggers the hook's remove confirmation
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!title || images.length === 0 || isSubmitting} // Ensure images are selected
          >
            Create Gallery
          </Button>
        </form>

        <SelectImagesDialog
          isOpen={showSelectImagesDialog}
          onClose={() => setShowSelectImagesDialog(false)}
          onImagesSelected={handleAddImages} // Pass the IDs of selected images
          existingImageIds={images.map(gi => gi.image.id)} // Pass IDs of images already in the gallery to prevent re-adding
          // availableImages prop for SelectImagesDialog might need to be fetched or passed if it doesn't use a global store/context
        />

        {/* ConfirmDialog for removing images (if not handled by GallerySortable/hook directly) */}
        {/* We are using the hook's dialog, so this might not be needed here. 
            The hook manages showRemoveImageDialog, confirmRemoveImage, cancelRemoveImage 
        */}
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

        {/* Toast notification from useGalleryImages hook */}
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
