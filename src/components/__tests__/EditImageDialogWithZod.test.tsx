import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditImageDialogWithZod } from '../EditImageDialogWithZod';
import { ImageService } from '@/lib/services/imageService';

// Mock the ImageService
jest.mock('@/lib/services/imageService', () => ({
  ImageService: {
    updateImage: jest.fn()
  }
}));

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn()
  })
}));

const mockImage = {
  id: 'image-123',
  title: 'Test Image',
  description: 'This is a test image',
  url: 'https://example.com/test.jpg',
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [{ id: 'tag-1', name: 'test' }, { id: 'tag-2', name: 'image' }]
};

describe('EditImageDialogWithZod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with initial data', () => {
    render(<EditImageDialogWithZod image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Title and Description fields should contain the initial values
    expect(screen.getByDisplayValue('Test Image')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test image')).toBeInTheDocument();
    
    // Check for tags input
    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas');
    expect(tagsInput).toBeInTheDocument();
    
    // Check for tags values (they are in a text input now)
    expect(tagsInput).toHaveValue('test, image');
  });
  
  it('does not render when isOpen is false', () => {
    render(<EditImageDialogWithZod image={mockImage} isOpen={false} onClose={() => {}} />);
    
    // None of the form elements should be in the document
    expect(screen.queryByDisplayValue('Test Image')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('This is a test image')).not.toBeInTheDocument();
  });
  
  it('calls onClose when Cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<EditImageDialogWithZod image={mockImage} isOpen={true} onClose={onClose} />);
    
    // Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // onClose should have been called
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  
  it('makes API call when form is submitted', async () => {
    // Set up the mock to resolve successfully
    (ImageService.updateImage as jest.Mock).mockResolvedValueOnce(mockImage);
    
    render(<EditImageDialogWithZod image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Edit the title to enable the Save button
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);
    
    // Check that the API call was made with the correct data
    await waitFor(() => {
      expect(ImageService.updateImage).toHaveBeenCalledTimes(1);
      expect(ImageService.updateImage).toHaveBeenCalledWith(
        mockImage.id,
        expect.objectContaining({
          id: mockImage.id,
          title: 'Updated Title',
          description: mockImage.description,
          tags: expect.arrayContaining(['test', 'image'])
        }),
        expect.any(Object) // AbortSignal
      );
    });
    
    // Success message should be shown
    await waitFor(() => {
      expect(screen.getByText('Image updated successfully!')).toBeInTheDocument();
    });
  });
  
  it('shows validation error for empty title', async () => {
    render(<EditImageDialogWithZod image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Clear the title
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Check for validation error message
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    
    // The API call should not have been made
    expect(ImageService.updateImage).not.toHaveBeenCalled();
  });
  
  it('shows error message when API call fails', async () => {
    // Set up the mock to reject
    (ImageService.updateImage as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    render(<EditImageDialogWithZod image={mockImage} isOpen={true} onClose={() => {}} />);
    
    // Edit the title
    const titleInput = screen.getByDisplayValue('Test Image');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
