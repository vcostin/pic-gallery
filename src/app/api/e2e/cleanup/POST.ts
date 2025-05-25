// filepath: /Users/vcostin/Work/pic-gallery/src/app/api/e2e/cleanup/route.ts (POST method)
import { DELETE } from './route';

/**
 * POST handler for E2E test data cleanup that supports _method=DELETE
 * 
 * This is for compatibility with frameworks that don't support DELETE requests directly
 * or when working behind certain proxies that may have trouble with DELETE.
 */
export async function POST(req: Request) {
  try {
    // Parse the request body to check for _method
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      
      // If _method is DELETE, process it as a DELETE request
      if (body && body._method === 'DELETE') {
        return DELETE(req);
      }
    }
    
    // If not a _method=DELETE request, return an error
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Method not allowed. Use DELETE or POST with _method=DELETE' 
      }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error processing request' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
