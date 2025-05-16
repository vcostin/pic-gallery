import { GalleryService } from './lib/services/galleryService';

// Use a mocked fetch to avoid actual API calls
global.fetch = jest.fn();

describe('GalleryService.removeImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });
  });

  it('should call the correct endpoint with DELETE method', async () => {
    const galleryId = 'gallery-123';
    const imageInGalleryId = 'image-in-gallery-456';
    
    await GalleryService.removeImage(galleryId, imageInGalleryId);
    
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/galleries/${galleryId}/images/${imageInGalleryId}`,
      { method: 'DELETE' }
    );
  });

  it('should throw an error when the API call fails', async () => {
    const galleryId = 'gallery-123';
    const imageInGalleryId = 'image-in-gallery-456';
    
    // Mock a failed response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    await expect(
      GalleryService.removeImage(galleryId, imageInGalleryId)
    ).rejects.toThrow();
  });
});
