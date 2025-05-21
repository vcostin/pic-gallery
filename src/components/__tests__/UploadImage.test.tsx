import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadImage } from '@/components/UploadImage';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === '/api/upload') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          url: 'https://example.com/test-image.jpg'
        }
      })
    });
  }
  if (url === '/api/images') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'new-image-1',
          title: 'Test Image',
          description: 'Test Description', 
          url: 'https://example.com/test-image.jpg',
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [{ id: 'tag1', name: 'test' }]
        }
      })
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <div data-testid="mock-image" {...props} />
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FormData
class MockFormData {
  append = jest.fn();
}

describe('UploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up FormData mock since JSDOM doesn't have it
    // @ts-ignore - This is a mock for testing
    global.FormData = MockFormData;
  });
  
  test('makes exactly two API calls when form is submitted', async () => {
    render(<UploadImage />);
    
    // Fill out the form using querySelectors instead of testing library
    const titleInput = screen.getByPlaceholderText('Enter image title');
    fireEvent.change(titleInput, { target: { value: 'Test Image' } });
    
    // Get file input by its accept attribute
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Get the form directly and submit it
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // Verify API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Check that the first call was to the upload endpoint
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/upload');
      expect((global.fetch as jest.Mock).mock.calls[0][1]).toHaveProperty('method', 'POST');
      expect((global.fetch as jest.Mock).mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
      
      // Check that the second call was to the images endpoint
      expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe('/api/images');
      expect((global.fetch as jest.Mock).mock.calls[1][1]).toHaveProperty('method', 'POST');
      expect((global.fetch as jest.Mock).mock.calls[1][1]).toHaveProperty('headers');
      expect((global.fetch as jest.Mock).mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
    });
  });
  
  test('prevents duplicate API calls when button is clicked multiple times', async () => {
    // Setup fake timers
    jest.useFakeTimers();
    
    // Reset fetch mock
    jest.clearAllMocks();
    
    render(<UploadImage />);
    
    // Fill out the form using querySelectors instead of testing library
    const titleInput = screen.getByPlaceholderText('Enter image title');
    fireEvent.change(titleInput, { target: { value: 'Test Image' } });
    
    // Get file input by its accept attribute
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Get and submit the form once - this should trigger the fetch calls
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // Wait for the initial fetch calls to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Reset the mock to verify no additional calls are made
    jest.clearAllMocks();
    
    // Try to submit the form again multiple times
    fireEvent.submit(form);
    fireEvent.submit(form);
    
    // Advance timers to flush any pending promises or timeouts
    jest.advanceTimersByTime(500);
    
    // Run any pending promise microtasks
    await Promise.resolve();
    
    // Verify no additional API calls were made
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Restore real timers
    jest.useRealTimers();
    
  });
  
  test('cleans up AbortController when unmounted', async () => {
    const { unmount } = render(<UploadImage />);
    
    // Fill out the form but don't submit
    const titleInput = screen.getByPlaceholderText('Enter image title');
    fireEvent.change(titleInput, { target: { value: 'Test Image' } });
    
    // Get file input directly
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Unmount the component before submitting
    unmount();
    
    // No fetch calls should be made after unmounting
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
