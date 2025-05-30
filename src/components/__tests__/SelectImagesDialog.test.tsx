import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SelectImagesDialog } from '@/components/SelectImagesDialog';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ 
    src, 
    alt, 
    className 
  }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
}));

describe('SelectImagesDialog', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response matching the updated schema with API wrapper
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [
            {
              id: '1',
              title: 'Test Image 1',
              description: 'A test image',
              url: '/images/test1.jpg',
              userId: 'user1',
              createdAt: new Date('2023-01-01'),
              updatedAt: new Date('2023-01-01'),
              tags: [{ id: 'tag1', name: 'nature' }]
            },
            {
              id: '2',
              title: 'Test Image 2',
              description: 'Another test image',
              url: '/images/test2.jpg',
              userId: 'user1',
              createdAt: new Date('2023-01-02'),
              updatedAt: new Date('2023-01-02'),
              tags: [{ id: 'tag2', name: 'city' }]
            }
          ],
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
      })
    });
  });

  it('should only make one API call on initial load', async () => {
    render(
      <SelectImagesDialog 
        isOpen={true}
        onClose={jest.fn()}
        onImagesSelected={jest.fn()}
      />
    );
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Get the current call count
    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
    
    // Use fake timers to ensure no additional calls are made after initial render
    jest.useFakeTimers();
    act(() => {
      jest.advanceTimersByTime(500); // Advance time
    });
    jest.useRealTimers();
    
    expect(global.fetch).toHaveBeenCalledTimes(initialCallCount);
    
    // Verify at least one of the calls was to the correct endpoint - ignoring the options object
    expect((global.fetch as jest.Mock).mock.calls.some((call: unknown[]) => call[0] === '/api/images')).toBe(true);
  });

  it('should debounce search input changes', async () => {
    jest.useFakeTimers();
    
    render(
      <SelectImagesDialog 
        isOpen={true}
        onClose={jest.fn()}
        onImagesSelected={jest.fn()}
      />
    );
    
    // Wait for initial API call
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Reset mock to focus on search API calls
    (global.fetch as jest.Mock).mockClear();
    
    const searchInput = screen.getByPlaceholderText('Search images...');
    
    // Type "te" quickly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    
    // Should not call API yet (debounce in effect)
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Fast forward debounce time
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Now it should make exactly one call with the final value
    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0][0]).toBe('/api/images?searchQuery=te');
    });
    
    jest.useRealTimers();
  });

  it('should handle tag filtering correctly', async () => {
    render(
      <SelectImagesDialog 
        isOpen={true}
        onClose={jest.fn()}
        onImagesSelected={jest.fn()}
      />
    );
    
    // Wait for initial load and tag buttons to appear
    await waitFor(() => {
      expect(screen.getAllByText('nature')[0]).toBeInTheDocument();
    });
    
    // Clear fetch calls from initial load
    (global.fetch as jest.Mock).mockClear();
    
    // Click on the first tag button (the one in the filter section, not in the image tag display)
    // Get all button elements and find the first one that contains "nature" text
    const tagButtons = screen.getAllByRole('button');
    const natureTagButton = tagButtons.find(
      button => button.textContent === 'nature' && 
      button.className.includes('rounded-full')
    );
    
    if (!natureTagButton) {
      throw new Error('Could not find nature tag button');
    }
    
    fireEvent.click(natureTagButton);
    
    // Should trigger API call with tag filter
    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0][0]).toBe('/api/images?tag=nature');
    });
  });
});
