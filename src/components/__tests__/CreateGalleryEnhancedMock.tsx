// Enhanced Mock for CreateGallery component
// Used in enhanced tests to provide more complete component behavior

import React, { useState } from 'react';
import { GalleryService } from '@/lib/services/galleryService';
import { useRouter } from 'next/navigation';

// Import types directly from the schema
import { CreateGallerySchema } from '@/lib/schemas';
import { z } from 'zod';

// Define types using Zod schema to ensure they match with the actual schema
type GalleryImage = {
  id: string;
  order: number;
};

// Create a type for the form data using the schema
type GalleryFormData = z.infer<typeof CreateGallerySchema>;

/**
 * A more comprehensive mock of the CreateGallery component
 * that includes form submission handling and other interactive features
 */
export function MockCreateGalleryEnhanced(): React.ReactElement {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [images, setImages] = useState<Array<{
    id: string;
    image?: {
      id: string;
      title: string;
      url: string;
      tags: unknown[];
    };
  }>>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, { message: string }>>({});
  const [isSelectImagesDialogOpen, setIsSelectImagesDialogOpen] = useState<boolean>(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setErrorMessage(null);
    setValidationErrors({});
    
    // Basic validation
    const errors: { [key: string]: { message: string } } = {};
    if (!title) {
      errors.title = { message: 'Title is required' };
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      // Call the mocked GalleryService
      const newGallery = await GalleryService.createGallery({
        title,
        description,
        isPublic: isPublished,
        images: images.map((image, index) => ({
          id: image.id,
          order: index
        }))
      });
      
      // Update state in a way that React can track
      setSuccessMessage('Gallery created successfully!');
      
      // Navigation should be done within the same event loop for testing
      // In a real component, we might use a useEffect or setTimeout
      setTimeout(() => {
        router.push(`/galleries/${newGallery.id}`);
      }, 0);
      
    } catch (err) {
      // Update error state in a more predictable way for testing
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
    }
  };
  
  const handleAddImages = () => {
    // Update state in a predictable way for testing
    setTimeout(() => {
      setIsSelectImagesDialogOpen(true);
    }, 0);
  };
  
  const handleCancel = () => {
    if (title || description || isPublished || images.length > 0) {
      // Update state in a predictable way for testing
      setTimeout(() => {
        setIsConfirmDialogOpen(true);
      }, 0);
    } else {
      // Reset form with slight delay to ensure React can track state changes
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setIsPublished(false);
        setImages([]);
      }, 0);
    }
  };

  return (
    <div data-testid="mock-create-gallery">
      {successMessage && <div data-testid="success-message">{successMessage}</div>}
      {errorMessage && <div data-testid="error-message">{errorMessage}</div>}
      
      <h2>Create New Gallery</h2>
      
      <button 
        data-testid="add-images-button"
        onClick={handleAddImages}
      >
        Add Images
      </button>
      
      <form 
        data-testid="gallery-form"
        onSubmit={handleSubmit}
      >
        <input 
          data-testid="title-input" 
          type="text" 
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {validationErrors.title && (
          <p data-testid="title-error">{validationErrors.title.message}</p>
        )}
        
        <textarea 
          data-testid="description-input" 
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <label>
          <input 
            data-testid="is-published-input" 
            type="checkbox" 
            name="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Publish Gallery
        </label>
        
        {images.length > 0 && (
          <div data-testid="gallery-sortable">
            {images.map(image => (
              <div key={image.id} data-testid={`image-${image.id}`}>
                <span>{image.image?.title}</span>
                <button 
                  onClick={() => {
                    setImages(images.filter(img => img.id !== image.id));
                  }}
                  data-testid={`remove-image-${image.id}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button data-testid="submit-button" type="submit">Create Gallery</button>
        <button 
          data-testid="cancel-button" 
          type="button"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </form>
      
      {isSelectImagesDialogOpen && (
        <div data-testid="select-images-dialog">
          <button 
            onClick={() => {
              const newImages = [
                { 
                  id: 'img-1', 
                  image: { 
                    id: 'img-1', 
                    title: 'Test Image 1', 
                    url: '/test-image-1.jpg',
                    tags: []
                  } 
                },
                { 
                  id: 'img-2', 
                  image: { 
                    id: 'img-2', 
                    title: 'Test Image 2', 
                    url: '/test-image-2.jpg',
                    tags: []
                  } 
                }
              ];
              
              // Update state in a more predictable way for testing
              setTimeout(() => {
                setImages([...images, ...newImages]);
                setIsSelectImagesDialogOpen(false);
              }, 0);
            }} 
            data-testid="select-images-button"
          >
            Select Images
          </button>
          <button 
            onClick={() => {
              // Update state in a more predictable way for testing
              setTimeout(() => {
                setIsSelectImagesDialogOpen(false);
              }, 0);
            }} 
            data-testid="close-dialog-button"
          >
            Close
          </button>
        </div>
      )}
      
      {isConfirmDialogOpen && (
        <div data-testid="confirm-dialog">
          <p>All your current changes will be lost. Do you want to continue?</p>
          <button 
            onClick={() => {
              // Update state in a more predictable way for testing
              setTimeout(() => {
                setTitle('');
                setDescription('');
                setIsPublished(false);
                setImages([]);
                setIsConfirmDialogOpen(false);
              }, 0);
            }} 
            data-testid="confirm-action-button"
          >
            Yes, cancel
          </button>
          <button 
            onClick={() => {
              // Update state in a more predictable way for testing
              setTimeout(() => {
                setIsConfirmDialogOpen(false);
              }, 0);
            }} 
            data-testid="cancel-action-button"
          >
            No, continue editing
          </button>
        </div>
      )}
    </div>
  );
}
