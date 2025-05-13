// filepath: /Users/vcostin/Work/pic-gallery/src/components/__tests__/DeleteImageConfirmDialog.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteImageConfirmDialog } from '../DeleteImageConfirmDialog';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock ConfirmDialog component
jest.mock('../ConfirmDialog', () => ({
  ConfirmDialog: (props: any) => (
    props.isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={props.onConfirm} data-testid="confirm-button">Confirm</button>
        <button onClick={props.onCancel} data-testid="cancel-button">Cancel</button>
      </div>
    ) : null
  )
}));

describe('DeleteImageConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fetch mock responses
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/usage')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { galleries: [] } 
          })
        });
      }
      if (options && options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });
  
  test('checks image usage only once when dialog opens', async () => {
    render(<DeleteImageConfirmDialog imageId="test-image-1" isOpen={true} onClose={() => {}} onDeleted={() => {}} />);
    
    // Verify usage check API was called exactly once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/images/test-image-1/usage',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          signal: expect.any(AbortSignal)
        })
      );
    });
  });
  
  test('makes delete API call exactly once when confirmed', async () => {
    render(<DeleteImageConfirmDialog imageId="test-image-1" isOpen={true} onClose={() => {}} onDeleted={() => {}} />);
    
    // Wait for initial usage call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Reset mock to focus on the delete call
    jest.clearAllMocks();
    
    // Click confirm button
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);
    
    // Verify delete API was called exactly once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/images/test-image-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          signal: expect.any(AbortSignal)
        })
      );
    });
  });
  
  test('does not make delete API call when canceled', async () => {
    render(<DeleteImageConfirmDialog imageId="test-image-1" isOpen={true} onClose={() => {}} onDeleted={() => {}} />);
    
    // Wait for initial usage call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Reset mock to focus on potential delete calls
    jest.clearAllMocks();
    
    // Click cancel button
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    // Verify no delete API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
