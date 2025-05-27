import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import '@testing-library/jest-dom';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SelectImagesDialog Component', () => {
  const mockImages = [
    {
      id: 'image-1',
      title: 'Image 1',
      description: 'Test image 1',
      url: '/test1.jpg',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [{ id: 'tag-1', name: 'landscape' }]
    },
    {
      id: 'image-2',
      title: 'Image 2',
      description: 'Test image 2',
      url: '/test2.jpg',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [{ id: 'tag-2', name: 'portrait' }]
    }
  ];

  const mockResponse = {
    success: true,
    data: {
      data: mockImages,
      meta: {
        total: 2,
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      }
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Create a synchronous mock that resolves immediately
    const mockJsonResponse = jest.fn().mockResolvedValue(mockResponse);
    const mockFetchResponse = {
      ok: true,
      json: mockJsonResponse
    };
    
    // Use mockImplementation to control the timing
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve(mockFetchResponse);
    });
  });

  it('should display modal when isOpen is true', () => {
    const onClose = jest.fn();
    const onImagesSelected = jest.fn();
    
    render(
      <SelectImagesDialog
        isOpen={true}
        onClose={onClose}
        onImagesSelected={onImagesSelected}
        existingImageIds={[]}
      />
    );
    
    expect(screen.getByText('Select Images')).toBeInTheDocument();
  });

  it('should not display modal when isOpen is false', () => {
    const onClose = jest.fn();
    const onImagesSelected = jest.fn();
    
    render(
      <SelectImagesDialog
        isOpen={false}
        onClose={onClose}
        onImagesSelected={onImagesSelected}
        existingImageIds={[]}
      />
    );
    
    expect(screen.queryByText('Select Images')).not.toBeInTheDocument();
  });

  it('should call onImagesSelected with selected image IDs when Add button is clicked', async () => {
    const onClose = jest.fn();
    const onImagesSelected = jest.fn();
    
    // Render component
    render(
      <SelectImagesDialog
        isOpen={true}
        onClose={onClose}
        onImagesSelected={onImagesSelected}
        existingImageIds={[]}
      />
    );
    
    // Wait for the component to finish loading and all async operations to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find and click the first image card
    const imageCard = await screen.findByText('Image 1');
    const imageCardContainer = imageCard.closest('.cursor-pointer');
    if (imageCardContainer) {
      await act(async () => {
        fireEvent.click(imageCardContainer);
      });
    }
    
    // Click the Add button
    const addButton = await screen.findByText(/Add 1 Image/);
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Verify onImagesSelected was called with the correct image ID
    expect(onImagesSelected).toHaveBeenCalledWith(['image-1']);
    expect(onClose).toHaveBeenCalled();
  });

  it('should filter out existing images', async () => {
    const onClose = jest.fn();
    const onImagesSelected = jest.fn();
    
    // Render with one image already in the gallery
    render(
      <SelectImagesDialog
        isOpen={true}
        onClose={onClose}
        onImagesSelected={onImagesSelected}
        existingImageIds={['image-1']}
      />
    );
    
    // Wait for the component to finish loading and all async operations to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should only show Image 2 (not Image 1)
    await waitFor(() => {
      expect(screen.queryByText('Image 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Image 2')).toBeInTheDocument();
    });
  });
});
