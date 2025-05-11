/**
 * Example component showing usage of Zod schemas and type-safe API hooks
 * This component would show gallery details and allow editing
 */
'use client';

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useGallery } from '@/lib/hooks/useGallery';
import { UpdateGallerySchema } from '@/lib/schemas';
import { LoadingSpinner, ErrorMessage } from '@/components/StatusMessages';

type GalleryUpdateData = z.infer<typeof UpdateGallerySchema>;

interface GalleryEditorProps {
  galleryId: string;
}

export function GalleryEditor({ galleryId }: GalleryEditorProps) {
  const { gallery, loading, error, fetchGallery, updateGallery } = useGallery(galleryId);
  const [formData, setFormData] = useState<GalleryUpdateData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Initial fetch and form setup
  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Update form data when gallery data is loaded
  useEffect(() => {
    if (gallery) {
      setFormData({
        id: gallery.id,
        title: gallery.title,
        description: gallery.description || undefined,
        isPublic: gallery.isPublic,
        coverImageId: gallery.coverImageId || null,
        
        // Theming options
        themeColor: gallery.themeColor,
        backgroundColor: gallery.backgroundColor,
        backgroundImageUrl: gallery.backgroundImageUrl,
        accentColor: gallery.accentColor,
        fontFamily: gallery.fontFamily,
        displayMode: gallery.displayMode,
        layoutType: gallery.layoutType,
        
        // Images data
        images: gallery.images.map(img => ({
          id: img.id,
          imageId: img.imageId,
          description: img.description,
          order: img.order
        }))
      });
    }
  }, [gallery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : value
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate data with Zod schema before sending
      const validatedData = UpdateGallerySchema.parse(formData);
      
      const updatedGallery = await updateGallery(validatedData);
      
      if (updatedGallery) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Validation or update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading gallery..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!gallery || !formData) {
    return <p>Gallery not found</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Gallery</h1>
      
      {updateSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Gallery updated successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows={3}
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleInputChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Make gallery public</label>
        </div>
        
        <div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
