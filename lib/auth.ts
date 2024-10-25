import { NextRequest } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export async function getSession(request: NextRequest) {
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

export async function validatePassword(password: string): Promise<boolean> {
  const hashedPassword = process.env.PROTECT_PASSWORD;
  if (!hashedPassword) {
    throw new Error('Missing required environment variable: PROTECT_PASSWORD');
  }
  return bcrypt.compare(password, hashedPassword);
}
