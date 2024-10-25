import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { LRUCache } from 'lru-cache';
import { validatePassword } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

async function createTablesIfNotExist() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

createTablesIfNotExist().catch((error) => {
  console.error('Error creating tables:', error);
});

const requiredEnvVars = ['PROTECT_PASSWORD', 'DB_URL', 'COOKIE_MAX_AGE', 'CSRF_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60 * 1000,
});

const CSRF_SECRET = process.env.CSRF_SECRET!;

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const csrfToken = await createCSRFToken(session?.userId || 'unauthenticated');
  if (session) {
    return NextResponse.json({ success: true, message: 'Authenticated', csrfToken });
  }
  return NextResponse.json({ success: false, message: 'Not authenticated', csrfToken });
}

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const tokenCount = (rateLimitCache.get(ip) as number) || 0;
  if (tokenCount >= 5) {
    return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
  }
  rateLimitCache.set(ip, tokenCount + 1);

  const body = await request.json();
  const { password, csrfToken } = body;

  if (!password || !csrfToken) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  if (!(await validateCSRFToken(csrfToken))) {
    return NextResponse.json({ success: false, message: 'Invalid CSRF token' }, { status: 403 });
  }

  if (await validatePassword(password)) {
    const userId = await createSession();
    const response = NextResponse.json({ success: true, message: 'Authenticated' });
    await setAuthCookie(response, userId);
    return response;
  }

  const response = NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
  await clearAuthCookie(response);
  return response;
}

async function getSession(request: NextRequest): Promise<{ userId: string } | null> {
  const sessionId = request.cookies.get('auth_session')?.value;
  if (!sessionId) return null;

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT user_id FROM sessions WHERE id = $1', [sessionId]);
    if (result.rows[0]) {
      const sessionCreatedAt = result.rows[0].created_at;
      const sessionMaxAge = parseInt(process.env.COOKIE_MAX_AGE!, 10) * 1000;
      if (Date.now() - sessionCreatedAt.getTime() > sessionMaxAge) {
        await client.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
        return null;
      }
      return { userId: result.rows[0].user_id };
    }
    return null;
  } finally {
    client.release();
  }
}

async function createSession(): Promise<string> {
  const client = await pool.connect();
  try {
    const result = await client.query('INSERT INTO sessions (user_id) VALUES (gen_random_uuid()) RETURNING user_id');
    return result.rows[0].user_id;
  } finally {
    client.release();
  }
}

async function setAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set('auth_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE!, 10),
    path: '/',
  });
}

async function clearAuthCookie(response: NextResponse) {
  response.cookies.set('auth_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

async function createCSRFToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  return token;
}

async function validateCSRFToken(token: string): Promise<boolean> {
  return token.length === 64;
}
