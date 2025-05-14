import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from '../ProfileForm';
import { useRouter } from 'next/navigation';
import { useUploadThing } from '@/lib/uploadthing';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/uploadthing', () => ({
  useUploadThing: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('ProfileForm', () => {
  const mockInitialData = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
  };
  
  const mockRouter = {
    refresh: jest.fn(),
  };
  
  const mockUploadThing = {
    startUpload: jest.fn(),
    isUploading: false,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUploadThing as jest.Mock).mockReturnValue(mockUploadThing);
    
    // Mock fetch API
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('renders correctly with initial data', () => {
    render(<ProfileForm initialData={mockInitialData} />);
    
    expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com');
    expect(screen.getByAltText('Profile picture')).toBeInTheDocument();
  });
  
  test('renders in read-only mode when readOnly is true', () => {
    render(<ProfileForm initialData={mockInitialData} readOnly={true} />);
    
    expect(screen.queryByTestId('name-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('submit-button')).not.toBeInTheDocument();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  test('handles form updates correctly', () => {
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Update name
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Jane Smith' },
    });
    
    // Update email
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'jane@example.com' },
    });
    
    expect(screen.getByTestId('name-input')).toHaveValue('Jane Smith');
    expect(screen.getByTestId('email-input')).toHaveValue('jane@example.com');
  });
  
  test('resets form to initial values when reset button is clicked', () => {
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Update name and email
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'jane@example.com' },
    });
    
    // Click reset button
    fireEvent.click(screen.getByTestId('reset-button'));
    
    // Verify values are reset to initial data
    expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com');
  });
  
  test('submits form with correct data and shows success message', async () => {
    // Mock successful response
    const mockResponse = {
      success: true,
      data: {
        id: 'user-123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        image: 'https://example.com/avatar.jpg',
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });
    
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Update name and email
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'jane@example.com' },
    });
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'));
    
    // Wait for fetch to be called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${mockInitialData.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Jane Smith',
            email: 'jane@example.com',
            image: 'https://example.com/avatar.jpg',
          }),
        })
      );
    });
    
    // Verify success message is shown
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
    
    // Verify router refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  test('shows error message when API call fails', async () => {
    // Mock error response
    const mockErrorMessage = 'Failed to update profile';
    const mockResponse = {
      success: false,
      error: mockErrorMessage,
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, // This is still "ok" in terms of HTTP
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });
    
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'));
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(mockErrorMessage)).toBeInTheDocument();
    });
  });
  
  test('handles image upload when file is selected', async () => {
    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    const mockUrl = 'https://example.com/new-avatar.jpg';
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/mockblob');
    
    // Mock successful upload
    mockUploadThing.startUpload.mockResolvedValueOnce([{ url: mockUrl }]);
    
    // Mock successful profile update
    const mockResponse = {
      success: true,
      data: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: mockUrl,
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });
    
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Select file
    const fileInput = screen.getByText(/Profile Picture/i).closest('div')!.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'));
    
    // Wait for upload to be called
    await waitFor(() => {
      expect(mockUploadThing.startUpload).toHaveBeenCalledWith([file]);
    });
    
    // Wait for fetch to be called with the uploaded URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/users/${mockInitialData.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining(mockUrl),
        })
      );
    });
  });
  
  test('aborts previous request when submitting form multiple times', async () => {
    // Create a mock AbortController
    const mockAbort = jest.fn();
    const mockAbortController = {
      signal: { aborted: false },
      abort: mockAbort,
    };
    
    // Mock AbortController constructor
    global.AbortController = jest.fn(() => mockAbortController) as any;
    
    render(<ProfileForm initialData={mockInitialData} />);
    
    // Submit form twice in quick succession
    fireEvent.submit(screen.getByRole('form'));
    fireEvent.submit(screen.getByRole('form'));
    
    // Verify abort was called
    expect(mockAbort).toHaveBeenCalled();
  });
  
  test('aborts request when component unmounts', async () => {
    // Create a mock AbortController
    const mockAbort = jest.fn();
    const mockAbortController = {
      signal: { aborted: false },
      abort: mockAbort,
    };
    
    // Mock AbortController constructor
    global.AbortController = jest.fn(() => mockAbortController) as any;
    
    const { unmount } = render(<ProfileForm initialData={mockInitialData} />);
    
    // Submit form to create the controller
    fireEvent.submit(screen.getByRole('form'));
    
    // Unmount component
    unmount();
    
    // Verify abort was called
    expect(mockAbort).toHaveBeenCalled();
  });
});
