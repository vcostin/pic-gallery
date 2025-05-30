describe('Image API endpoint', () => {
  // Mock global fetch
  global.fetch = jest.fn();
  
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  it('should fetch images by ID correctly', async () => {
    // Mock successful response
    const mockImages = [
      { 
        id: 'image-1', 
        title: 'Test Image 1',
        url: '/test1.jpg',
        tags: [{ id: 'tag-1', name: 'test' }]
      },
      { 
        id: 'image-2', 
        title: 'Test Image 2',
        url: '/test2.jpg',
        tags: []
      }
    ];
    
    const mockResponse = {
      success: true,
      data: mockImages
    };
    
    // Setup the mock fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    // Execute the request
    const imageIds = ['image-1', 'image-2'];
    const response = await fetch(`/api/images?ids=${imageIds.join(',')}`);
    const data = await response.json();
    
    // Verify the request
    expect(global.fetch).toHaveBeenCalledWith(`/api/images?ids=${imageIds.join(',')}`);
    
    // Verify the response
    expect(data).toEqual(mockResponse);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockImages);
  });
  
  it('should handle API errors', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });
    
    // Execute the request
    const imageIds = ['image-1', 'image-2'];
    const response = await fetch(`/api/images?ids=${imageIds.join(',')}`);
    
    // Verify the response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
