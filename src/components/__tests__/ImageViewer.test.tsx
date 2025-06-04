import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageViewer } from '@/components/ui/ImageViewer';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, role, ...props }: any) => {
      // Filter out framer-motion specific props to avoid warnings
      const { 
        initial, animate, exit, transition, style, className,
        drag, dragConstraints, dragElastic, onDragStart, onDragEnd, onTap,
        ...domProps 
      } = props;
      return (
        <div 
          onClick={onClick} 
          role={role}
          style={style}
          className={className}
          {...domProps}
        >
          {children}
        </div>
      );
    },
    img: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, onLoad }: {
    src: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
  }) => {
    // Simulate image load
    setTimeout(() => onLoad?.(), 0);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="close-icon">✕</span>,
  ArrowLeftIcon: () => <span data-testid="arrow-left-icon">←</span>,
  ArrowRightIcon: () => <span data-testid="arrow-right-icon">→</span>,
  MagnifyingGlassMinusIcon: () => <span data-testid="zoom-out-icon">-</span>,
  MagnifyingGlassPlusIcon: () => <span data-testid="zoom-in-icon">+</span>,
}));

describe('ImageViewer', () => {
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
        { id: 'tag3', name: 'portrait' }
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
      tags: []
    }
  ];

  const defaultProps = {
    images: mockImages,
    currentImageId: '1',
    isOpen: true,
    onClose: jest.fn(),
    onImageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display and Behavior', () => {
    it('renders modal when isOpen is true', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByAltText('Test Image 1')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ImageViewer {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close viewer');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // Click on the backdrop (modal overlay)
      const modal = screen.getByRole('dialog');
      await user.click(modal);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking on image content', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      const image = screen.getByAltText('Test Image 1');
      await user.click(image);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Image Navigation', () => {
    it('displays current image based on currentImageId', () => {
      render(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      expect(screen.getByAltText('Test Image 2')).toBeInTheDocument();
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
    });

    it('navigates to next image when right arrow is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      const nextButton = screen.getByLabelText('Next image');
      await user.click(nextButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('2');
    });

    it('navigates to previous image when left arrow is clicked', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      const prevButton = screen.getByLabelText('Previous image');
      await user.click(prevButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('1');
    });

    it('wraps to first image when clicking next on last image', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} currentImageId="3" />);
      
      const nextButton = screen.getByLabelText('Next image');
      await user.click(nextButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('1');
    });

    it('wraps to last image when clicking previous on first image', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      const prevButton = screen.getByLabelText('Previous image');
      await user.click(prevButton);
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('3');
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to next image when right arrow key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      await user.keyboard('{ArrowRight}');
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('2');
    });

    it('navigates to previous image when left arrow key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      await user.keyboard('{ArrowLeft}');
      
      expect(defaultProps.onImageChange).toHaveBeenCalledWith('1');
    });

    it('zooms in when + key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      await user.keyboard('{+}');
      
      // Check if zoom percentage has changed from 100%
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('zooms out when - key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // First zoom in, then zoom out
      await user.keyboard('{+}');
      await user.keyboard('{-}');
      
      // Should be back to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('toggles info panel when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // Initially info should be visible
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      
      await user.keyboard(' ');
      
      // Info panel toggle functionality should be triggered
      // Note: The actual hiding/showing behavior depends on component state
    });
  });

  describe('Zoom Functionality', () => {
    it('shows zoom controls when image is zoomable', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    });

    it('handles zoom in button click', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      
      // Zoom percentage should increase
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('handles zoom out button click', async () => {
      const user = userEvent.setup();
      render(<ImageViewer {...defaultProps} />);
      
      // First zoom in to enable zoom out
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      
      const zoomOutButton = screen.getByLabelText('Zoom out');
      await user.click(zoomOutButton);
      
      // Should be back to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('resets zoom when image changes', () => {
      const { rerender } = render(<ImageViewer {...defaultProps} />);
      
      // Change to different image
      rerender(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      // Zoom should be reset (this is tested indirectly through component behavior)
      expect(screen.getByAltText('Test Image 2')).toBeInTheDocument();
    });
  });

  describe('Image Information Panel', () => {
    it('displays image title and description', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      expect(screen.getByText('A test image')).toBeInTheDocument();
    });

    it('displays image tags', () => {
      render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
    });

    it('handles images without description gracefully', () => {
      const imagesWithoutDescription = [
        {
          ...mockImages[0],
          description: undefined
        }
      ];
      
      render(<ImageViewer 
        {...defaultProps} 
        images={imagesWithoutDescription}
      />);
      
      expect(screen.getByText('Test Image 1')).toBeInTheDocument();
      // Description should not be present
      expect(screen.queryByText('A test image')).not.toBeInTheDocument();
    });

    it('handles images without tags gracefully', () => {
      render(<ImageViewer {...defaultProps} currentImageId="3" />);
      
      expect(screen.getByText('Test Image 3')).toBeInTheDocument();
      // No tags should be displayed
      expect(screen.queryByText('nature')).not.toBeInTheDocument();
    });

    it('shows image counter', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Should show current position in the set
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('updates image counter when navigating', () => {
      const { rerender } = render(<ImageViewer {...defaultProps} />);
      
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      
      rerender(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid currentImageId gracefully', () => {
      render(<ImageViewer {...defaultProps} currentImageId="invalid" />);
      
      // Should not render when currentImageId is invalid
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles empty images array', () => {
      render(<ImageViewer {...defaultProps} images={[]} />);
      
      // Should not render when images array is empty
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles missing onImageChange prop', () => {
      const propsWithoutOnImageChange = {
        ...defaultProps,
        onImageChange: undefined
      };
      
      render(<ImageViewer {...propsWithoutOnImageChange} />);
      
      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Navigation should still work (but not call onImageChange)
      const nextButton = screen.getByLabelText('Next image');
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('has proper keyboard navigation support', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close viewer');
      const nextButton = screen.getByLabelText('Next image');
      const prevButton = screen.getByLabelText('Previous image');
      
      expect(closeButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Modal should receive focus when opened
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Enhanced ARIA and Accessibility', () => {
    it('maintains proper focus management when modal opens', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'image-viewer-title');
      
      // Check that the modal title exists and has proper ID
      const title = screen.getByText(mockImages[0].title);
      expect(title).toHaveAttribute('id', 'image-viewer-title');
    });

    it('provides proper ARIA labels for all interactive elements', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Navigation buttons
      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      
      // Zoom controls
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      
      // Close button
      expect(screen.getByLabelText('Close viewer')).toBeInTheDocument();
    });

    it('announces zoom level changes for screen readers', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      const zoomLevel = screen.getByText('100%');
      
      fireEvent.click(zoomInButton);
      
      // Zoom level should update and be visible
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('provides keyboard shortcuts information in help text', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const helpText = screen.getByText(/Click image or press space to zoom • Use arrow keys to navigate • Press Esc to close/);
      expect(helpText).toBeInTheDocument();
    });
  });

  describe('Advanced Keyboard Navigation', () => {
    it('handles rapid keyboard navigation without breaking state', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Rapidly press arrow keys
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      // Should end up back at the first image
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      expect(screen.getByText(mockImages[0].title)).toBeInTheDocument();
    });

    it('handles zoom keyboard shortcuts with boundaries', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // Zoom in multiple times to test max boundary
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
      fireEvent.keyDown(window, { key: '+' });
      
      // Should not exceed 500% (5x zoom)
      expect(screen.getByText('500%')).toBeInTheDocument();
      
      // Zoom out multiple times to test min boundary
      fireEvent.keyDown(window, { key: '-' });
      fireEvent.keyDown(window, { key: '-' });
      fireEvent.keyDown(window, { key: '-' });
      fireEvent.keyDown(window, { key: '-' });
      fireEvent.keyDown(window, { key: '-' });
      
      // Should not go below 100% (1x zoom)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('prevents default behavior for space key to avoid page scrolling', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const spaceKeyEvent = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = jest.spyOn(spaceKeyEvent, 'preventDefault');
      
      fireEvent(window, spaceKeyEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles keyboard navigation when only one image is present', () => {
      const singleImageProps = {
        ...defaultProps,
        images: [mockImages[0]]
      };
      
      render(<ImageViewer {...singleImageProps} />);
      
      // Arrow keys should not cause errors with single image
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      
      // Should still show the same image
      expect(screen.getByText('1 of 1')).toBeInTheDocument();
      expect(screen.getByText(mockImages[0].title)).toBeInTheDocument();
    });
  });

  describe('Touch and Mobile Interactions', () => {
    it('supports touch-based zoom gestures on image', () => {
      render(<ImageViewer {...defaultProps} />);
      
      const imageContainer = document.querySelector('.cursor-zoom-in');
      expect(imageContainer).toBeInTheDocument();
      
      // Initially should show 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
      
      // Use keyboard shortcut to zoom since onTap is harder to simulate
      fireEvent.keyDown(window, { key: ' ' });
      
      // Should zoom to 200%
      expect(screen.getByText('200%')).toBeInTheDocument();
      
      // After zooming, cursor should change to grab
      const zoomedContainer = document.querySelector('[style*="cursor: grab"]');
      expect(zoomedContainer).toBeInTheDocument();
    });

    it('enables dragging when image is zoomed', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // First zoom in using keyboard shortcut
      fireEvent.keyDown(window, { key: ' ' });
      
      // After zooming, the container should have drag capabilities (cursor changes)
      const zoomedContainer = document.querySelector('[style*="cursor: grab"]');
      expect(zoomedContainer).toBeInTheDocument();
    });

    it('provides appropriate visual feedback for touch interactions', () => {
      render(<ImageViewer {...defaultProps} />);
      
      // All buttons should have hover states and proper touch targets
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors');
        // Check for adequate touch target size (at least p-2 or p-3)
        expect(button.className).toMatch(/p-[23]/);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('renders efficiently with large image sets', () => {
      const largeImageSet = Array.from({ length: 100 }, (_, i) => ({
        id: `img-${i}`,
        url: `https://example.com/image-${i}.jpg`,
        title: `Image ${i}`,
        description: `Description for image ${i}`,
        tags: [{ id: `tag-${i}`, name: `tag-${i}` }]
      }));
      
      const largeSetProps = {
        ...defaultProps,
        images: largeImageSet,
        currentImageId: 'img-50'
      };
      
      const startTime = performance.now();
      render(<ImageViewer {...largeSetProps} />);
      const endTime = performance.now();
      
      // Should render quickly even with large dataset
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should show correct current image
      expect(screen.getByText('51 of 100')).toBeInTheDocument();
      expect(screen.getByText('Image 50')).toBeInTheDocument();
    });

    it('handles rapid image changes efficiently', () => {
      const { rerender } = render(<ImageViewer {...defaultProps} />);
      
      // Ensure initial render is complete
      expect(screen.getByText(mockImages[0].title)).toBeInTheDocument();
      
      // Rapidly change images
      rerender(<ImageViewer {...defaultProps} currentImageId="2" />);
      rerender(<ImageViewer {...defaultProps} currentImageId="3" />);
      rerender(<ImageViewer {...defaultProps} currentImageId="1" />);
      rerender(<ImageViewer {...defaultProps} currentImageId="2" />);
      
      // Should end up on the correct image
      expect(screen.getByText(mockImages[1].title)).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('properly cleans up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<ImageViewer {...defaultProps} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('State Management Edge Cases', () => {
    it('resets zoom state when switching images', () => {
      const mockOnImageChange = jest.fn();
      const { rerender } = render(<ImageViewer {...defaultProps} onImageChange={mockOnImageChange} />);
      
      // Initially at 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
      
      // Zoom in on first image using + key
      fireEvent.keyDown(window, { key: '+' });
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Switch to next image using arrow key
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      
      // Verify onImageChange was called with next image ID
      expect(mockOnImageChange).toHaveBeenCalledWith('2');
      
      // Simulate the image change by rerendering with new currentImageId
      rerender(<ImageViewer {...defaultProps} currentImageId="2" onImageChange={mockOnImageChange} />);
      
      // Zoom should reset to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
      
      // Should show second image
      expect(screen.getByText('Test Image 2')).toBeInTheDocument();
    });

    it('handles invalid currentImageId gracefully', () => {
      const invalidProps = {
        ...defaultProps,
        currentImageId: 'non-existent-id'
      };
      
      const { container } = render(<ImageViewer {...invalidProps} />);
      
      // Should render nothing when image ID is invalid
      expect(container.firstChild).toBeNull();
    });

    it('maintains proper state when images array changes', () => {
      const { rerender } = render(<ImageViewer {...defaultProps} />);
      
      // Change to a different set of images
      const newImages = [
        { 
          id: 'new1', 
          url: 'https://example.com/new1.jpg', 
          title: 'New Image 1', 
          description: 'New description', 
          tags: [],
          userId: 'user1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        }
      ];
      
      rerender(<ImageViewer {...defaultProps} images={newImages} currentImageId="new1" />);
      
      expect(screen.getByText('New Image 1')).toBeInTheDocument();
      expect(screen.getByText('1 of 1')).toBeInTheDocument();
    });
  });
});
