'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';

export function Navigation() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const pathname = usePathname();

  const getLinkClassName = (path: string) => {
    const baseStyles = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const isActive = pathname === path;
    
    return `${baseStyles} ${
      isActive 
        ? "bg-blue-500 text-white hover:bg-blue-600" 
        : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
    }`;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600" data-testid="nav-logo">
              Pic Gallery
            </Link>
            {isAuthenticated && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/images"
                  className={getLinkClassName('/images')}
                  data-testid="nav-images-link"
                >
                  My Images
                </Link>
                <Link
                  href="/galleries"
                  className={getLinkClassName('/galleries')}
                  data-testid="nav-galleries-link"
                >
                  My Galleries
                </Link>
              </div>
            )}
          </div>
          <div>
            {isLoading ? (
              <div>Loading...</div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className={getLinkClassName('/profile')}
                  data-testid="nav-profile-link"
                >
                  My Profile
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  data-testid="logout-button"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signIn()}
                data-testid="nav-signin-button"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
