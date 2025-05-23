'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface DeleteAccountDialogProps {
  userId: string;
}

export function DeleteAccountDialog({ userId }: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();

  // Listen for clicks on the delete account button
  useEffect(() => {
    const handleDeleteClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.hasAttribute('data-delete-account-id')) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleDeleteClick);
    return () => document.removeEventListener('click', handleDeleteClick);
  }, []);

  const closeDialog = () => {
    setIsOpen(false);
    setError(null);
    setConfirmText('');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Sign out the user after successful deletion
      await signOut({ redirect: false });
      
      // Redirect to homepage
      router.push('/');
      router.refresh();
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your account');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={closeDialog}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          aria-label="Close"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-red-600 mb-4">Delete Account</h2>
        
        <div className="mb-6">
          <p className="mb-3">
            Are you sure you want to delete your account? This action cannot be undone and will result in the permanent deletion of:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>All your uploaded images</li>
            <li>All your galleries</li>
            <li>Your profile information</li>
          </ul>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Type <span className="font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            placeholder="DELETE"
            autoComplete="off"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={closeDialog}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmText !== 'DELETE'}
            data-testid="confirm-delete-account"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete account'}
          </button>
        </div>
      </div>
    </div>
  );
}
