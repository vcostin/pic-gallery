import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedGalleryImages } from './lib/hooks/useEnhancedGallery';
import { GalleryService } from './lib/services/galleryService';
import { FullGallery, FullImageInGallery } from './lib/schemas';
import { DragEndEvent } from '@dnd-kit/core';

// Mock the GalleryService
jest.mock('./lib/services/galleryService', () => ({
  GalleryService: {
    getGallery: jest.fn(),
    addImages: jest.fn(),
    removeImage: jest.fn(),
    updateGallery: jest.fn(),
    updateImageOrder: jest.fn()
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

  // Helper function to create a properly typed DragEndEvent
  function createDragEndEvent(activeId: string, overId: string): DragEndEvent {
    return {
      active: { id: activeId } as any,
      over: { id: overId } as any,
      delta: { x: 0, y: 0 },
      collisions: [],
      canceled: false,
      type: 'dragend'
    };
  }

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

  it('should remove images from gallery when removeImage is called', async () => {
    // Setup mock responses
    const mockGallery = createMockGallery(3);
    const imageToRemove = mockGallery.images[1].id;
    const updatedGallery = {
      ...mockGallery,
      images: mockGallery.images.filter(img => img.id !== imageToRemove)
    };
    
    // Mock service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.removeImage as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Render the hook with the mock gallery ID
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Get initial image count
    const initialImageCount = result.current.images.length;
    
    // Call removeImage
    await act(async () => {
      result.current.removeImage(imageToRemove);
    });
    
    // Verify service was called with correct parameters
    expect(GalleryService.removeImage).toHaveBeenCalledWith(mockGalleryId, imageToRemove);
    
    // Verify state was updated correctly
    expect(result.current.images.length).toBe(initialImageCount - 1);
    expect(result.current.images.some(img => img.id === imageToRemove)).toBe(false);
    
    // Verify toast message was set
    expect(result.current.toastMessage).toContain('Image removed from gallery');
    expect(result.current.showSuccessToast).toBe(true);
  });

  it('should handle errors when removing images', async () => {
    // Setup mock responses
    const mockGallery = createMockGallery(2);
    const errorMessage = 'Failed to remove image';
    
    // Mock getGallery for the useEffect and reject removeImage
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.removeImage as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Call removeImage
    await act(async () => {
      result.current.removeImage(mockGallery.images[0].id);
    });
    
    // Wait for the error state to update
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
    
    // Verify error was set correctly
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should update image order through API when handleDragEnd is called', async () => {
    // Setup mock responses
    const mockGallery = createMockGallery(3);
    const updatedGallery = {
      ...mockGallery,
      images: [
        mockGallery.images[2],
        mockGallery.images[0],
        mockGallery.images[1]
      ].map((img, index) => ({
        ...img,
        order: index
      }))
    };
    
    // Mock service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.updateImageOrder as jest.Mock).mockResolvedValue(updatedGallery);
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Simulate a drag-and-drop event
    const dragEndEvent = createDragEndEvent(mockGallery.images[0].id, mockGallery.images[2].id);
    
    await act(async () => {
      result.current.handleDragEnd(dragEndEvent as any);
    });
    
    // Verify the API was called with the correct parameters
    await waitFor(() => {
      expect(GalleryService.updateImageOrder).toHaveBeenCalledWith(
        mockGalleryId, 
        expect.arrayContaining([mockGallery.images[2].id, mockGallery.images[0].id, mockGallery.images[1].id])
      );
    });
    
    // Verify the state was updated correctly
    expect(result.current.toastMessage).toContain('Image order updated');
  });

  it('should handle errors when updating image order', async () => {
    // Setup mock responses
    const mockGallery = createMockGallery(3);
    const errorMessage = 'Failed to update image order';
    
    // Mock service methods
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.updateImageOrder as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Render the hook
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, [])
    );
    
    // Wait for initial gallery to load
    await waitFor(() => {
      expect(result.current.gallery).not.toBeNull();
    });
    
    // Simulate a drag-and-drop event
    const dragEndEvent = createDragEndEvent(mockGallery.images[0].id, mockGallery.images[2].id);
    
    await act(async () => {
      result.current.handleDragEnd(dragEndEvent as any);
    });
    
    // Verify the error was set correctly
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
    
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.toastMessage).toContain('Error updating image order');
  });
});
