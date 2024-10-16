import { NextRequest } from 'next/server';

export async function getSession(request: NextRequest) {
  const sessionId = request.cookies.get('auth_session')?.value;
  if (!sessionId) return null;

    // dev - we are just using session - we can add more here later
  return { userId: sessionId };
}
