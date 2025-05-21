// Enhanced mock for EditImageDialog component
// This is used by the enhanced tests to provide better control over component behavior

import React, { useState, useEffect, useRef } from 'react';
import { ImageService, type Image } from '@/lib/services/imageService';
import { useRouter } from 'next/navigation';

interface EditImageDialogProps {
  image: Image;
  isOpen: boolean;
  onClose: (deletedImageId?: string) => void;
}

export function MockEditImageDialogWithZodEnhanced({ image, isOpen, onClose }: EditImageDialogProps): React.ReactElement | null {
  const [title, setTitle] = useState<string>(image.title);
  const [description, setDescription] = useState<string | null>(image.description || null);
  const [tagsString, setTagsString] = useState<string>((image.tags?.map(t => t.name) || []).join(', '));
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: { message: string } }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset form when image prop changes
  useEffect(() => {
    setTitle(image.title);
    setDescription(image.description || null);
    setTagsString((image.tags?.map(t => t.name) || []).join(', '));
    setValidationErrors({});
    setError(null);
    setSuccessMessage(null);
  }, [image]);

  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Format tags from string to array
  const parseTagsFromString = (tagsStr: string = ''): string[] => {
    return tagsStr
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: { message: string } } = {};
    
    if (!title) {
      errors.title = { message: 'Title is required' };
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setError(null);
    setIsSubmitting(true);
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // Prepare update data - only include necessary properties
      // This matches the pattern in the real component
      const updateData = {
        id: image.id,
        title,
        description,
        tags: parseTagsFromString(tagsString)
      };
      
      // Call the ImageService
      await ImageService.updateImage(
        image.id,
        updateData,
        abortController.signal
      );
      
      router.refresh();
      
      // For tests, we need a more predictable way to handle state updates
      // Rather than using Promise.resolve(), we'll make the state updates immediately
      // and rely on the test's act() wrapper to handle them properly
      setSuccessMessage('Image updated successfully!');
      setIsSubmitting(false);
      abortControllerRef.current = null;
      
      // Auto close after timeout - for tests we'll use jest.advanceTimersByTime
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
      
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        
        // Make state updates directly, and rely on test's act() wrapper
        setError(errorObj);
        setIsSubmitting(false);
        abortControllerRef.current = null;
      }
    } finally {
      // Nothing needed here as we've already handled state cleanup in the try/catch blocks
    }
  };
  
  // Don't render anything if the dialog is not open
  if (!isOpen) return null;

  return (
    <div className="mock-edit-image-dialog" data-testid="mock-edit-image-dialog">
      <h2>Edit Image</h2>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="success-message" data-testid="success-message">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message" data-testid="error-message">
          {error.message}
        </div>
      )}
      
      {/* Image thumbnail */}
      <div className="image-preview">
        <img src={image.url} alt={image.title} data-testid="mock-image" />
      </div>
      
      <form onSubmit={handleSubmit} data-testid="edit-image-form">
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter image title"
            data-testid="title-input"
          />
          {validationErrors.title && (
            <p className="error-text" data-testid="title-error">
              {validationErrors.title.message}
            </p>
          )}
        </div>
        
        <div>
          <label>Description</label>
          <textarea
            value={description || ''}
            onChange={(e) => setDescription(e.target.value || null)}
            placeholder="Enter image description"
            data-testid="description-input"
          />
        </div>
        
        <div>
          <label>Tags</label>
          <input
            type="text"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            placeholder="Enter tags separated by commas"
            data-testid="tags-input"
          />
        </div>
        
        <div className="button-group">
          <button 
            type="button" 
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="delete-button"
            disabled={isSubmitting}
          >
            Delete
          </button>
          
          <button 
            type="button" 
            onClick={() => onClose()}
            data-testid="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            data-testid="save-button"
          >
            Save Changes
          </button>
        </div>
      </form>
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div data-testid="mock-delete-dialog">
          <p>Are you sure you want to delete this image?</p>
          <button 
            onClick={() => {
              setShowDeleteConfirm(false);
              onClose(image.id);
            }} 
            data-testid="confirm-delete"
          >
            Confirm Delete
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(false)} 
            data-testid="cancel-delete"
          >
            Cancel Delete
          </button>
        </div>
      )}
    </div>
  );
}
