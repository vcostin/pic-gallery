import { GalleryService } from '@/lib/services/galleryService';
import { FullGallery } from '@/lib/schemas';

// Mock fetchApi function that's used by GalleryService
jest.mock('@/lib/apiUtils', () => ({
  fetchApi: jest.fn()
}));

// Import the mocked fetchApi directly
import { fetchApi } from '@/lib/apiUtils';

describe('Add Images to Gallery Functionality', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GalleryService.addImages', () => {
    it('should call fetchApi with correct parameters', async () => {
      // Setup
      const galleryId = 'test-gallery-123';
      const imageIds = ['image-1', 'image-2', 'image-3'];
      const mockGallery: Partial<FullGallery> = { 
        id: galleryId,
        title: 'Test Gallery',
        images: []
      };
      
      // Mock the fetchApi function to return a success response
      (fetchApi as jest.Mock).mockResolvedValueOnce(mockGallery);
      
      // Act
      await GalleryService.addImages(galleryId, imageIds);
      
      // Assert
      expect(fetchApi).toHaveBeenCalledTimes(1);
      expect(fetchApi).toHaveBeenCalledWith(
        `/api/galleries/${galleryId}`,
        {
          method: 'POST',
          body: JSON.stringify({ imageIds })
        },
        expect.anything() // The schema parameter
      );
    });
    
    it('should return the gallery with updated images', async () => {
      // Setup
      const galleryId = 'test-gallery-123';
      const imageIds = ['image-1', 'image-2'];
      const mockGallery: Partial<FullGallery> = { 
        id: galleryId,
        title: 'Test Gallery',
        images: [
          {
            id: 'gallery-image-1',
            imageId: 'image-1',
            galleryId,
            description: null,
            order: 0,
            createdAt: new Date(),
            image: {
              id: 'image-1',
              title: 'Test Image 1',
              description: null,
              url: 'https://example.com/test1.jpg',
              userId: 'user-123',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: []
            }
          },
          {
            id: 'gallery-image-2',
            imageId: 'image-2',
            galleryId,
            description: null,
            order: 1,
            createdAt: new Date(),
            image: {
              id: 'image-2',
              title: 'Test Image 2',
              description: null,
              url: 'https://example.com/test2.jpg',
              userId: 'user-123',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: []
            }
          }
        ]
      };
      
      // Mock the fetchApi function to return the updated gallery
      (fetchApi as jest.Mock).mockResolvedValueOnce(mockGallery);
      
      // Act
      const result = await GalleryService.addImages(galleryId, imageIds);
      
      // Assert
      expect(result).toEqual(mockGallery);
      expect(result.images.length).toBe(2);
      expect(result.images[0].image.id).toBe('image-1');
      expect(result.images[1].image.id).toBe('image-2');
    });
    
    it('should throw an error when API call fails', async () => {
      // Setup
      const galleryId = 'test-gallery-123';
      const imageIds = ['image-1', 'image-2'];
      const errorMessage = 'Failed to add images';
      
      // Mock fetchApi to throw an error
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      // Act & Assert
      await expect(
        GalleryService.addImages(galleryId, imageIds)
      ).rejects.toThrow(errorMessage);
    });
  });
});
