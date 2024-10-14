// api/protectpage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createHmac } from 'crypto';
import { LRUCache } from 'lru-cache';


const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// this should create the table in your db (hopefully) - probably should log this if it doesn't
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
  ttl: 60 * 1000, // can you figure out how long this is? LOL
});

const CSRF_SECRET = process.env.CSRF_SECRET!; // i make you get a secret key for this

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const csrfToken = await createCSRFToken(session?.userId || 'unauthenticated');
  if (session) {
    return NextResponse.json({ success: true, message: 'Authenticated', csrfToken });
  }
  return NextResponse.json({ success: false, message: 'Not authenticated', csrfToken });
}

export async function POST(request: NextRequest) {
  // ! maybe we need to check the ip address?
  const ip = request.ip || 'unknown';
  const tokenCount = (rateLimitCache.get(ip) as number) || 0;
  if (tokenCount >= 5) {
    return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
  }
  rateLimitCache.set(ip, tokenCount + 1);

  console.log('Received POST request');
  
  const body = await request.json();
  console.log('Request body:', body);

  const { password, csrfToken } = body;

  console.log('Received password:', password);
  console.log('Received CSRF token:', csrfToken);

  if (!password || !csrfToken) {
    console.log('Invalid request: missing password or CSRF token');
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  if (!(await validateCSRFToken(csrfToken))) {
    console.log('Invalid CSRF token');
    return NextResponse.json({ success: false, message: 'Invalid CSRF token' }, { status: 403 });
  }

  const correctPassword = process.env.PROTECT_PASSWORD!;
  console.log('Correct password:', correctPassword); // Log the correct password (be careful with this in production!)

  if (password === correctPassword) {
    console.log('Password matched');
    const userId = await createSession();
    const response = NextResponse.json({ success: true, message: 'Authenticated' });
    await setAuthCookie(response, userId);
    return response;
  }

  console.log('Password mismatch');
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
      const sessionMaxAge = parseInt(process.env.COOKIE_MAX_AGE!, 10) * 1000; // Convert to milliseconds
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
  const timestamp = Date.now().toString();
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${userId}${timestamp}`);
  const hash = hmac.digest('hex');
  return `${timestamp}.${hash}`;
}

async function validateCSRFToken(token: string): Promise<boolean> {
  console.log('Validating CSRF token:', token);
  const [timestamp, hash] = token.split('.');
  if (!timestamp || !hash) {
    console.log('Invalid token format');
    return false;
  }

  const now = Date.now();
  if (now - parseInt(timestamp, 10) > 3600000) {
    console.log('Token expired');
    return false;
  }

  // uptimer doesn't have to use the user id, so we'll use 'unauthenticated'
  const userId = 'unauthenticated';
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${userId}${timestamp}`);
  const expectedHash = hmac.digest('hex');

  const isValid = expectedHash === hash;
  console.log('CSRF token validation result:', isValid);
  return isValid;
}
