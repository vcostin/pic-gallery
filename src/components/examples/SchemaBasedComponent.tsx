/**
 * Component template using schema-derived types
 * Use this as a starting point when creating new components or refactoring existing ones
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { ImageSchema, GallerySchema } from '@/lib/schemas';
import { useApi } from '@/lib/hooks/useApi';
import { ErrorMessage, LoadingSpinner } from '@/components/StatusMessages';

// Create a response schema for the API
const GalleryWithImagesSchema = GallerySchema.extend({
  images: z.array(
    z.object({
      id: z.string(),
      description: z.string().nullable(),
      image: ImageSchema,
    })
  ),
});

// Define component props
interface SchemaBasedComponentProps {
  galleryId: string;
}

export function SchemaBasedComponent({ galleryId }: SchemaBasedComponentProps) {
  // Use schema-validated API hook
  const { data, isLoading, error, fetch } = useApi(GalleryWithImagesSchema);
  
  // Initialize component
  React.useEffect(() => {
    if (galleryId) {
      fetch(`/api/galleries/${galleryId}`);
    }
  }, [galleryId, fetch]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  // Handle no data state
  if (!data) {
    return <p>No gallery data available</p>;
  }
  
  // Render component with validated data
  return (
    <div>
      <h1 className="text-2xl font-bold">{data.title}</h1>
      {data.description && <p className="text-gray-600">{data.description}</p>}
      
      {/* Render gallery images */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {data.images.map(item => (
          <div key={item.id} className="border rounded-md overflow-hidden">
            <div className="relative w-full h-48">
              <Image 
                src={item.image.url} 
                alt={item.image.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <h3 className="font-semibold">{item.image.title}</h3>
              {item.description && <p className="text-sm">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Usage example:
 * 
 * ```tsx
 * <SchemaBasedComponent galleryId="gallery-123" />
 * ```
 */
