import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Get the token
  const session = await getToken({ req: request });
  const userId = session?.sub;

  // Check if the path starts with /admin
  if (path.startsWith('/admin')) {
    // If user is not authenticated, redirect to login page
    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
    }

    // Verify if the user is an admin by making a fetch request to our own API
    try {
      // Use absolute URL for fetch as we're in middleware
      const baseUrl = process.env.NEXTAUTH_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
                    
      const adminCheckUrl = `${baseUrl}/api/users/${userId}`;
      
      const res = await fetch(adminCheckUrl, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await res.json();
      // If the user is not an admin, redirect to the home page with an error
      // Support both { role } and { data: { role } } API responses
      const userRole = userData.data?.role ?? userData.role;
      if (userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(
          new URL('/?error=admin_access_required', request.url)
        );
      }
    } catch (error) {
      // If there's an error checking admin status, redirect to home
      console.error('Admin access check failed:', error);
      return NextResponse.redirect(
        new URL('/?error=admin_access_check_failed', request.url)
      );
    }
  }

  return NextResponse.next();
}
