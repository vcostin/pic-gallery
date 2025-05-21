import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GalleryDetailsForm } from '@/components/GalleryDetails';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  Controller: ({ name, control, render }: { name: string; control: unknown; render: (props: any) => React.ReactNode }) => {
    // Simple mock implementation that calls render with mocked field props
    return render({
      field: {
        value: '',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        name
      },
      fieldState: {
        invalid: false,
        error: undefined
      }
    });
  }
}));

describe('GalleryDetailsForm', () => {
  // Setup common test props
  const mockProps = {
    register: jest.fn().mockImplementation((name) => ({ name })),
    control: {},
    errors: {},
    isSubmitting: false,
    defaultValues: {},
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields correctly', () => {
    render(<GalleryDetailsForm {...mockProps} />);
    
    // Check for title field
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    
    // Check for description field
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    
    // Check for privacy settings
    expect(screen.getByText(/public gallery/i)).toBeInTheDocument();
  });

  test('shows error messages when provided', () => {
    const propsWithErrors = {
      ...mockProps,
      errors: {
        title: { message: 'Title is required' },
        description: { message: 'Description is too long' }
      }
    };

    render(<GalleryDetailsForm {...propsWithErrors} />);
    
    // Check for error messages
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is too long')).toBeInTheDocument();
  });

  test('displays submit button with correct state', () => {
    render(<GalleryDetailsForm {...mockProps} />);
    
    // Check for submit button
    const submitButton = screen.getByText('Save');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    
    // Render with isSubmitting=true
    render(<GalleryDetailsForm {...mockProps} isSubmitting={true} />);
    const submittingButton = screen.getByText('Saving...');
    expect(submittingButton).toBeInTheDocument();
    expect(submittingButton).toBeDisabled();
  });

  test('renders cancel button when showCancelButton and onCancel are provided', () => {
    const mockCancel = jest.fn();
    render(
      <GalleryDetailsForm 
        {...mockProps} 
        showCancelButton={true} 
        onCancel={mockCancel} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    
    // Test click handler
    fireEvent.click(cancelButton);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  test('does not render cancel button when showCancelButton is false', () => {
    render(
      <GalleryDetailsForm 
        {...mockProps} 
        showCancelButton={false} 
        onCancel={jest.fn()} 
      />
    );
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});
