import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// export the function as 'proxy' according to the new next.js conventions
export function proxy(request: NextRequest) {
  // your authentication or routing logic goes here
  return NextResponse.next();
}

// configure paths that trigger the proxy
export const config = {
  matcher: [
    // bypass api routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
