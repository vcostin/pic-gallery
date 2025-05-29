/**
 * Example of a form using Zod schemas for validation
 * This shows how to combine React Hook Form with Zod schemas
 * 
 * NOTE: This is a demonstration file and may have TypeScript errors
 * since the dependencies are not actually installed. These errors can be ignored.
 * For actual implementation, you would need:
 * npm install react-hook-form @hookform/resolvers
 * 
 * @example - Typescript errors are expected and can be ignored for this example
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// Example: Use these imports for real implementation
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateGallerySchema } from '@/lib/schemas';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorMessage } from '@/components/StatusMessages';

// Mock module declarations for the example
declare module 'react-hook-form' {
  export function useForm<T>(props?: any): {
    register: (name: keyof T) => any;
    handleSubmit: (fn: (data: T) => void) => (e: React.FormEvent) => void;
    formState: { 
      errors: {
        title?: { message?: string };
        description?: { message?: string };
      } 
    }
  };
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: z.ZodType<any>): any;
}

// Use the declarations
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the form schema based on CreateGallerySchema
const galleryFormSchema = CreateGallerySchema.pick({
  title: true,
  description: true,
  isPublic: true,
  themeColor: true,
  backgroundColor: true,
  fontFamily: true,
  displayMode: true,
  layoutType: true,
});

// Define the form data type from the schema
type GalleryFormData = z.infer<typeof galleryFormSchema>;

export default function CreateGalleryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GalleryFormData>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
      themeColor: '#000000',
      backgroundColor: '#ffffff',
      fontFamily: 'sans-serif',
      displayMode: 'grid',
      layoutType: 'standard',
    },
  });

  // Form submission handler
  const onSubmit = async (data: GalleryFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create gallery');
      }

      const result = await response.json();
      router.push(`/galleries/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorMessage error={error} />}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          id="title"
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          {...register('title')}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="isPublic"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...register('isPublic')}
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
          Make this gallery public
        </label>
      </div>

      <div className="flex space-x-2">
        <Button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size="small" /> : 'Create Gallery'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="py-2 px-4"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
