'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import logger from '@/lib/logger';

interface AdminControlsProps {
  userId: string;
  userRole: UserRole;
}

export function AdminControls({ userId, userRole }: AdminControlsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleAdminStatus = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Set the new role opposite of current role
      const newRole = userRole === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
      
      const response = await fetch(`/api/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user role');
      }
      
      // Show success message (could use a toast here)
      const result = await response.json();
      logger.log(result.message);
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error toggling admin status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="text-sm text-red-600 mb-2">{error}</div>
      )}
      
      <button
        onClick={toggleAdminStatus}
        disabled={isSubmitting}
        className={`px-4 py-2 rounded-md text-white transition ${
          userRole === UserRole.ADMIN 
            ? 'bg-orange-500 hover:bg-orange-600' 
            : 'bg-purple-600 hover:bg-purple-700'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Processing...' : (
          userRole === UserRole.ADMIN ? 'Remove Admin Status' : 'Make Admin'
        )}
      </button>
    </div>
  );
}
