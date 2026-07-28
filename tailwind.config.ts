// next.js middleware for protecting employee routes and role authorization
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // inspect session cookie for employee routes except login page
  if (pathname.startsWith('/employee') && !pathname.startsWith('/employee/login')) {
    const sessionCookie = request.cookies.get('employee_session');

    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/employee/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/employee/:path*'],
};
