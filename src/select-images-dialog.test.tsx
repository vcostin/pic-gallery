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
    // Setup the default mock response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
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
    await act(async () => {
      render(
        <SelectImagesDialog
          isOpen={true}
          onClose={onClose}
          onImagesSelected={onImagesSelected}
          existingImageIds={[]}
        />
      );
    });
    
    // Wait for images to load
    await act(async () => {
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    // Find and click the first image card
    // Note: This is a simplified test. In a real test, you would need to wait
    // for the images to load and then find the correct elements to click
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
    await act(async () => {
      render(
        <SelectImagesDialog
          isOpen={true}
          onClose={onClose}
          onImagesSelected={onImagesSelected}
          existingImageIds={['image-1']}
        />
      );
    });
    
    // Wait for images to load
    await act(async () => {
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
    
    // Should only show Image 2 (not Image 1)
    await waitFor(() => {
      expect(screen.queryByText('Image 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Image 2')).toBeInTheDocument();
    });
  });
});
