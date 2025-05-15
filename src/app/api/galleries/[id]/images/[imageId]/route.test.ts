import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from '@/lib/apiResponse';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { DELETE } from './route';

// Mock external dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    gallery: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    imageInGallery: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/apiResponse', () => ({
  apiSuccess: jest.fn(),
  apiError: jest.fn(),
  apiUnauthorized: jest.fn(),
  apiNotFound: jest.fn(),
}));

describe('Gallery Image Deletion API', () => {
  const mockParams = {
    id: 'gallery-123',
    imageId: 'image-in-gallery-456',
  };
  
  const mockRequest = {} as Request;
  const mockSession = {
    user: { id: 'user-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.gallery.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-123' });
    (prisma.imageInGallery.findUnique as jest.Mock).mockResolvedValue({ 
      id: 'image-in-gallery-456', 
      galleryId: 'gallery-123',
      imageId: 'actual-image-789'
    });
    (prisma.imageInGallery.delete as jest.Mock).mockResolvedValue({});
    (prisma.gallery.update as jest.Mock).mockResolvedValue({});
  });

  it('should return unauthorized if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    await DELETE(mockRequest, { params: mockParams });
    
    expect(apiUnauthorized).toHaveBeenCalled();
  });

  it('should return not found if gallery does not exist', async () => {
    (prisma.gallery.findUnique as jest.Mock).mockResolvedValue(null);
    
    await DELETE(mockRequest, { params: mockParams });
    
    expect(apiNotFound).toHaveBeenCalledWith('Gallery not found');
  });

  it('should return unauthorized if user does not own gallery', async () => {
    (prisma.gallery.findUnique as jest.Mock).mockResolvedValue({ userId: 'other-user-id' });
    
    await DELETE(mockRequest, { params: mockParams });
    
    expect(apiUnauthorized).toHaveBeenCalled();
  });

  it('should return not found if image is not in gallery', async () => {
    (prisma.imageInGallery.findUnique as jest.Mock).mockResolvedValue(null);
    
    await DELETE(mockRequest, { params: mockParams });
    
    expect(apiNotFound).toHaveBeenCalledWith('Image not found in gallery');
  });

  it('should return error if image does not belong to this gallery', async () => {
    (prisma.imageInGallery.findUnique as jest.Mock).mockResolvedValue({ 
      id: 'image-in-gallery-456', 
      galleryId: 'other-gallery-id',
      imageId: 'actual-image-789'
    });
    
    await DELETE(mockRequest, { params: mockParams });
    
    expect(apiError).toHaveBeenCalledWith('Image does not belong to this gallery', 400);
  });

  it('should delete the image and return success', async () => {
    await DELETE(mockRequest, { params: mockParams });
    
    expect(prisma.imageInGallery.delete).toHaveBeenCalledWith({
      where: { id: mockParams.imageId },
    });
    expect(apiSuccess).toHaveBeenCalledWith({ success: true });
  });

  it('should update gallery if deleted image was the cover', async () => {
    await DELETE(mockRequest, { params: mockParams });
    
    expect(prisma.gallery.update).toHaveBeenCalledWith({
      where: { 
        id: mockParams.id,
        coverImageId: 'actual-image-789',
      },
      data: { coverImageId: null },
    });
  });
});
