// TestTagsManagementWithZod.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagsManagementWithZod } from '@/components/TagsManagementWithZod';
import userEvent from '@testing-library/user-event';

// Mock toast component
jest.mock('@/components/ui/Toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

describe('TagsManagementWithZod', () => {
  // Set up mock initial tags
  const mockInitialTags = [
    { id: '1', name: 'sunset' },
    { id: '2', name: 'beach' }
  ];

  // Set up mock callback
  const mockOnTagsUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with initial tags', () => {
    render(<TagsManagementWithZod initialTags={mockInitialTags} />);

    // Check if title is rendered
    expect(screen.getByText('Tag Management')).toBeInTheDocument();
    
    // Check if initial tags are rendered
    expect(screen.getByText('sunset')).toBeInTheDocument();
    expect(screen.getByText('beach')).toBeInTheDocument();
  });

  test('allows adding a new tag', async () => {
    render(<TagsManagementWithZod initialTags={mockInitialTags} onTagsUpdated={mockOnTagsUpdated} />);
    
    // Get input and add button
    const tagInput = screen.getByLabelText(/add new tag/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    
    // Enter a new tag and submit
    await userEvent.type(tagInput, 'mountains');
    fireEvent.click(addButton);
    
    // Check if the new tag appears
    await waitFor(() => {
      expect(screen.getByText('mountains')).toBeInTheDocument();
    });
    
    // Check if callback was called with the right tags
    expect(mockOnTagsUpdated).toHaveBeenCalledWith(expect.arrayContaining([
      { id: '1', name: 'sunset' },
      { id: '2', name: 'beach' },
      { name: 'mountains' }
    ]));
  });

  test('prevents adding duplicate tags', async () => {
    const { toast } = require('@/components/ui/Toast');
    
    render(<TagsManagementWithZod initialTags={mockInitialTags} />);
    
    // Get input and add button
    const tagInput = screen.getByLabelText(/add new tag/i);
    const addButton = screen.getByRole('button', { name: /add/i });
    
    // Try to add an existing tag
    await userEvent.type(tagInput, 'sunset');
    fireEvent.click(addButton);
    
    // Check if error toast was shown
    expect(toast.error).toHaveBeenCalledWith('This tag already exists');
  });

  test('allows removing tags', async () => {
    render(<TagsManagementWithZod initialTags={mockInitialTags} onTagsUpdated={mockOnTagsUpdated} />);
    
    // Find remove buttons (X icons)
    const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
    
    // Click the first remove button (for 'sunset')
    fireEvent.click(removeButtons[0]);
    
    // Check that the tag was removed
    await waitFor(() => {
      expect(screen.queryByText('sunset')).not.toBeInTheDocument();
      expect(screen.getByText('beach')).toBeInTheDocument();
    });
    
    // Check callback was called with remaining tags
    expect(mockOnTagsUpdated).toHaveBeenCalledWith([
      { id: '2', name: 'beach' }
    ]);
  });

  test('allows adding tags from popular tags list', async () => {
    render(<TagsManagementWithZod initialTags={mockInitialTags} onTagsUpdated={mockOnTagsUpdated} />);
    
    // Wait for popular tags to load
    await waitFor(() => {
      expect(screen.getByText('nature (42)')).toBeInTheDocument();
    });
    
    // Click on a popular tag
    fireEvent.click(screen.getByText('nature (42)'));
    
    // Check that the tag was added
    await waitFor(() => {
      expect(screen.getByText('nature')).toBeInTheDocument();
    });
    
    // Check callback was called with updated tags
    expect(mockOnTagsUpdated).toHaveBeenCalledWith(expect.arrayContaining([
      { id: '1', name: 'sunset' },
      { id: '2', name: 'beach' },
      { id: '1', name: 'nature', count: 42 }
    ]));
  });

  test('validates tag input', async () => {
    render(<TagsManagementWithZod />);
    
    // Get input and add button
    const addButton = screen.getByRole('button', { name: /add/i });
    
    // Try to submit with empty tag
    fireEvent.click(addButton);
    
    // Check if validation error appears
    await waitFor(() => {
      expect(screen.getByText('Tag name is required')).toBeInTheDocument();
    });
  });
});
