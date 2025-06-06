'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface DragDropZoneProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function DragDropZone({
  onFilesSelected,
  accept = 'image/*',
  maxFiles = 1,
  maxFileSize = 4 * 1024 * 1024, // 4MB default
  className = '',
  disabled = false,
  children
}: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const validateFiles = useCallback((files: FileList): { valid: FileList; error?: string } => {
    if (files.length > maxFiles) {
      return { valid: files, error: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed` };
    }

    const oversizedFiles = Array.from(files).filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const maxSizeMB = maxFileSize / (1024 * 1024);
      return { valid: files, error: `File size must be less than ${maxSizeMB}MB` };
    }

    return { valid: files };
  }, [maxFiles, maxFileSize]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
      setDragError(null);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setDragError(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setDragError(null);

    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const validation = validateFiles(files);
      if (validation.error) {
        setDragError(validation.error);
        return;
      }
      onFilesSelected(files);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validation = validateFiles(files);
      if (validation.error) {
        setDragError(validation.error);
        return;
      }
      onFilesSelected(files);
    }
  }, [validateFiles, onFilesSelected]);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${dragError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-input')?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload area. ${isDragActive ? 'Drop files to upload' : 'Click to select files or drag and drop'}`}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            document.getElementById('file-input')?.click();
          }
        }}
        data-testid="upload-area"
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
          data-testid="file-input"
        />

        {children || (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              {isDragActive ? (
                <CloudArrowUpIcon className="w-full h-full text-blue-500" />
              ) : (
                <PhotoIcon className="w-full h-full" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? 'Drop your images here' : 'Drag and drop your images here'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to browse
              </p>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>Supports JPG, PNG, WebP up to {formatFileSize(maxFileSize)}</p>
              {maxFiles > 1 && <p>Maximum {maxFiles} files</p>}
            </div>
          </div>
        )}
      </div>

      {dragError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-400 text-sm">
          {dragError}
        </div>
      )}
    </div>
  );
}
