// lib/createdbs/notify.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export async function ensureNotificationTablesExist() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // create monitors table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        alert_type VARCHAR(50)
      )
    `);

    // create discord_webhooks table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS discord_webhooks (
        monitor_id INTEGER PRIMARY KEY REFERENCES monitors(id),
        webhook_url TEXT NOT NULL
      )
    `);

    // create auto_notifications table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS auto_notifications (
        monitor_id INTEGER PRIMARY KEY REFERENCES monitors(id),
        is_enabled BOOLEAN DEFAULT false,
        is_watching BOOLEAN DEFAULT false
      )
    `);

    await client.query('COMMIT');
    console.log('Notification tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating notification tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
