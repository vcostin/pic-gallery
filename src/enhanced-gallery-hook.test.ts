import { renderHook, act } from '@testing-library/react';
import { useEnhancedGalleryImages } from '@/lib/hooks/useEnhancedGallery';
import { GalleryService } from '@/lib/services/galleryService';
import { FullGallery, FullImageInGallery } from '@/lib/schemas';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

// Mock the GalleryService API
jest.mock('@/lib/services/galleryService');

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true,
});

// Mock fetch for testing addImages when galleryId is not available
global.fetch = jest.fn();

describe('useEnhancedGalleryImages', () => {
  const mockGalleryId = 'gallery-123';
  
  const mockImages: FullImageInGallery[] = [
    {
      id: 'img1-in-gallery',
      imageId: 'img1',
      galleryId: mockGalleryId,
      description: 'Image 1 Description',
      order: 0,
      createdAt: new Date(),
      image: {
        id: 'img1',
        title: 'Image 1',
        url: 'http://example.com/img1.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag1', name: 'nature' }]
      }
    },
    {
      id: 'img2-in-gallery',
      imageId: 'img2',
      galleryId: mockGalleryId,
      description: 'Image 2 Description',
      order: 1,
      createdAt: new Date(),
      image: {
        id: 'img2',
        title: 'Image 2',
        url: 'http://example.com/img2.jpg',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ id: 'tag2', name: 'landscape' }]
      }
    }
  ];

  const mockGallery: FullGallery = {
    id: mockGalleryId,
    title: 'Test Gallery',
    description: 'Test Gallery Description',
    userId: 'user-123',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      name: 'Test User',
      image: null
    },
    images: mockImages
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mock implementations
    (GalleryService.getGallery as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.addImages as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.removeImage as jest.Mock).mockResolvedValue(mockGallery);
    (GalleryService.updateImageOrder as jest.Mock).mockResolvedValue(mockGallery);
    
    // Mock fetch for adding images without galleryId
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: [
            {
              id: 'img3',
              title: 'Image 3',
              url: 'http://example.com/img3.jpg',
              userId: 'user-123',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: []
            }
          ]
        }
      })
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('should load gallery data when galleryId is provided', async () => {
    // Create a mock for the API promise resolution
    const mockGetGalleryPromise = Promise.resolve(mockGallery);
    (GalleryService.getGallery as jest.Mock).mockReturnValue(mockGetGalleryPromise);

    let hookResult: ReturnType<typeof renderHook<ReturnType<typeof useEnhancedGalleryImages>, string>>;
    
    // Wrap the entire hook rendering and initial effect in act()
    await act(async () => {
      hookResult = renderHook(() => useEnhancedGalleryImages(mockGalleryId));
      
      // Wait for the promise to resolve and state to update
      await mockGetGalleryPromise;
    });
    
    // Run any pending timers
    act(() => {
      jest.runAllTimers();
    });
    
    // After promise resolves, loading should be false
    expect(hookResult!.result.current.loading).toBe(false);
    expect(GalleryService.getGallery).toHaveBeenCalledWith(mockGalleryId);
    expect(hookResult!.result.current.gallery).toEqual(mockGallery);
    expect(hookResult!.result.current.images).toEqual(mockGallery.images);
  });

  test('should handle image description changes', () => {
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, mockImages)
    );
    
    const newDescription = 'Updated description';
    
    act(() => {
      result.current.handleImageDescriptionChange('img1-in-gallery', newDescription);
    });
    
    // Check that the description was updated
    const updatedImage = result.current.images.find(img => img.id === 'img1-in-gallery');
    expect(updatedImage?.description).toBe(newDescription);
  });

  test('should handle removing an image from gallery', async () => {
    // Create a mock for the API promise resolution
    const mockRemoveImagePromise = Promise.resolve(mockGallery);
    (GalleryService.removeImage as jest.Mock).mockReturnValue(mockRemoveImagePromise);
    
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, mockImages)
    );
    
    // Open the remove image dialog
    act(() => {
      result.current.handleRemoveImage('img1-in-gallery');
    });
    
    expect(result.current.showRemoveImageDialog.isOpen).toBe(true);
    expect(result.current.imageToRemove).toBe('img1-in-gallery');
    
    // Confirm removal and wait for the promise to resolve
    await act(async () => {
      result.current.confirmRemoveImage();
      await mockRemoveImagePromise;
    });
    
    // Run timers in a separate act block to handle toast timeout
    await act(async () => {
      jest.runAllTimers();
    });
    
    // After the promise resolves, loading should be false
    expect(result.current.loading).toBe(false);
    // After our batch update changes, we no longer call the API directly
    // expect(GalleryService.removeImage).toHaveBeenCalledWith(mockGalleryId, 'img1-in-gallery');
    expect(result.current.showRemoveImageDialog.isOpen).toBe(false);
    expect(result.current.imageToRemove).toBe(null);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
  
  test('should handle drag and drop to reorder images', async () => {
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(mockGalleryId, mockImages)
    );
    
    // Create mock events
    const dragStartEvent = {
      active: { id: 'img1-in-gallery' }
    } as unknown as DragStartEvent;
    
    const dragEndEvent = {
      active: { id: 'img1-in-gallery' },
      over: { id: 'img2-in-gallery' }
    } as unknown as DragEndEvent;
    
    // Start drag
    act(() => {
      result.current.handleDragStart(dragStartEvent);
    });
    
    expect(result.current.activeImage).not.toBeNull();
    expect(navigator.vibrate).toHaveBeenCalledWith(50);
    
    // End drag
    act(() => {
      result.current.handleDragEnd(dragEndEvent);
    });
    
    // Check if images were reordered
    expect(result.current.images[0].id).toBe('img2-in-gallery');
    expect(result.current.images[1].id).toBe('img1-in-gallery');
    
    // Check if orders were updated
    expect(result.current.images[0].order).toBe(0);
    expect(result.current.images[1].order).toBe(1);
    
    // After our batch update changes, we no longer call the API directly
    // expect(GalleryService.updateImageOrder).toHaveBeenCalledWith(
    //   mockGalleryId,
    //   expect.arrayContaining(['img1-in-gallery', 'img2-in-gallery'])
    // );
    
    // Instead, check if hasUnsavedChanges is set to true
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
  
  test('should add images when galleryId is not available', async () => {
    const { result } = renderHook(() => 
      useEnhancedGalleryImages(undefined, [])
    );
    
    // Add images without a gallery ID
    await act(async () => {
      await result.current.addImages(['img3']);
    });
    
    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/images?ids=img3'));
    
    // First verify loading is false (happens in finally block)
    expect(result.current.loading).toBe(false);
    
    // Verify images were added
    expect(result.current.images.length).toBe(1);
    
    // Verify toast is shown (happens right before setTimeout is called)
    expect(result.current.showSuccessToast).toBe(true);
    
    // Now advance timers to simulate the toast disappearing after 3 seconds
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    
    // Toast should be hidden after timer completes
    expect(result.current.showSuccessToast).toBe(false);
  });
});
