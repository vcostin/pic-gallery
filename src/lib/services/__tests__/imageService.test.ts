import { ImageService, type Image, type CreateImageData, type UpdateImageData } from '@/lib/services/imageService';
import { fetchApi } from '@/lib/apiUtils';

// Mock the fetchApi function
jest.mock('@/lib/apiUtils', () => ({
  fetchApi: jest.fn()
}));

// Mock for fetchApi implementation
const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

// Mock the fetch API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Sample test data
const mockImage: Image = {
  id: 'image1',
  title: 'Test Image',
  url: 'https://example.com/test.jpg',
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: []
};    const mockPaginatedImages = {
  data: [mockImage],
  meta: {
    total: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  }
};

describe('ImageService', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetchApi.mockReset();
    mockFetch.mockReset();
    
    // Default mock implementation for fetchApi
    mockFetchApi.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/images?') || url === '/api/images') {
        return mockPaginatedImages;
      } else if (url === '/api/images/image1') {
        return mockImage;
      } else if (url.startsWith('/api/users/')) {
        return [mockImage];
      }
      return mockImage;
    });

    // Default mock implementation for fetch
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { url: 'https://example.com/test.jpg' } 
        })
      } as Response)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get images with pagination', async () => {
    // Override mockFetchApi for this test
    mockFetchApi.mockResolvedValueOnce({
      success: true,
      data: mockPaginatedImages
    });
    
    const result = await ImageService.getImages();
    
    expect(mockFetchApi).toHaveBeenCalledWith('/api/images', { signal: undefined }, expect.any(Object));
    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
  
  it('should get images with search parameters', async () => {
    await ImageService.getImages({
      searchQuery: 'test',
      tag: 'nature', 
      page: 2, 
      limit: 20
    });
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/images?searchQuery=test&tag=nature&page=2&limit=20',
      { signal: undefined },
      expect.any(Object)
    );
  });

  it('should get a single image by ID', async () => {
    const result = await ImageService.getImage('image1');
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/images/image1',
      { signal: undefined },
      expect.any(Object)
    );
    expect(result).toEqual(mockImage);
  });

  it('should create an image', async () => {
    const imageData: CreateImageData = {
      title: 'New Image',
      url: 'https://example.com/new.jpg',
      tags: ['tag1', 'tag2']
    };
    
    await ImageService.createImage(imageData);
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/images',
      {
        method: 'POST',
        body: JSON.stringify(imageData),
        signal: undefined
      },
      expect.any(Object)
    );
  });

  it('should update an image', async () => {
    const imageData: UpdateImageData = {
      id: 'image1',
      title: 'Updated Image',
      tags: ['updated']
    };
    
    await ImageService.updateImage('image1', imageData);
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/images/image1',
      {
        method: 'PATCH',
        body: JSON.stringify(imageData),
        signal: undefined
      },
      expect.any(Object)
    );
  });

  it('should delete an image', async () => {
    await ImageService.deleteImage('image1');
    
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/images/image1',
      {
        method: 'DELETE',
        signal: undefined
      }
    );
  });

  it('should get images for a user', async () => {
    const result = await ImageService.getUserImages('user1');
    
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/api/users/user1/images',
      { signal: undefined },
      expect.any(Object)
    );
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(1);
  });
  
  describe('uploadAndCreateImage', () => {
    it('should upload a file and create an image', async () => {
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const imageData = { title: 'Uploaded Image' };
      
      // Spy on the createImage method
      const createImageSpy = jest.spyOn(ImageService, 'createImage');
      createImageSpy.mockResolvedValueOnce(mockImage);
      
      // Call the method
      const result = await ImageService.uploadAndCreateImage(file, imageData);
      
      // Check if fetch was called for upload
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      
      // Check if createImage was called with the right data
      expect(createImageSpy).toHaveBeenCalledWith(
        {
          ...imageData,
          url: 'https://example.com/test.jpg'
        },
        undefined
      );
      
      // Check result
      expect(result).toEqual(mockImage);
      
      // Clean up
      createImageSpy.mockRestore();
    });
    
    it('should handle upload failure', async () => {
      // Mock fetch to return an error
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ 
            error: 'Upload failed' 
          })
        } as Response)
      );
      
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const imageData = { title: 'Uploaded Image' };
      
      // Expect the method to throw an error
      await expect(ImageService.uploadAndCreateImage(file, imageData))
        .rejects
        .toThrow('Upload failed');
      
      // Make sure createImage was not called
      expect(mockFetchApi).not.toHaveBeenCalledWith(
        '/api/images',
        expect.anything(),
        expect.anything()
      );
    });
    
    it('should handle invalid upload response schema', async () => {
      // Mock fetch to return invalid schema
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            // Missing success field
            data: { url: 'https://example.com/test.jpg' } 
          })
        } as Response)
      );
      
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const imageData = { title: 'Uploaded Image' };
      
      // Expect the method to throw a validation error
      await expect(ImageService.uploadAndCreateImage(file, imageData))
        .rejects
        .toThrow();
    });
    
    it('should pass AbortSignal to both requests', async () => {
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const imageData = { title: 'Uploaded Image' };
      
      // Create an AbortController and signal
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Spy on the createImage method
      const createImageSpy = jest.spyOn(ImageService, 'createImage');
      createImageSpy.mockResolvedValueOnce(mockImage);
      
      // Call the method with signal
      await ImageService.uploadAndCreateImage(file, imageData, signal);
      
      // Check if both fetch and createImage were called with the signal
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          signal
        })
      );
      
      expect(createImageSpy).toHaveBeenCalledWith(
        expect.anything(),
        signal
      );
      
      // Clean up
      createImageSpy.mockRestore();
    });
  });
  
  describe('error handling', () => {
    it('should throw an error when creating image with invalid data', async () => {
      // Prepare invalid data (missing required title)
      const invalidImageData = {
        url: 'https://example.com/test.jpg'
      } as CreateImageData;
      
      // Expect validation error
      await expect(ImageService.createImage(invalidImageData))
        .rejects
        .toThrow();
      
      // Verify fetchApi was not called
      expect(mockFetchApi).not.toHaveBeenCalled();
    });
    
    it('should throw an error when updating image with invalid data', async () => {
      // Prepare invalid data (empty title)
      const invalidImageData = {
        id: 'image1',
        title: ''
      } as UpdateImageData;
      
      // Expect validation error
      await expect(ImageService.updateImage('image1', invalidImageData))
        .rejects
        .toThrow();
      
      // Verify fetchApi was not called
      expect(mockFetchApi).not.toHaveBeenCalled();
    });
    
    it('should propagate API errors from fetchApi', async () => {
      // Mock fetchApi to throw an error
      mockFetchApi.mockRejectedValueOnce(new Error('API error'));
      
      // Expect the error to be propagated
      await expect(ImageService.getImage('image1'))
        .rejects
        .toThrow('API error');
    });
    
    it('should handle API response validation errors', async () => {
      // Mock fetchApi to throw a validation error
      mockFetchApi.mockImplementationOnce(() => {
        throw new Error('Validation failed: expected string, received number at "id"');
      });
      
      // Expect validation error
      await expect(ImageService.getImage('image1'))
        .rejects
        .toThrow('Validation failed');
    });
  });
  
  describe('with AbortController', () => {
    it('should pass AbortSignal to fetch requests', async () => {
      const controller = new AbortController();
      const signal = controller.signal;
      
      await ImageService.getImages({}, signal);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/api/images',
        { signal },
        expect.any(Object)
      );
      
      await ImageService.getImage('image1', signal);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/api/images/image1',
        { signal },
        expect.any(Object)
      );
      
      await ImageService.deleteImage('image1', signal);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/images/image1',
        {
          method: 'DELETE',
          signal
        }
      );
    });
    
    it('should handle aborted requests', async () => {
      // Create controller and abort it
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Mock the abort error
      mockFetchApi.mockImplementationOnce(() => {
        throw new DOMException('The operation was aborted', 'AbortError');
      });
      
      // Expect abort error to be propagated
      await expect(ImageService.getImage('image1', signal))
        .rejects
        .toThrow('The operation was aborted');
    });
  });
});
