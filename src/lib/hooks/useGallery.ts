/**
 * Custom hooks for interacting with galleries
 */
import { useState, useCallback } from 'react';
import { GalleryService } from '../services/galleryService';
import { GallerySchema, UpdateGallerySchema, CreateGallerySchema } from '../schemas';
import { z } from 'zod';

type FullGallery = Awaited<ReturnType<typeof GalleryService.getGallery>>;
type GalleryCreationData = z.infer<typeof CreateGallerySchema>;
type GalleryUpdateData = z.infer<typeof UpdateGallerySchema>;

/**
 * Hook for fetching a gallery by ID
 */
export function useGallery(id: string | undefined) {
  const [gallery, setGallery] = useState<FullGallery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGallery = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.getGallery(id);
      setGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateGallery = useCallback(async (updateData: GalleryUpdateData) => {
    if (!id) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.updateGallery(id, updateData);
      setGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return {
    gallery,
    loading,
    error,
    fetchGallery,
    updateGallery
  };
}

/**
 * Hook for creating a new gallery
 */
export function useCreateGallery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [newGallery, setNewGallery] = useState<FullGallery | null>(null);

  const createGallery = useCallback(async (galleryData: GalleryCreationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.createGallery(galleryData);
      setNewGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    newGallery,
    createGallery
  };
}

/**
 * Hook for managing gallery images
 */
export function useGalleryImages(galleryId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gallery, setGallery] = useState<FullGallery | null>(null);

  const addImages = useCallback(async (imageIds: string[]) => {
    if (!galleryId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await GalleryService.addImages(galleryId, imageIds);
      setGallery(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  const removeImage = useCallback(async (imageInGalleryId: string) => {
    if (!galleryId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await GalleryService.removeImage(galleryId, imageInGalleryId);
      
      // Update local state to remove the image
      setGallery(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.filter(img => img.id !== imageInGalleryId)
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  return {
    gallery,
    loading,
    error,
    addImages,
    removeImage
  };
}
