// next.js middleware for protecting employee routes and strict role authorization
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // check if accessing employee area (excluding login)
  if (pathname.startsWith('/employee') && !pathname.startsWith('/employee/login')) {
    const sessionCookie = request.cookies.get('employee_session');

    // if not logged in, kick to login page
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/employee/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // parse session cookie to enforce role-based access control
      const session = JSON.parse(sessionCookie.value);
      const userRole = session.role;

      // owner has access to everything. other roles are strictly isolated.
      if (userRole !== 'PEMILIK') {
        if (pathname.startsWith('/employee/pelayan') && userRole !== 'PELAYAN') {
          return NextResponse.redirect(new URL('/employee', request.url));
        }
        if (pathname.startsWith('/employee/koki') && userRole !== 'KOKI') {
          return NextResponse.redirect(new URL('/employee', request.url));
        }
        if (pathname.startsWith('/employee/kasir') && userRole !== 'KASIR') {
          return NextResponse.redirect(new URL('/employee', request.url));
        }
        if (pathname.startsWith('/employee/pemilik')) {
          return NextResponse.redirect(new URL('/employee', request.url));
        }
      }
    } catch (error) {
      // if cookie is tampered or invalid, force re-login and clear cookie
      const loginUrl = new URL('/employee/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('employee_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/employee/:path*'],
};
