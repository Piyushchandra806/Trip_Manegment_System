import { NextResponse } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define route types
  const isAdminFrontend = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';

  let response = NextResponse.next();

  if (isAdminFrontend || isAdminApi) {
    const token = request.cookies.get('admin_token')?.value;
    let isValid = false;

    if (token) {
      try {
        const payload = await verifySession(token);
        if (payload && payload.admin) {
          isValid = true;
        }
      } catch (err) {
        console.error('Session verification failed in middleware:', err);
      }
    }

    if (!isValid) {
      if (isAdminApi) {
        // Return 401 Unauthorized for APIs
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please login.' },
          { status: 401 }
        );
      } else {
        // Redirect to login for frontend routes
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Only apply cache control to protected frontend routes
    if (isAdminFrontend) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all admin UI paths:
     * - /admin
     * - /admin/...
     */
    '/admin/:path*',
    
    /*
     * Match all admin API paths:
     * - /api/admin
     * - /api/admin/...
     */
    '/api/admin/:path*',
  ],
};
