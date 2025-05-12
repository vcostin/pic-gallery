import { describe, it, expect } from '@jest/globals';
import { 
  mapGalleryImageToDisplayImage, 
  mapGalleryImagesToDisplayImages,
  findImageInGallery,
  findImageInGalleryIndex,
  DisplayGallery
} from '../typeMappers';
import { z } from 'zod';
import { ImageInGallerySchema } from '../../schemas';

describe('Type Mapper Utils', () => {
  // Sample data for testing
  const sampleImageInGallery = {
    id: 'img-in-gallery-1',
    imageId: 'image-1',
    galleryId: 'gallery-1',
    order: 0,
    description: 'Gallery-specific description',
    createdAt: new Date(),
    image: {
      id: 'image-1',
      url: 'https://example.com/image.jpg',
      title: 'Test Image',
      description: 'Original image description',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [{ id: 'tag-1', name: 'test' }]
    }
  } as z.infer<typeof ImageInGallerySchema>;

  const sampleGallery = {
    id: 'gallery-1',
    title: 'Test Gallery',
    description: 'Test Gallery Description',
    userId: 'user-1',
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      name: 'Test User',
      image: null
    },
    images: [sampleImageInGallery]
  } as DisplayGallery;

  describe('mapGalleryImageToDisplayImage', () => {
    it('should map ImageInGallery to DisplayImage', () => {
      const result = mapGalleryImageToDisplayImage(sampleImageInGallery);
      
      expect(result).toEqual({
        id: 'image-1',
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        description: 'Gallery-specific description',
        tags: [{ id: 'tag-1', name: 'test' }]
      });
    });

    it('should handle missing image data', () => {
      const imageWithoutData = { 
        ...sampleImageInGallery, 
        image: undefined,
        imageId: 'image-2'
      };
      
      const result = mapGalleryImageToDisplayImage(imageWithoutData);
      
      expect(result).toEqual({
        id: 'image-2',
        url: '',
        title: 'Image not found'
      });
    });
  });

  describe('mapGalleryImagesToDisplayImages', () => {
    it('should map an array of ImageInGallery to DisplayImage', () => {
      const result = mapGalleryImagesToDisplayImages([sampleImageInGallery]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('image-1');
      expect(result[0].description).toBe('Gallery-specific description');
    });

    it('should filter out items without image data', () => {
      const imageWithoutData = { 
        ...sampleImageInGallery, 
        image: undefined
      };
      
      const result = mapGalleryImagesToDisplayImages([sampleImageInGallery, imageWithoutData]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('image-1');
    });
  });

  describe('findImageInGallery', () => {
    it('should find the correct ImageInGallery by image ID', () => {
      const result = findImageInGallery(sampleGallery, 'image-1');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('img-in-gallery-1');
    });

    it('should return undefined when image not found', () => {
      const result = findImageInGallery(sampleGallery, 'non-existent');
      
      expect(result).toBeUndefined();
    });
  });

  describe('findImageInGalleryIndex', () => {
    it('should find the correct index by image ID', () => {
      const result = findImageInGalleryIndex(sampleGallery, 'image-1');
      
      expect(result).toBe(0);
    });

    it('should return -1 when image not found', () => {
      const result = findImageInGalleryIndex(sampleGallery, 'non-existent');
      
      expect(result).toBe(-1);
    });
  });
});
