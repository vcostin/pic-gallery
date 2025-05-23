'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import logger from '@/lib/logger';
import { ImageService } from '@/lib/services/imageService';

export function UploadImageWithService() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const router = useRouter();
  
  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up object URLs to prevent memory leaks
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Clean up previous preview URL if it exists
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };
  
  // Handle form submission with proper error handling and request cancellation
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (!file || !title) {
      setError(new Error('Please select a file and enter a title'));
      return;
    }
    
    // Set loading state and clear errors
    setIsUploading(true);
    setError(null);
    
    try {
      // Create AbortController for request cancellation
      const abortController = new AbortController();
      
      // Parse tags from comma-separated string
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
      
      // Use the ImageService to handle the upload and image creation
      const createdImage = await ImageService.uploadAndCreateImage(
        file,
        {
          title,
          description,
          tags: tagArray
        },
        abortController.signal
      );
      
      // Reset the form
      setTitle('');
      setDescription('');
      setTags('');
      setFile(null);
      
      // Clear preview and revoke object URL to prevent memory leaks
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Refresh the router to update the UI
      router.refresh();
      
      // Show success message with the title from the API response
      setSuccessMessage(`"${createdImage.title}" uploaded successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
      logger.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold">Upload New Image</h2>
      </CardHeader>
      
      <CardContent>
        {error && (
          <ErrorMessage 
            error={error}
            retry={() => setError(null)}
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
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" role="form" data-testid="upload-form">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter image title"
              required
              data-testid="upload-title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter image description"
              rows={3}
              data-testid="upload-description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter tags separated by commas"
              data-testid="upload-tags"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full"
              required
              data-testid="upload-file"
            />
            {preview && (
              <div className="mt-2 relative aspect-square w-full max-w-[200px]">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isUploading || !file || !title}
            isLoading={isUploading}
            data-testid="upload-submit"
          >
            Upload Image
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
