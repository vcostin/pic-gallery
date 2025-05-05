'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { useFetch, useSubmit } from '@/lib/hooks';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Define type for the API response
interface ImageResponse {
  id: string;
  title: string;
  description: string | null;
  url: string;
  tags: Array<{ id: string; name: string }>;
}

export function UploadImage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const router = useRouter();
  const { fetchApi } = useFetch();
  
  const { 
    handleSubmit: submitUpload, 
    isSubmitting: uploading, 
    error: uploadError,
    reset: resetUploadState
  } = useSubmit(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file || !title) throw new Error('Please select a file and enter a title');
    
    // Upload the file
    const formData = new FormData();
    formData.append('file', file);
    
    const { url } = await fetchApi<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    // Create the image record and get the returned data
    const createdImage = await fetchApi<ImageResponse>('/api/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        url,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }),
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setTags('');
    setFile(null);
    setPreview(null);
    
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
    
    return 'Image uploaded successfully!';
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    await submitUpload(e);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold">Upload New Image</h2>
      </CardHeader>
      
      <CardContent>
        {uploadError && (
          <ErrorMessage 
            error={uploadError}
            retry={() => resetUploadState()}
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
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
            disabled={uploading || !file || !title}
            isLoading={uploading}
          >
            Upload Image
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
