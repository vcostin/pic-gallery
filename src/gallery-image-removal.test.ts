import { GalleryService } from './lib/services/galleryService';
import { FullGallery } from './lib/schemas';

// Mock GalleryService.getGallery and GalleryService.updateGallery
jest.mock('./lib/services/galleryService', () => {
  const actualService = jest.requireActual('./lib/services/galleryService');
  return {
    GalleryService: {
      ...actualService.GalleryService,
      getGallery: jest.fn(),
      updateGallery: jest.fn(),
      // Keep the removeImage method as is
      removeImage: actualService.GalleryService.removeImage
    }
  };
});

describe('GalleryService.removeImage', () => {
  const galleryId = 'gallery-123';
  const imageInGalleryId = 'image-in-gallery-456';
  const imageId = 'image-456';
  
  // Create a mock gallery
  const createMockGallery = (): FullGallery => ({
    id: galleryId,
    title: 'Test Gallery',
    description: 'A test gallery',
    isPublic: true,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    coverImageId: null,
    images: [
      {
        id: imageInGalleryId,
        imageId: imageId,
        galleryId: galleryId,
        description: null,
        order: 0,
        createdAt: new Date(),
        image: {
          id: imageId,
          title: 'Test Image',
          description: null,
          url: 'https://example.com/test.jpg',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        }
      },
      {
        id: 'image-in-gallery-789',
        imageId: 'image-789',
        galleryId: galleryId,
        description: null,
        order: 1,
        createdAt: new Date(),
        image: {
          id: 'image-789',
          title: 'Another Test Image',
          description: null,
          url: 'https://example.com/another-test.jpg',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        }
      }
    ],
    user: {
      id: 'user-123',
      name: 'Test User',
      image: null
    },
    coverImage: null
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get the gallery and update it without the removed image', async () => {
    // Create mock gallery data
    const mockGallery = createMockGallery();
    const updatedGallery = {
      ...mockGallery,
      images: mockGallery.images.filter(img => img.id !== imageInGalleryId)
    };
    
    // Setup mocks
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.updateGallery as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Call removeImage
    const result = await GalleryService.removeImage(galleryId, imageInGalleryId);
    
    // Verify getGallery was called
    expect(GalleryService.getGallery).toHaveBeenCalledWith(galleryId);
    
    // Verify updateGallery was called with filtered images
    expect(GalleryService.updateGallery).toHaveBeenCalled();
    const updateCall = (GalleryService.updateGallery as jest.Mock).mock.calls[0];
    expect(updateCall[0]).toBe(galleryId);
    expect(updateCall[1].images.length).toBe(mockGallery.images.length - 1);
    expect(updateCall[1].images.some(img => img.id === imageInGalleryId)).toBe(false);
    
    // Verify result
    expect(result).toBe(updatedGallery);
  });

  it('should handle cover image removal correctly', async () => {
    // Create mock gallery with a cover image that will be removed
    const mockGallery = createMockGallery();
    mockGallery.coverImageId = imageId; // Set the image to be removed as the cover image
    
    const updatedGallery = {
      ...mockGallery,
      coverImageId: null,
      images: mockGallery.images.filter(img => img.id !== imageInGalleryId)
    };
    
    // Setup mocks
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.updateGallery as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Call removeImage
    await GalleryService.removeImage(galleryId, imageInGalleryId);
    
    // Verify updateGallery was called with coverImageId set to null
    const updateCall = (GalleryService.updateGallery as jest.Mock).mock.calls[0];
    expect(updateCall[1].coverImageId).toBeNull();
  });

  it('should propagate errors from the API calls', async () => {
    // Setup mock error
    const errorMessage = 'Failed to get gallery';
    (GalleryService.getGallery as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Verify error is propagated
    await expect(GalleryService.removeImage(galleryId, imageInGalleryId)).rejects.toThrow(errorMessage);
  });
});
