'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod'; 
import { useGalleryForm } from '@/lib/form-hooks';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import { GallerySortable } from '@/components/GallerySortable';
import { GalleryDetailsFormWithZod, GalleryFormData } from '@/components/GalleryDetails';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CreateGallerySchema, FullImageInGallery } from '@/lib/schemas';
import { GalleryService } from '@/lib/services/galleryService';

/**
 * CreateGallery - A form component for creating galleries with Zod validation
 */
export function CreateGallery(): React.ReactElement {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Track dialog states
  const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Form setup
  const formMethods = useGalleryForm({
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
      displayMode: 'grid',
      layoutType: 'contained',
      images: [],
    }
  });
  
  // Define everything we need to avoid any TypeScript errors
  const register = formMethods.register;
  const handleSubmit = formMethods.handleSubmit;
  const control = formMethods.control;
  const errors = formMethods.formState.errors;
  const isSubmitting = formMethods.formState.isSubmitting;
  const reset = formMethods.reset;
  const setValue = formMethods.setValue;
  const watch = formMethods.watch;
  
  const watchedImages = watch('images');
  const imageCount = watchedImages ? watchedImages.length : 0;
  
  // Get enhanced image functionality (re-ordering, etc.)
  const { 
    images: orderedImages, 
    setImages: updateImages, 
    removeImage
  } = useEnhancedGalleryImages(undefined, watchedImages || []);
  
  // Update the form with selected images
  const handleImagesSelected = useCallback((selectedImageIds: string[]) => {
    // In a real implementation, we would need to fetch the full image data
    // For now, we're assuming the IDs directly map to existing images
    logger.log('Selected image IDs:', selectedImageIds);
  }, []);
  
  // Handle image removal
  const handleImageRemove = useCallback((imageId: string) => {
    removeImage(imageId);
    setValue('images', orderedImages.filter(img => img.id !== imageId), { shouldDirty: true });
  }, [removeImage, setValue, orderedImages]);
  
  // Update form state when gallery images are reordered
  const handleImagesReordered = useCallback((newImages: FullImageInGallery[]) => {
    setValue('images', newImages, { shouldDirty: true });
  }, [setValue]);
  
  // Handle form submission
  const onSubmit = async (data: GalleryFormData) => {
    try {
      setError(null);
      
      // Use the Gallery Service to create the gallery
      const newGallery = await GalleryService.createGallery({
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        images: data.images?.map((image, index) => ({
          id: image.id,
          description: image.description,
          order: index,
        })) || [],
      });
      
      // Set success message
      setSuccessMessage('Gallery created successfully!');
      
      // Reset form
      reset();
      
      // Navigate to the new gallery page
      router.push(`/galleries/${newGallery.id}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Error creating gallery:', err);
    }
  };
  
  // Handle cancel / reset
  const handleCancelCreate = () => {
    // If there are images or form values, confirm before resetting
    if (imageCount > 0 || (watchedImages && watchedImages.some((img: FullImageInGallery) => img))) {
      setIsConfirmDialogOpen(true);
    } else {
      // Otherwise just reset immediately
      reset();
    }
  };
  
  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          reset();
          setIsConfirmDialogOpen(false);
        }}
        title="Cancel Gallery Creation?"
        message={<p>All your current changes will be lost. Do you want to continue?</p>}
        confirmButtonText="Yes, cancel"
        cancelButtonText="No, continue editing"
      />
      
      <SelectImagesDialog 
        isOpen={isImagesDialogOpen}
        onClose={() => setIsImagesDialogOpen(false)}
        onImagesSelected={handleImagesSelected}
        existingImageIds={watchedImages ? watchedImages.map((img: FullImageInGallery) => img.id) : []}
      />
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Create New Gallery</h1>
        </CardHeader>
        <CardContent>
          {successMessage && <SuccessMessage message={successMessage} className="mb-4" />}
          {error && (
            <ErrorMessage 
              error={error}
              retry={() => setError(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <GalleryDetailsFormWithZod
              register={register}
              errors={errors}
              control={control}
              isSubmitting={isSubmitting}
              showCancelButton
              submitText="Create Gallery"
              onCancel={handleCancelCreate}
            />
            
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gallery Images</h2>
                <Button 
                  onClick={() => setIsImagesDialogOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                  type="button"
                >
                  <span>Add Images</span>
                </Button>
              </div>
              
              {imageCount > 0 ? (
                <div>
                  <GallerySortable
                    galleryImages={orderedImages}
                    coverImageId=""
                    viewMode="grid"
                    onImagesReordered={handleImagesReordered}
                    onDescriptionChange={(id, desc) => {
                      const updatedImages = orderedImages.map(img => 
                        img.id === id ? { ...img, description: desc } : img
                      );
                      updateImages(updatedImages);
                    }}
                    onSetCoverImage={() => {}}
                    onRemoveImage={handleImageRemove}
                  />
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500 mb-4">No images added to this gallery yet</p>
                  <Button 
                    onClick={() => setIsImagesDialogOpen(true)}
                    variant="outline"
                    type="button"
                  >
                    Select Images
                  </Button>
                </div>
              )}
              
              {/* Optional: Add image validation error message here */}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelCreate}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Gallery...' : 'Create Gallery'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
