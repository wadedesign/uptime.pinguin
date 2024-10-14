import { Pool } from 'pg';
import axios from 'axios';
import { storePingResult } from './getpinghistory';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

interface Monitor {
  id: string;
  name: string;
  url_ip_address: string;
  protocol: string;
  port?: number;
  check_interval: number;
}

async function checkMonitorStatus(monitor: Monitor): Promise<{ status: 'up' | 'down', responseTime?: number }> {
  const protocol = monitor.protocol.toLowerCase();
  
  try {
    let response;
    if (protocol === 'icmp') {
      response = await axios.post('/api/connection-handlers/ping', {
        ip: monitor.url_ip_address.trim(),
        timeout: 5000,
        monitorId: monitor.id,
      });
      const status = response.data.alive ? 'up' : 'down';
      const responseTime = response.data.time !== 'unknown' ? parseFloat(response.data.time) : undefined;
      await storePingResult(monitor.id, responseTime || 0, status === 'up');
      return { status, responseTime };
    } else {
      response = await axios.post('/api/connection-handlers/https', {
        url: `${protocol}://${monitor.url_ip_address}`,
        method: 'GET',
        timeout: 5000,
        monitorId: monitor.id,
      });
      const status = response.data.status < 400 ? 'up' : 'down';
      await storePingResult(monitor.id, response.data.responseTime, status === 'up');
      return { status, responseTime: response.data.responseTime };
    }
  } catch (error) {
    console.error(`Error checking status for ${monitor.url_ip_address}:`, error);
    await storePingResult(monitor.id, 0, false);
    return { status: 'down' };
  }
}

async function sendDiscordNotification(webhookUrl: string, message: string) {
  try {
    await axios.post(webhookUrl, { content: message });
    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

export async function runMonitoringCycle() {
  const client = await pool.connect();
  try {
    const monitorsResult = await client.query('SELECT * FROM monitors');
    const monitors: Monitor[] = monitorsResult.rows;

    for (const monitor of monitors) {
      const status = await checkMonitorStatus(monitor);
      
      // Fetch the previous status
      const previousStatusResult = await client.query('SELECT status FROM monitor_status WHERE monitor_id = $1 ORDER BY created_at DESC LIMIT 1', [monitor.id]);
      const previousStatus = previousStatusResult.rows[0]?.status;

      // Insert new status
      await client.query('INSERT INTO monitor_status (monitor_id, status, response_time) VALUES ($1, $2, $3)', [monitor.id, status.status, status.responseTime]);

      // Check if status has changed
      if (status.status !== previousStatus) {
        // Fetch Discord webhook URL and auto notification settings
        const settingsResult = await client.query(`
          SELECT d.webhook_url, an.is_enabled
          FROM discord_webhooks d
          LEFT JOIN auto_notifications an ON d.monitor_id = an.monitor_id
          WHERE d.monitor_id = $1
        `, [monitor.id]);
        
        const settings = settingsResult.rows[0];

        if (settings && settings.is_enabled && settings.webhook_url) {
          const message = `
            Monitor Alert: ${monitor.name}
            Status: ${status.status.toUpperCase()}
            Message: Monitor ${monitor.name} is now ${status.status.toUpperCase()}
            Response Time: ${status.responseTime !== undefined ? `${status.responseTime}ms` : 'N/A'}
            Time: ${new Date().toISOString()}
          `;
          await sendDiscordNotification(settings.webhook_url, message);
        }
      }
    }
  } finally {
    client.release();
  }
}
