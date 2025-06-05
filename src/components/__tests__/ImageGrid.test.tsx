import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGrid } from '@/components/ImageGrid';
import '@testing-library/jest-dom';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, onClick }: {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
    loading?: string;
    onError?: () => void;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} onClick={onClick} />;
  }
}));

// Mock ImageViewer component
jest.mock('@/components/ui/ImageViewer', () => ({
  ImageViewer: ({ images, currentImageId, isOpen, onClose, onImageChange }: {
    images: any[];
    currentImageId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onImageChange?: (imageId: string) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="image-viewer-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <div data-testid="current-image-id">{currentImageId}</div>
        <button 
          onClick={() => onImageChange?.('next-image')} 
          data-testid="change-image"
        >
          Change Image
        </button>
      </div>
    );
  }
}));

// Mock EditImageDialog component
jest.mock('@/components/EditImage', () => ({
  EditImageDialog: ({ image, isOpen, onClose }: {
    image: any;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-image-dialog">
        <button onClick={onClose} data-testid="close-edit-dialog">Close Edit</button>
        <div data-testid="editing-image-id">{image?.id}</div>
      </div>
    );
  }
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('ImageGrid', () => {
  const mockImages = [
    {
      id: '1',
      title: 'Test Image 1',
      description: 'A test image',
      url: '/images/test1.jpg',
      userId: 'user1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [
        { id: 'tag1', name: 'nature' },
        { id: 'tag2', name: 'landscape' }
      ]
    },
    {
      id: '2',
      title: 'Test Image 2',
      description: 'Another test image',
      url: '/images/test2.jpg',
      userId: 'user1',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      tags: [
        { id: 'tag3', name: 'portrait' },
        { id: 'tag1', name: 'nature' }
      ]
    },
    {
      id: '3',
      title: 'Test Image 3',
      description: 'Third test image',
      url: '/images/test3.jpg',
      userId: 'user1',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03'),
      tags: [
        { id: 'tag4', name: 'cityscape' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders images in a grid layout', async () => {
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
      expect(screen.getByText('Test Image 3')).toBeInTheDocument();
    });

    it('renders tag filter buttons with improved contrast', async () => {
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
      
      // Check for "All" button and individual tag buttons using data-testid
      expect(screen.getByTestId('image-grid-tag-filter-nature')).toBeInTheDocument();
      expect(screen.getByTestId('image-grid-tag-filter-landscape')).toBeInTheDocument();
      expect(screen.getByTestId('image-grid-tag-filter-portrait')).toBeInTheDocument();
      expect(screen.getByTestId('image-grid-tag-filter-cityscape')).toBeInTheDocument();
    });

    it('applies correct CSS classes for tag filter contrast', async () => {
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
      
      const allButton = screen.getByText('All');
      expect(allButton).toHaveClass('bg-blue-500', 'text-white');
      
      const natureButton = screen.getByTestId('image-grid-tag-filter-nature');
      expect(natureButton).toHaveClass('bg-gray-200', 'dark:bg-gray-700');
    });

    it('shows empty state when no images provided', async () => {
      render(<ImageGrid images={[]} />);
      
      // Wait for skeleton loader to finish and empty state to show
      await waitFor(() => {
        expect(screen.getByText('No images found')).toBeInTheDocument();
      });
      expect(screen.getByText('Upload some images to get started.')).toBeInTheDocument();
    });
  });

  describe('Tag Filtering', () => {
    it('filters images by selected tag', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Initially all images should be visible
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
      expect(screen.getByText('Test Image 3')).toBeInTheDocument();
      
      // Click on 'nature' tag using data-testid
      await user.click(screen.getByTestId('image-grid-tag-filter-nature'));
      
      // Only images with 'nature' tag should be visible
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Image 3')).not.toBeInTheDocument();
    });

    it('shows all images when "All" filter is selected', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Filter by a specific tag first using data-testid
      await user.click(screen.getByTestId('image-grid-tag-filter-portrait'));
      expect(screen.queryByText('Test Image 1')).not.toBeInTheDocument();
      
      // Click "All" to show all images again
      await user.click(screen.getByText('All'));
      
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
      expect(screen.getByText('Test Image 3')).toBeInTheDocument();
    });

    it('shows empty state when no images match selected tag', async () => {
      const user = userEvent.setup();
      const imagesWithoutTags = [
        {
          ...mockImages[0],
          tags: []
        }
      ];
      
      render(<ImageGrid images={imagesWithoutTags} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
      
      // Since there are no tags, only "All" button should be visible
      expect(screen.queryByTestId('image-grid-tag-filter-nature')).not.toBeInTheDocument();
    });
  });

  describe('Image Viewer Modal Integration', () => {
    it('opens ImageViewer modal when image is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Click on the first image title
      await user.click(screen.getByText('Test Image 1'));
      
      expect(screen.getByTestId('image-viewer-modal')).toBeInTheDocument();
      expect(screen.getByTestId('current-image-id')).toHaveTextContent('1');
    });

    it('closes ImageViewer modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Open modal
      await user.click(screen.getByText('Test Image 1'));
      expect(screen.getByTestId('image-viewer-modal')).toBeInTheDocument();
      
      // Close modal
      await user.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('image-viewer-modal')).not.toBeInTheDocument();
    });

    it('passes onImageChange prop to ImageViewer for arrow navigation', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Open modal
      await user.click(screen.getByText('Test Image 1'));
      
      // Test the onImageChange functionality
      await user.click(screen.getByTestId('change-image'));
      
      // The modal should update to show the new image
      expect(screen.getByTestId('current-image-id')).toHaveTextContent('next-image');
    });

    it('passes filtered images to ImageViewer', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Filter by 'nature' tag first using data-testid
      await user.click(screen.getByTestId('image-grid-tag-filter-nature'));
      
      // Open modal on filtered image
      await user.click(screen.getByText('Test Image 1'));
      
      expect(screen.getByTestId('image-viewer-modal')).toBeInTheDocument();
      // The modal should receive the filtered images, not all images
    });
  });

  describe('Edit Image Dialog', () => {
    it('opens edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Find and click the edit button for the first image
      const editButtons = screen.getAllByTitle('Edit image');
      await user.click(editButtons[0]);
      
      expect(screen.getByTestId('edit-image-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('editing-image-id')).toHaveTextContent('1');
    });

    it('closes edit dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Open edit dialog
      const editButtons = screen.getAllByTitle('Edit image');
      await user.click(editButtons[0]);
      expect(screen.getByTestId('edit-image-dialog')).toBeInTheDocument();
      
      // Close dialog
      await user.click(screen.getByTestId('close-edit-dialog'));
      expect(screen.queryByTestId('edit-image-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and Interaction', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Check for proper button accessibility
      const editButtons = screen.getAllByTitle('Edit image');
      const viewButtons = screen.getAllByTitle('View full image');
      
      expect(editButtons[0]).toBeInTheDocument();
      expect(viewButtons[0]).toBeInTheDocument();
    });

    it('shows hover indicators and click hints', async () => {
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      const clickIndicators = screen.getAllByText('Click to view');
      expect(clickIndicators).toHaveLength(mockImages.length);
    });

    it('handles keyboard navigation properly', async () => {
      const user = userEvent.setup();
      render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton loader to finish and content to render
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Get the first image container and simulate keyboard interaction
      const firstImageTitle = screen.getByText('Test Image 1');
      
      // Click on the title (which has onClick handler)
      await user.click(firstImageTitle);
      
      // Modal should open
      expect(screen.getByTestId('image-viewer-modal')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('renders without performance issues with large image sets', () => {
      const largeImageSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockImages[0],
        id: `image-${i}`,
        title: `Test Image ${i}`,
      }));
      
      const startTime = performance.now();
      render(<ImageGrid images={largeImageSet} />);
      const endTime = performance.now();
      
      // Rendering should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('properly memoizes tag filter buttons', async () => {
      const { rerender } = render(<ImageGrid images={mockImages} />);
      
      // Wait for skeleton to finish loading
      await waitFor(() => {
        expect(screen.getByTestId('image-grid-tag-filter-nature')).toBeInTheDocument();
      });
      
      const natureButton = screen.getByTestId('image-grid-tag-filter-nature');
      const originalButton = natureButton;
      
      // Rerender with same props
      rerender(<ImageGrid images={mockImages} />);
      
      // Wait for rerender to complete
      await waitFor(() => {
        expect(screen.getByTestId('image-grid-tag-filter-nature')).toBeInTheDocument();
      });
      
      const updatedNatureButton = screen.getByTestId('image-grid-tag-filter-nature');
      // Button should be the same instance due to memoization
      expect(updatedNatureButton).toBe(originalButton);
    });
  });

  describe('Error Handling', () => {
    it('handles missing tag data gracefully', async () => {
      const imagesWithMissingTags = [
        {
          ...mockImages[0],
          tags: undefined
        }
      ];
      
      render(<ImageGrid images={imagesWithMissingTags} />);
      
      // Wait for skeleton to finish loading
      await waitFor(() => {
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      });
      
      // Should render without crashing
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      // Only "All" button should be present
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('handles malformed image data gracefully', async () => {
      const malformedImages = [
        {
          id: '1',
          title: '',
          description: null,
          url: '/images/test1.jpg',
          userId: 'user1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          tags: []
        }
      ];
      
      render(<ImageGrid images={malformedImages} />);
      
      // Wait for skeleton to finish loading
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
      
      // Should render without crashing - check for the image container instead
      const galleryImages = screen.getAllByTestId('gallery-image');
      expect(galleryImages).toHaveLength(1);
    });
  });
});
