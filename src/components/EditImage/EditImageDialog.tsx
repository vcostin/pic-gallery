/**
 * @fileoverview EditImageDialog Component
 * 
 * A modal dialog for editing image metadata with Zod schema validation.
 * This is the modern implementation with strong type safety and validation.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DeleteImageConfirmDialog } from '@/components/DeleteImageConfirmDialog';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { ImageService, type Image, type UpdateImageData } from '@/lib/services/imageService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import logger from '@/lib/logger';

/**
 * Schema for validating image edit form data
 * Ensures title is required and other fields match expected formats
 */
const editImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * Type for form data based on schema validation
 */
type EditImageFormData = z.infer<typeof editImageSchema>;

/**
 * Props interface for the EditImageDialog component
 */
interface EditImageDialogProps {
  /** The image object to be edited. Must follow the Image type from ImageService */
  image: Image;
  /** Controls the visibility of the dialog */
  isOpen: boolean;
  /** 
   * Callback when the dialog is closed.
   * @param deletedImageId - Optional ID of the image if it was deleted
   */
  onClose: (deletedImageId?: string) => void;
}

/**
 * EditImageDialog - Modern dialog component for editing image metadata
 * 
 * Features:
 * - Zod schema validation
 * - TypeScript type safety
 * - Integration with ImageService
 * - Proper error handling
 * - Abort controller for cancelling pending requests
 * 
 * @param props - Component props
 * @returns React component
 */
export function EditImageDialog({ image, isOpen, onClose }: EditImageDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Setup form with react-hook-form and zod resolver
  const { control, handleSubmit, formState: { errors, isDirty, isSubmitting }, reset } = useForm<EditImageFormData>({
    resolver: zodResolver(editImageSchema),
    defaultValues: {
      id: image.id,
      title: image.title,
      description: image.description || '',
      tags: image.tags?.map(t => t.name) || []
    }
  });

  // Reset form when image prop changes
  useEffect(() => {
    reset({
      id: image.id,
      title: image.title,
      description: image.description || '',
      tags: image.tags?.map(t => t.name) || []
    });
  }, [image, reset]);
  
  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // Handle form submission
  const onSubmit = async (data: EditImageFormData) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Set error state to null
    setError(null);
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const updateData: UpdateImageData = {
        id: image.id,
        title: data.title,
        description: data.description || null,
        tags: data.tags
      };
      
      // Use ImageService to update the image
      const updatedImage = await ImageService.updateImage(
        image.id,
        updateData,
        abortController.signal
      );
      
      // Update the form with the returned data
      reset({
        id: updatedImage.id,
        title: updatedImage.title,
        description: updatedImage.description || '',
        tags: updatedImage.tags?.map(t => t.name) || []
      }, { keepDirty: false });
      
      // This will force Next.js to refresh the page data
      router.refresh();
      
      // Show success message
      setSuccessMessage('Image updated successfully!');
      
      // Clear success message after 2 seconds and close
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        logger.error('Error updating image:', err);
      }
    } finally {
      // Only update state if this is still the current request
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  // Format tags from array to string for display/editing
  const formatTagsForDisplay = (tags: string[] = []) => tags.join(', ');
  // Parse tags from string to array
  const parseTagsFromString = (tagsString: string = '') => 
    tagsString.split(',').map(tag => tag.trim()).filter(Boolean);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h2 className="text-xl font-semibold">Edit Image</h2>
          </CardHeader>
          
          <CardContent>
            {/* Success and error messages */}
            {successMessage && (
              <SuccessMessage 
                message={successMessage} 
                className="mb-4"
              />
            )}
            
            {error && (
              <ErrorMessage 
                error={error} 
                retry={() => setError(null)}
                className="mb-4"
              />
            )}
            
            {/* Image thumbnail */}
            <div className="mb-4 flex justify-center">
              <div className="relative w-40 h-40 rounded-md overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>
            </div>
            
            <form id="edit-image-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter image title"
                      aria-invalid={errors.title ? 'true' : 'false'}
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      value={field.value || ''}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter image description"
                      rows={3}
                    />
                  )}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={formatTagsForDisplay(field.value)}
                      onChange={(e) => field.onChange(parseTagsFromString(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter tags separated by commas"
                    />
                  )}
                />
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => onClose()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="edit-image-form"
                disabled={!isDirty || isSubmitting}
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <DeleteImageConfirmDialog 
        imageId={image.id}
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDeleted={() => {
          // Pass the deleted image ID to update UI immediately
          onClose(image.id);
        }}
      />
    </>
  );
}

// Export types
export type { EditImageFormData };
