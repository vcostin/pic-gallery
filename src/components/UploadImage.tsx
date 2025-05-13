'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageSchema } from '@/lib/schemas';
import logger from '@/lib/logger';
import { z } from 'zod';

// Define image and response types
type ImageResponse = z.infer<typeof ImageSchema>;

// Define upload response type
const UploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    url: z.string()
  })
});

export function UploadImage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Create AbortController refs for cancelling API requests
  const uploadControllerRef = useRef<AbortController | null>(null);
  const imageCreateControllerRef = useRef<AbortController | null>(null);
  
  const router = useRouter();
  
  // Clean up any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      if (uploadControllerRef.current) {
        uploadControllerRef.current.abort();
        uploadControllerRef.current = null;
      }
      
      if (imageCreateControllerRef.current) {
        imageCreateControllerRef.current.abort();
        imageCreateControllerRef.current = null;
      }
      
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
    
    // Cancel any existing requests
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
    }
    
    if (imageCreateControllerRef.current) {
      imageCreateControllerRef.current.abort();
    }
    
    // Set loading state and clear errors
    setIsUploading(true);
    setError(null);
    
    // Create new AbortControllers for these requests
    const uploadController = new AbortController();
    uploadControllerRef.current = uploadController;
    
    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: uploadController.signal
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'File upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Validate upload response
      const validatedUploadResult = UploadResponseSchema.parse(uploadResult);
      const url = validatedUploadResult.data.url;
      
      // Step 2: Create the image record
      const imageController = new AbortController();
      imageCreateControllerRef.current = imageController;
      
      const imagePayload = {
        title,
        description,
        url,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };
      
      const imageResponse = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imagePayload),
        signal: imageController.signal
      });
      
      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error || 'Failed to create image');
      }
      
      const imageResult = await imageResponse.json();
      
      if (!imageResult.success || !imageResult.data) {
        throw new Error('Failed to create image: Invalid response');
      }
      
      // Validate with Zod schema
      const createdImage = ImageSchema.parse(imageResult.data);
      
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
      // Only set error if the request wasn't aborted
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.error('Upload request was cancelled');
        return;
      }
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
      logger.error('Error uploading image:', error);
    } finally {
      // Clean up controllers and reset loading state
      uploadControllerRef.current = null;
      imageCreateControllerRef.current = null;
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
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" role="form">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter image title"
              required
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
          >
            Upload Image
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
