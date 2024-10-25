import { NextRequest, NextResponse } from 'next/server';
import { getSession, validatePassword } from './auth';

export async function authMiddleware(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const password = req.headers.get('x-password');
  if (!password || !(await validatePassword(password))) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  return NextResponse.next();
}
