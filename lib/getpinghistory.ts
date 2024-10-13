// lib/getpinghistory.ts

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Create the ping_history table if it doesn't exist
async function createPingHistoryTableIfNotExists() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ping_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        monitor_id UUID NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        response_time INTEGER,
        status BOOLEAN,
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );
    `);
  } finally {
    client.release();
  }
}

createPingHistoryTableIfNotExists().catch((error) => {
  console.error('Error creating ping_history table:', error);
});

// Function to store ping result
export async function storePingResult(monitorId: string, responseTime: number, status: boolean) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO ping_history (monitor_id, response_time, status) VALUES ($1, $2, $3)',
      [monitorId, responseTime, status]
    );
  } finally {
    client.release();
  }
}

// Function to get ping history for a specific monitor
export async function getPingHistory(monitorId: string, limit: number = 100) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM ping_history WHERE monitor_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [monitorId, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// Function to get the latest ping result for a specific monitor
export async function getLatestPingResult(monitorId: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM ping_history WHERE monitor_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [monitorId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}
