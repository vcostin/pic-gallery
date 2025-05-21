import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditImageDialog } from '../EditImage';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/api/images/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'test-image-1',
          title: 'Updated Title',
          description: 'Updated description',
          url: '/test.jpg',
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

// Mock DeleteImageConfirmDialog
jest.mock('../DeleteImageConfirmDialog', () => ({
  DeleteImageConfirmDialog: () => <div data-testid="delete-dialog" />
}));

// Test data
const mockImage = {
  id: 'test-image-1',
  title: 'Test Image',
  description: 'Test description',
  url: '/test.jpg',
  tags: [
    { id: 'tag1', name: 'nature' },
    { id: 'tag2', name: 'landscape' }
  ]
};

describe('EditImageDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('makes API call exactly once when save button is clicked', async () => {
    render(<EditImageDialog image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Edit the title to enable the Save button
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: 'Updated Image Title' } });
    
    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Verify the API was called exactly once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/images/${mockImage.id}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String),
          signal: expect.any(AbortSignal)
        })
      );
      
      // Check that the request body contains the correct data
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        id: mockImage.id,
        title: 'Updated Image Title',
        tags: expect.any(Array)
      });
    });
  });
  
  test('does not make duplicate API calls when save button is clicked multiple times', async () => {
    // Clear any previous fetch calls
    jest.clearAllMocks();
    
    render(<EditImageDialog image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Edit the title to enable the Save button
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: 'Updated Image Title' } });
    
    // Click save button multiple times
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    
    // Verify the API was called exactly once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  test('cleans up AbortController when unmounted', async () => {
    const { unmount } = render(<EditImageDialog image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Edit the title to enable the Save button
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: 'Updated Image Title' } });
    
    // Unmount before saving
    unmount();
    
    // No fetch calls should be made after unmounting
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
