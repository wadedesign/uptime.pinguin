import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';

export async function authMiddleware(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // if authenticated, allow the request to proceed - towards the api routes
  return NextResponse.next();
}
