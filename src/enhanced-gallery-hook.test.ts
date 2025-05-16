import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedGalleryImages } from './lib/hooks/useEnhancedGallery';
import { GalleryService } from './lib/services/galleryService';
import { FullGallery, FullImageInGallery } from './lib/schemas';

// Mock the GalleryService
jest.mock('./lib/services/galleryService', () => ({
  GalleryService: {
    getGallery: jest.fn(),
    addImages: jest.fn(),
    removeImage: jest.fn()
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
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Verify gallery was fetched and state was updated
    expect(GalleryService.getGallery).toHaveBeenCalledWith(mockGalleryId);
    expect(result.current.gallery).toEqual(mockGallery);
    expect(result.current.images).toEqual(mockGallery.images);
  });

  it('should add images to gallery when addImages is called', async () => {
    // Setup mock responses
    const initialImages: FullImageInGallery[] = [];
    const imageIds = ['new-image-1', 'new-image-2'];
    const mockGallery = createMockGallery();
    const updatedGallery = createMockGallery(2);
    
    // Mock both services to prevent the undefined error in the useEffect
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.addImages as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, initialImages)
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Call addImages
    await act(async () => {
      result.current.addImages(imageIds);
    });
    
    // Wait for the state to update from addImages
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
    // Setup mock responses
    const mockGallery = createMockGallery();
    const errorMessage = 'Failed to add images';
    
    // Mock getGallery for the useEffect and reject addImages
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.addImages as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Call addImages
    await act(async () => {
      result.current.addImages(['new-image-1']);
    });
    
    // Wait for the error state to update
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
    
    // Verify error was set correctly
    expect(result.current.error?.message).toBe(errorMessage);
    
    // Verify toast shows error message
    expect(result.current.toastMessage).toContain('Error adding images');
    expect(result.current.showSuccessToast).toBe(true);
  });
});
