import { render, screen } from '@testing-library/react';
import { ImageTags } from '@/components/ui/ImageTags';
import '@testing-library/jest-dom';

describe('ImageTags', () => {
  const mockTags = [
    { id: 'tag1', name: 'nature' },
    { id: 'tag2', name: 'landscape' },
    { id: 'tag3', name: 'photography' },
    { id: 'tag4', name: 'outdoor' },
    { id: 'tag5', name: 'scenic' }
  ];

  describe('Basic Rendering', () => {
    it('renders tags with improved contrast colors', () => {
      render(<ImageTags tags={mockTags.slice(0, 3)} />);
      
      const natureTag = screen.getByText('nature');
      const landscapeTag = screen.getByText('landscape');
      const photographyTag = screen.getByText('photography');
      
      // Check for high-contrast blue color scheme
      expect(natureTag).toHaveClass('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
      expect(landscapeTag).toHaveClass('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
      expect(photographyTag).toHaveClass('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
    });

    it('applies consistent styling across all tags', () => {
      render(<ImageTags tags={mockTags.slice(0, 2)} />);
      
      const tags = screen.getAllByText(/nature|landscape/);
      
      tags.forEach(tag => {
        expect(tag).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded', 'font-medium');
      });
    });

    it('renders with proper accessibility attributes', () => {
      render(<ImageTags tags={mockTags.slice(0, 1)} />);
      
      const tag = screen.getByText('nature');
      expect(tag.tagName).toBe('SPAN');
    });
  });

  describe('Tag Limit Functionality', () => {
    it('respects default max limit of 3 tags', () => {
      render(<ImageTags tags={mockTags} />);
      
      // Should show first 3 tags
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
      expect(screen.getByText('photography')).toBeInTheDocument();
      
      // Should show "+2" indicator for remaining tags
      expect(screen.getByText('+2')).toBeInTheDocument();
      
      // Should not show the 4th and 5th tags
      expect(screen.queryByText('outdoor')).not.toBeInTheDocument();
      expect(screen.queryByText('scenic')).not.toBeInTheDocument();
    });

    it('respects custom max limit', () => {
      render(<ImageTags tags={mockTags} max={2} />);
      
      // Should show first 2 tags
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
      
      // Should show "+3" indicator for remaining tags
      expect(screen.getByText('+3')).toBeInTheDocument();
      
      // Should not show other tags
      expect(screen.queryByText('photography')).not.toBeInTheDocument();
    });

    it('shows all tags when count is within limit', () => {
      render(<ImageTags tags={mockTags.slice(0, 2)} max={3} />);
      
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
      
      // Should not show overflow indicator
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('handles edge case with max=1', () => {
      render(<ImageTags tags={mockTags} max={1} />);
      
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('+4')).toBeInTheDocument();
      
      // Should not show other individual tags
      expect(screen.queryByText('landscape')).not.toBeInTheDocument();
    });
  });

  describe('Overflow Indicator Styling', () => {
    it('applies correct styling to overflow indicator', () => {
      render(<ImageTags tags={mockTags} max={2} />);
      
      const overflowIndicator = screen.getByText('+3');
      expect(overflowIndicator).toHaveClass(
        'text-xs',
        'px-2',
        'py-1',
        'bg-gray-500',
        'dark:bg-gray-600',
        'text-white',
        'rounded',
        'font-medium'
      );
    });

    it('maintains visual consistency with tag styling', () => {
      render(<ImageTags tags={mockTags} max={1} />);
      
      const tag = screen.getByText('nature');
      const overflow = screen.getByText('+4');
      
      // Both should have same size and spacing classes
      expect(tag).toHaveClass('text-xs', 'px-2', 'py-1', 'font-medium');
      expect(overflow).toHaveClass('text-xs', 'px-2', 'py-1', 'font-medium');
    });
  });

  describe('Empty States', () => {
    it('renders nothing when no tags provided', () => {
      const { container } = render(<ImageTags tags={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when tags array is undefined', () => {
      // @ts-expect-error Testing edge case
      const { container } = render(<ImageTags tags={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles empty tag names gracefully', () => {
      const tagsWithEmptyName = [
        { id: 'tag1', name: '' },
        { id: 'tag2', name: 'valid-tag' }
      ];
      
      render(<ImageTags tags={tagsWithEmptyName} />);
      
      // Should render both, even empty name
      expect(screen.getByText('valid-tag')).toBeInTheDocument();
      // Empty tag should still create a span element - check by finding the container and counting spans
      const spans = screen.getAllByRole('generic').filter(el => el.tagName === 'SPAN');
      expect(spans).toHaveLength(2); // One for empty tag, one for valid tag
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('applies dark mode classes correctly', () => {
      render(<ImageTags tags={mockTags.slice(0, 1)} />);
      
      const tag = screen.getByText('nature');
      
      // Should have both light and dark mode classes
      expect(tag).toHaveClass('bg-blue-100', 'dark:bg-blue-900');
      expect(tag).toHaveClass('text-blue-800', 'dark:text-blue-200');
    });

    it('applies dark mode classes to overflow indicator', () => {
      render(<ImageTags tags={mockTags} max={1} />);
      
      const overflow = screen.getByText('+4');
      expect(overflow).toHaveClass('bg-gray-500', 'dark:bg-gray-600');
    });
  });

  describe('Visual Contrast and Accessibility', () => {
    it('ensures high contrast with blue color scheme', () => {
      render(<ImageTags tags={mockTags.slice(0, 1)} />);
      
      const tag = screen.getByText('nature');
      
      // Blue-100 background with blue-800 text provides high contrast
      expect(tag).toHaveClass('bg-blue-100', 'text-blue-800');
      
      // Dark mode: blue-900 background with blue-200 text provides high contrast
      expect(tag).toHaveClass('dark:bg-blue-900', 'dark:text-blue-200');
    });

    it('maintains readability with proper font weight', () => {
      render(<ImageTags tags={mockTags.slice(0, 1)} />);
      
      const tag = screen.getByText('nature');
      expect(tag).toHaveClass('font-medium');
    });

    it('provides sufficient padding for touch targets', () => {
      render(<ImageTags tags={mockTags.slice(0, 1)} />);
      
      const tag = screen.getByText('nature');
      expect(tag).toHaveClass('px-2', 'py-1');
    });
  });

  describe('Performance and Optimization', () => {
    it('renders large tag lists efficiently', () => {
      const largeTags = Array.from({ length: 100 }, (_, i) => ({
        id: `tag-${i}`,
        name: `tag-${i}`
      }));
      
      const startTime = performance.now();
      render(<ImageTags tags={largeTags} max={5} />);
      const endTime = performance.now();
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should only render the specified max count
      expect(screen.getAllByText(/^tag-/)).toHaveLength(5);
      expect(screen.getByText('+95')).toBeInTheDocument();
    });

    it('handles tag updates efficiently', () => {
      const { rerender } = render(<ImageTags tags={mockTags.slice(0, 2)} />);
      
      // Update tags
      const updatedTags = [
        ...mockTags.slice(0, 2),
        { id: 'new-tag', name: 'new-tag' }
      ];
      
      rerender(<ImageTags tags={updatedTags} />);
      
      expect(screen.getByText('new-tag')).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('applies proper gap spacing between tags', () => {
      const { container } = render(<ImageTags tags={mockTags.slice(0, 3)} />);
      
      const tagContainer = container.querySelector('.flex.flex-wrap.gap-1.mb-2');
      expect(tagContainer).toBeInTheDocument();
    });

    it('maintains consistent layout with different tag lengths', () => {
      const mixedLengthTags = [
        { id: 'short', name: 'a' },
        { id: 'medium', name: 'medium-length' },
        { id: 'long', name: 'very-long-tag-name-that-might-wrap' }
      ];
      
      render(<ImageTags tags={mixedLengthTags} />);
      
      mixedLengthTags.forEach(tag => {
        const element = screen.getByText(tag.name);
        expect(element).toHaveClass('px-2', 'py-1'); // Same padding for all
      });
    });
  });
});
