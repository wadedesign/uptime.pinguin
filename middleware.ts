/*
-- I know this is it def not the best way to do this, but it works for now. I think
 @ lib/authMiddleware is where we should be authenticating users towards the api routes
 @ lib/auth.ts is where we should be authenticating users towards the client routes
*/

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './lib/authMiddleware';

const publicEndpoints = [
  '/api/protectpage', // Allow access to authentication-related endpoint
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // we allow public access to the following endpoints:
  if (publicEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    return NextResponse.next();
  }

  // we start to apply authentication to all other API routes
  if (pathname.startsWith('/api')) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/'],
}
