'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { useGalleryImages } from '@/lib/hooks';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { GallerySortable, ViewMode } from '@/components/GallerySortable';
import { FullImageInGallery } from '@/lib/types';
import { GalleryDetailsFormWithZod, GalleryFormData } from '@/components/GalleryDetailsFormWithZod';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CreateGallerySchema } from '@/lib/schemas';

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

export function CreateGalleryWithZod({ availableImages }: CreateGalleryProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Initialize react-hook-form with zod resolver
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch
  } = useForm<GalleryFormData>({
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
      displayMode: 'carousel',
      layoutType: 'contained'
    }
  });

  // States from EditGalleryPage
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

  const [showSelectImagesDialog, setShowSelectImagesDialog] = useState(false);
  const [viewMode] = useState<ViewMode>('compact');
  const [coverImageId, setCoverImageId] = useState<string>('');

  // Form submission handler
  const onSubmit = async (data: GalleryFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare images data for the API
      const imagesToSubmit = images.map((img, index) => ({
        id: img.image.id, // This should be the actual Image ID
        description: img.description,
        order: index, // The GallerySortable and useGalleryImages hook should manage the order
      }));

      // Combine form data with images data
      const galleryData = {
        ...data,
        images: imagesToSubmit,
        coverImageId: coverImageId || null
      };

      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(galleryData),
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
      
      // Reset form and state
      setValue('title', '');
      setValue('description', '');
      setValue('isPublic', false);
      setValue('themeColor', '');
      setValue('backgroundColor', '');
      setValue('backgroundImageUrl', '');
      setValue('accentColor', '');
      setValue('fontFamily', '');
      setValue('displayMode', 'carousel');
      setValue('layoutType', 'contained');
      setImages([]);
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
    
    const fetchImagesForHook = async () => {
      return availableImages
        .filter(img => selectedImageIds.includes(img.id))
        .map(img => ({
          id: img.id,
          title: img.title,
          url: img.url,
          description: img.description,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: img.tags || []
        }));
    };

    addImagesToGallery(selectedImageIds, fetchImagesForHook);
  }, [addImagesToGallery, availableImages]);

  // Handle image reordering from GallerySortable
  const handleImagesReordered = useCallback((reorderedImages: FullImageInGallery[]) => {
    setImages(reorderedImages);
  }, [setImages]);

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
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <GalleryDetailsFormWithZod
            register={register}
            errors={errors}
            control={control}
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
            disabled={!watch('title') || images.length === 0 || isSubmitting} // Ensure images are selected
          >
            Create Gallery
          </Button>
        </form>

        <SelectImagesDialog
          isOpen={showSelectImagesDialog}
          onClose={() => setShowSelectImagesDialog(false)}
          onImagesSelected={handleAddImages} // Pass the IDs of selected images
          existingImageIds={images.map(gi => gi.image.id)} // Pass IDs of images already in the gallery to prevent re-adding
        />

        {/* ConfirmDialog for removing images */}
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
