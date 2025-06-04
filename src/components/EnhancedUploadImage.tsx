'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ErrorMessage, SuccessMessage } from '@/components/StatusMessages';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DragDropZone } from '@/components/ui/DragDropZone';
import { TagInput } from '@/components/ui/TagInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FileValidator } from '@/lib/utils/fileValidation';
import { ImageService } from '@/lib/services/imageService';
import logger from '@/lib/logger';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface FileWithPreview {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string[];
  id: string;
}

export function EnhancedUploadImage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load existing tags for autocomplete
  useEffect(() => {
    const loadExistingTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          setExistingTags(data.tags || []);
        }
      } catch (error) {
        logger.warn('Failed to load existing tags:', error);
      }
    };

    loadExistingTags();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up object URLs
      files.forEach(file => URL.revokeObjectURL(file.preview));
      
      // Cancel any pending uploads
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [files]);

  const handleFilesSelected = useCallback((fileList: FileList) => {
    setError(null);
    
    // Validate files
    const validation = FileValidator.validateFiles(fileList, {
      maxFileSize: 4 * 1024 * 1024, // 4MB
      maxFiles: 5, // Allow multiple files
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    });

    if (!validation.isValid) {
      setError(new Error(validation.error || 'File validation failed'));
      return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('File warnings:', validation.warnings);
    }

    // Create file objects with previews and smart defaults
    const newFiles: FileWithPreview[] = Array.from(fileList).map(file => {
      const preview = URL.createObjectURL(file);
      const title = FileValidator.extractFilenameTitle(file.name);
      
      return {
        file,
        preview,
        title,
        description: '',
        tags: [...commonTags], // Apply common tags
        id: `${Date.now()}-${Math.random()}`
      };
    });

    // Add to existing files (for multiple selection)
    setFiles(prevFiles => {
      // Clean up previous previews if replacing
      if (prevFiles.length === 0) {
        return newFiles;
      } else {
        return [...prevFiles, ...newFiles];
      }
    });
  }, [commonTags]);

  const removeFile = useCallback((id: string) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prevFiles.filter(f => f.id !== id);
    });
  }, []);

  const updateFileMetadata = useCallback((id: string, field: keyof Omit<FileWithPreview, 'file' | 'preview' | 'id'>, value: string | string[]) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, [field]: value } : file
      )
    );
  }, []);

  const applyCommonTags = useCallback(() => {
    if (commonTags.length === 0) return;
    
    setFiles(prevFiles => 
      prevFiles.map(file => ({
        ...file,
        tags: [...new Set([...file.tags, ...commonTags])] // Merge and deduplicate
      }))
    );
  }, [commonTags]);

  const handleUpload = async () => {
    if (files.length === 0) {
      setError(new Error('Please select at least one file'));
      return;
    }

    // Validate all files have titles
    const filesWithoutTitles = files.filter(file => !file.title.trim());
    if (filesWithoutTitles.length > 0) {
      setError(new Error('Please provide titles for all images'));
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Create abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const uploadedImages: string[] = [];
    let failedUploads = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentUploadIndex(i);
        const fileData = files[i];

        try {
          // Update progress
          const baseProgress = (i / files.length) * 100;
          setUploadProgress(baseProgress);

          // Upload using ImageService
          const uploadedImage = await ImageService.uploadAndCreateImage(
            fileData.file,
            {
              title: fileData.title,
              description: fileData.description || undefined,
              tags: fileData.tags
            },
            abortController.signal
          );

          uploadedImages.push(uploadedImage.title);
          
          // Update progress
          setUploadProgress(((i + 1) / files.length) * 100);
          
        } catch (uploadError) {
          logger.error(`Failed to upload ${fileData.title}:`, uploadError);
          failedUploads++;
        }
      }

      // Show results
      if (uploadedImages.length > 0) {
        const successMsg = uploadedImages.length === 1 
          ? `"${uploadedImages[0]}" uploaded successfully!`
          : `${uploadedImages.length} images uploaded successfully!`;
        
        if (failedUploads > 0) {
          setSuccessMessage(`${successMsg} (${failedUploads} failed)`);
        } else {
          setSuccessMessage(successMsg);
        }

        // Clear form
        files.forEach(file => URL.revokeObjectURL(file.preview));
        setFiles([]);
        setCommonTags([]);

        // Refresh and redirect
        router.refresh();
        
        setTimeout(() => {
          setSuccessMessage(null);
          if (uploadedImages.length === 1) {
            router.push('/images');
          }
        }, 3000);
      } else {
        setError(new Error('All uploads failed. Please try again.'));
      }

    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(-1);
      abortControllerRef.current = null;
    }
  };

  const canUpload = files.length > 0 && files.every(file => file.title.trim()) && !isUploading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Upload Images
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your photos with beautiful galleries
        </p>
      </div>

      {/* Status Messages */}
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

      {/* Step 1: File Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h2 className="text-lg font-semibold">Select Images</h2>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropZone
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            disabled={isUploading}
          />

          {files.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Image Details */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="text-lg font-semibold">Add Details</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Common tags for multiple files */}
            {files.length > 1 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Apply to All Images</h3>
                </div>
                <div className="space-y-3">
                  <TagInput
                    value={commonTags}
                    onChange={setCommonTags}
                    suggestions={existingTags}
                    placeholder="Add common tags..."
                    className="mb-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyCommonTags}
                    disabled={commonTags.length === 0}
                  >
                    Apply Tags to All
                  </Button>
                </div>
              </div>
            )}

            {/* Individual file details */}
            <div className="space-y-4">
              {files.map((fileData, index) => (
                <div key={fileData.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <Image
                          src={fileData.preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        {currentUploadIndex === index && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="text-blue-600 font-medium text-xs">Uploading...</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Fields */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Image {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData.id)}
                          disabled={isUploading}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fileData.title}
                          onChange={(e) => updateFileMetadata(fileData.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          placeholder="Enter image title"
                          disabled={isUploading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={fileData.description}
                          onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          placeholder="Describe your image..."
                          rows={2}
                          disabled={isUploading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <TagInput
                          value={fileData.tags}
                          onChange={(tags) => updateFileMetadata(fileData.id, 'tags', tags)}
                          suggestions={existingTags}
                          placeholder="Add tags..."
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <ProgressBar
              progress={uploadProgress}
              label={`Uploading ${currentUploadIndex + 1} of ${files.length}`}
              showPercentage
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              files.forEach(file => URL.revokeObjectURL(file.preview));
              setFiles([]);
              setCommonTags([]);
            }}
            disabled={isUploading}
          >
            Clear All
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleUpload}
            disabled={!canUpload}
            isLoading={isUploading}
            size="lg"
            data-testid="upload-submit"
          >
            Upload {files.length > 1 ? `${files.length} Images` : 'Image'}
          </Button>
        </div>
      )}
    </div>
  );
}
