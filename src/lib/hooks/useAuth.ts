'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { User } from '@/lib/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (options?: { callbackUrl?: string, redirect?: boolean }) => Promise<void>;
  signOut: (options?: { callbackUrl?: string, redirect?: boolean }) => Promise<void>;
  requireAuth: () => boolean;
}

/**
 * Custom hook for authentication operations and state
 * Centralizes auth logic and provides a consistent interface
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';
  
  // Get typed user data from session
  const user = session?.user as User | null;
  
  /**
   * Sign in handler with redirect capability
   */
  const handleSignIn = useCallback(async (options?: { callbackUrl?: string, redirect?: boolean }) => {
    const { callbackUrl = '/', redirect = true } = options || {};
    await signIn(undefined, { callbackUrl, redirect });
  }, []);
  
  /**
   * Sign out handler with redirect capability
   */
  const handleSignOut = useCallback(async (options?: { callbackUrl?: string, redirect?: boolean }) => {
    const { callbackUrl = '/auth/signin', redirect = true } = options || {};
    await signOut({ callbackUrl, redirect });
  }, []);
  
  /**
   * Use this to require authentication for protected pages
   * Returns true if user is authenticated, false otherwise
   * Automatically redirects to signin page if not authenticated
   */
  const requireAuth = useCallback((): boolean => {
    if (isLoading) {
      return false; // Still loading, don't do anything yet
    }
    
    if (!isAuthenticated) {
      router.push('/api/auth/signin');
      return false;
    }
    
    return true;
  }, [isAuthenticated, isLoading, router]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    requireAuth,
  };
}
