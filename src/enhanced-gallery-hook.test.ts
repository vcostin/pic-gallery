import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedGalleryImages } from './lib/hooks/useEnhancedGallery';
import { GalleryService } from './lib/services/galleryService';
import { FullGallery, FullImageInGallery } from './lib/schemas';

// Mock the GalleryService
jest.mock('./lib/services/galleryService', () => ({
  GalleryService: {
    getGallery: jest.fn(),
    addImages: jest.fn(),
    removeImage: jest.fn(),
    updateGallery: jest.fn() // Add this to support the internal implementation
  }
}));

// Mock the logger to avoid console noise during tests
jest.mock('./lib/logger', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('useEnhancedGalleryImages hook', () => {
  const mockGalleryId = 'gallery-123';
  const createMockGallery = (imageCount = 2): FullGallery => ({
    id: mockGalleryId,
    title: 'Test Gallery',
    description: 'A test gallery',
    isPublic: true,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    images: Array.from({ length: imageCount }).map((_, i) => ({
      id: `gallery-image-${i}`,
      imageId: `image-${i}`,
      galleryId: mockGalleryId,
      description: null,
      order: i,
      createdAt: new Date(),
      image: {
        id: `image-${i}`,
        title: `Test Image ${i}`,
        description: null,
        url: `https://example.com/test${i}.jpg`,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      }
    })) as FullImageInGallery[],
    user: {
      id: 'user-123',
      name: 'Test User',
      image: null
    },
    coverImage: null
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize with empty images when no gallery ID is provided', () => {
    // Render the hook with no gallery ID
    const { result } = renderHook(() => useEnhancedGalleryImages(undefined, []));
    
    // Verify that images are initialized as empty array
    expect(result.current.images).toEqual([]);
    expect(result.current.gallery).toBeNull();
  });

  it('should fetch gallery data when gallery ID is provided', async () => {
    // Setup mock response
    const mockGallery = createMockGallery();
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    
    // Render the hook with a gallery ID
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Initially, images should be empty
    expect(result.current.images).toEqual([]);
    
    // Wait for the useEffect to complete
    await waitFor(() => {
      expect(result.current.gallery).toEqual(mockGallery);
    });
    
    // Verify gallery was fetched and state was updated
    expect(GalleryService.getGallery).toHaveBeenCalledWith(mockGalleryId);
    expect(result.current.images).toEqual(mockGallery.images);
  });

  it('should add images to gallery when addImages is called', async () => {
    // Setup mock response
    const initialImages: FullImageInGallery[] = [];
    const imageIds = ['new-image-1', 'new-image-2'];
    const updatedGallery = createMockGallery(2);
    
    // Mock the service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(updatedGallery);
    (GalleryService.addImages as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, initialImages)
    );
    
    // Call addImages
    await act(async () => {
      result.current.addImages(imageIds);
    });
    
    // Wait for state to update
    await waitFor(() => {
      expect(result.current.gallery).toEqual(updatedGallery);
    });
    
    // Verify service was called with correct parameters
    expect(GalleryService.addImages).toHaveBeenCalledWith(mockGalleryId, imageIds);
    
    // Verify state was updated with new images
    expect(result.current.images).toEqual(updatedGallery.images);
    
    // Verify toast message was set
    expect(result.current.toastMessage).toContain(`Added ${imageIds.length} image`);
    expect(result.current.showSuccessToast).toBe(true);
  });

  it('should handle errors when adding images', async () => {
    // Setup mock error
    const errorMessage = 'Failed to add images';
    const mockGallery = createMockGallery(1);
    
    // Mock the service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.addImages as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Call addImages
    await act(async () => {
      result.current.addImages(['new-image-1']);
    });
    
    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
    
    // Verify error was set correctly
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    
    // Verify toast shows error message
    expect(result.current.toastMessage).toContain('Error adding images');
    expect(result.current.showSuccessToast).toBe(true);
  });

  it('should remove image from gallery when removeImage is called', async () => {
    // Setup mock initial gallery and updated gallery after removal
    const initialGallery = createMockGallery(3); // Gallery with 3 images
    const imageToRemoveId = initialGallery.images[1].id; // Remove the middle image
    const updatedGallery = {
      ...initialGallery,
      images: initialGallery.images.filter(img => img.id !== imageToRemoveId)
    };
    
    // Set up mocks
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(initialGallery);
    (GalleryService.removeImage as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Render the hook with the initial gallery
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, initialGallery.images)
    );
    
    // Call removeImage
    await act(async () => {
      result.current.removeImage(imageToRemoveId);
    });
    
    // Wait for state to update
    await waitFor(() => {
      expect(result.current.gallery).toEqual(updatedGallery);
    });
    
    // Verify service was called with correct parameters
    expect(GalleryService.removeImage).toHaveBeenCalledWith(mockGalleryId, imageToRemoveId);
    
    // Verify state was updated with updated gallery
    expect(result.current.images).toEqual(updatedGallery.images);
    
    // Verify toast message was set
    expect(result.current.toastMessage).toBe('Image removed from gallery');
    expect(result.current.showSuccessToast).toBe(true);
  });

  it('should handle errors when removing images', async () => {
    // Setup mock error
    const errorMessage = 'Failed to remove image';
    
    // Setup initial gallery
    const initialGallery = createMockGallery(2);
    const imageToRemoveId = initialGallery.images[0].id;
    
    // Mock the service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(initialGallery);
    (GalleryService.removeImage as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Render the hook with initial gallery
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, initialGallery.images)
    );
    
    // Call removeImage
    await act(async () => {
      result.current.removeImage(imageToRemoveId);
    });
    
    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
    
    // Verify error was set correctly
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    
    // Verify toast shows error message
    expect(result.current.toastMessage).toContain('Error removing image');
    expect(result.current.showSuccessToast).toBe(true);
  });
});
