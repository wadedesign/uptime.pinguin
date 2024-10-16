/*
-- I know this is it def not the best way to do this, but it works for now. I think
 @ lib/authMiddleware is where we should be authenticating users towards the api routes
 @ lib/auth.ts is where we should be authenticating users towards the client routes
*/


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './lib/authMiddleware';


// alot of these should not be public
const publicEndpoints = [
  '/api/getpinghistory',
  '/api/connection-handlers/ping',
  '/api/connection-handlers/https',
  '/api/createmonitor', // GET request to fetch monitors
  '/api/createincident', // GET request to fetch incidents
  '/', // Allow access to the root path (public dashboard)
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // we allow public access to the following endpoints:
  if (publicEndpoints.some(endpoint => pathname.startsWith(endpoint)) || pathname === '/') {
    return NextResponse.next();
  }

  // we start to apply authentication to all other API routes except authentication-related ones
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/protectpage')) {
    return authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/'],
}
