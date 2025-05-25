'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * This component provides a button to clean up E2E test data.
 * It only appears for users with the E2E test email.
 * 
 * The component provides two options:
 * 1. Clean up test data only (preserves user account)
 * 2. Complete cleanup (deletes test data AND user account)
 */
export function E2ETestCleanupButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteUser, setDeleteUser] = useState(false);

  // Only show if we're in a test environment and the user is the test user
  const isTestUser = session?.user?.email === process.env.NEXT_PUBLIC_E2E_TEST_USER_EMAIL;
  const isTestEnv = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_E2E_TEST_FEATURES === 'true';

  if (!isTestUser || !isTestEnv) {
    return null;
  }

  const handleOpenDialog = (withUserDeletion: boolean) => {
    setDeleteUser(withUserDeletion);
    setShowConfirmDialog(true);
  };

  const handleCancelCleanup = () => {
    setShowConfirmDialog(false);
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    setResult(null);
    setShowConfirmDialog(false);

    try {
      // Call the cleanup API with the appropriate query parameter
      const endpoint = deleteUser ? '/api/e2e/cleanup?deleteUser=true' : '/api/e2e/cleanup';
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        const counts = data.data.deletedCount;
        
        // Build message based on what was deleted
        const deletedItems = [
          `${counts.galleries} galleries`,
          `${counts.images} images`
        ];
        
        if (counts.user) {
          deletedItems.push(`${counts.user} user account`);
        }
        
        setResult({
          success: true,
          message: `Cleanup successful. Deleted: ${deletedItems.join(', ')}`
        });
        
        // If user was deleted, we need to redirect to the login page after a short delay
        if (deleteUser && counts.user > 0) {
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } else {
        setResult({
          success: false,
          message: 'Cleanup failed. Check the console for more details.'
        });
        console.error('E2E cleanup failed:', await response.text());
      }
    } catch (error) {
      console.error('Error during E2E cleanup:', error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg border border-gray-300 dark:border-gray-600">
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        E2E Test Controls
      </div>
      
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => handleOpenDialog(false)}
          disabled={isLoading}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-md transition-colors"
          data-testid="e2e-cleanup-button"
        >
          {isLoading ? 'Cleaning...' : 'Clean Test Data'}
        </button>
        
        <button
          onClick={() => handleOpenDialog(true)}
          disabled={isLoading}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          data-testid="e2e-complete-cleanup-button"
        >
          {isLoading ? 'Cleaning...' : 'Complete Cleanup + Delete User'}
        </button>
      </div>
      
      {result && (
        <div className={`mt-2 text-xs ${result.success ? 'text-green-500' : 'text-red-500'}`}>
          {result.message}
        </div>
      )}
      
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">
              {deleteUser ? 'Complete Cleanup Confirmation' : 'Data Cleanup Confirmation'}
            </h3>
            
            <p className="mb-4 text-sm">
              {deleteUser 
                ? 'This will delete ALL test data AND your user account. You will be logged out.'
                : 'This will delete all galleries and images created by this test account.'}
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelCleanup}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                className={`px-3 py-1 text-white text-sm rounded-md ${
                  deleteUser 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {deleteUser ? 'Yes, Delete Everything' : 'Yes, Clean Data Only'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
