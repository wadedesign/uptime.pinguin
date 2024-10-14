// app/api/notifications/discord/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureNotificationTablesExist } from '@/lib/createdbs/notificationSchema';

async function initializeDatabase() {
  await ensureNotificationTablesExist();
}

async function sendDiscordNotification(webhookUrl: string, message: string) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

async function handleAutoNotifications(request: NextRequest) {
  await initializeDatabase();
  const { searchParams } = new URL(request.url);
  const monitorId = searchParams.get('monitorId');

  if (request.method === 'GET') {
    if (!monitorId) {
      return NextResponse.json({ success: false, message: 'Missing monitorId parameter' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT is_enabled, is_watching FROM auto_notifications WHERE monitor_id = $1', [monitorId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: true, isEnabled: false, isWatching: false });
      }

      return NextResponse.json({ 
        success: true, 
        isEnabled: result.rows[0].is_enabled,
        isWatching: result.rows[0].is_watching
      });
    } catch (error) {
      console.error('Error fetching auto notification settings:', error);
      return NextResponse.json({ success: false, message: 'Error fetching auto notification settings' }, { status: 500 });
    } finally {
      client.release();
    }
  } else if (request.method === 'PUT') {
    const body = await request.json();
    const { monitorId, isEnabled, isWatching } = body;

    if (!monitorId || (isEnabled === undefined && isWatching === undefined)) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingResult = await client.query('SELECT * FROM auto_notifications WHERE monitor_id = $1', [monitorId]);
      
      if (existingResult.rows.length === 0) {
        await client.query(`
          INSERT INTO auto_notifications (monitor_id, is_enabled, is_watching)
          VALUES ($1, $2, $3)
        `, [monitorId, isEnabled !== undefined ? isEnabled : false, isWatching !== undefined ? isWatching : false]);
      } else {
        const updateFields = [];
        const updateValues = [];
        if (isEnabled !== undefined) {
          updateFields.push('is_enabled = $' + (updateValues.length + 2));
          updateValues.push(isEnabled);
        }
        if (isWatching !== undefined) {
          updateFields.push('is_watching = $' + (updateValues.length + 2));
          updateValues.push(isWatching);
        }
        await client.query(`
          UPDATE auto_notifications
          SET ${updateFields.join(', ')}
          WHERE monitor_id = $1
        `, [monitorId, ...updateValues]);
      }

      await client.query('COMMIT');

      console.log('Auto notification settings updated successfully for monitor:', monitorId);
      return NextResponse.json({ success: true, message: 'Auto notification settings updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating auto notification settings:', error);
      return NextResponse.json({ success: false, message: 'Error updating auto notification settings' }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  await initializeDatabase();
  console.log('Received POST request to /api/notifications/discord');
  try {
    const body = await request.json();
    const { monitorId, status, message, responseTime } = body;

    console.log('Received POST request with body:', body);

    if (!monitorId || !status || !message) {
      console.log('Missing required fields:', { monitorId, status, message });
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const isDown = responseTime === 0 || responseTime === undefined;

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT m.name, m.alert_type, d.webhook_url, an.is_enabled
        FROM monitors m
        LEFT JOIN discord_webhooks d ON m.id = d.monitor_id
        LEFT JOIN auto_notifications an ON m.id = an.monitor_id
        WHERE m.id = $1
      `, [monitorId]);
      
      console.log('Query result:', result.rows);

      if (result.rows.length === 0) {
        console.log('Monitor not found for ID:', monitorId);
        return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 404 });
      }

      const monitor = result.rows[0];

      if (!monitor.is_enabled) {
        console.log('Auto notifications are disabled for monitor:', monitorId);
        return NextResponse.json({ success: true, message: 'Auto notifications are disabled for this monitor' });
      }

      const discordWebhookUrl = monitor.webhook_url;
      if (!discordWebhookUrl) {
        console.log('Discord webhook URL not configured for monitor:', monitor);
        return NextResponse.json({ success: false, message: 'Discord webhook URL not configured for this monitor' }, { status: 400 });
      }

      if (monitor.alert_type !== 'discord') {
        await client.query('UPDATE monitors SET alert_type = $1 WHERE id = $2', ['discord', monitorId]);
        console.log('Updated alert_type to discord for monitor:', monitorId);
      }

      if (isDown) {
        // we prepare the message for the incident
        const notificationMessage = `
          **Monitor Alert**: ${monitor.name}
          **Status**: DOWN
          **Message**: ${message}
          **Response Time**: ${responseTime !== undefined ? `${responseTime}ms` : 'N/A'}
          **Time**: ${new Date().toISOString()}
        `;

        console.log('About to send Discord notification with message:', notificationMessage);
        console.log('Using webhook URL:', discordWebhookUrl);

        const notificationSent = await sendDiscordNotification(discordWebhookUrl, notificationMessage);

        console.log('Notification sent result:', notificationSent);

        if (notificationSent) {
          console.log('Discord notification sent successfully for monitor:', monitorId);
          return NextResponse.json({ success: true, message: 'Discord notification sent successfully' });
        } else {
          console.log('Failed to send Discord notification for monitor:', monitorId);
          return NextResponse.json({ success: false, message: 'Failed to send Discord notification' }, { status: 500 });
        }
      } else {
        console.log('Monitor is up, no notification sent');
        return NextResponse.json({ success: true, message: 'Monitor is up, no notification sent' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing Discord notification:', error);
    return NextResponse.json({ success: false, message: 'Error processing Discord notification' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  await initializeDatabase();
  if (request.nextUrl.searchParams.has('autoNotifications')) {
    return handleAutoNotifications(request);
  }
  try {
    const body = await request.json();
    const { monitorId, webhookUrl } = body;

    if (!monitorId || !webhookUrl) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateResult = await client.query('UPDATE monitors SET alert_type = $1 WHERE id = $2 RETURNING id', ['discord', monitorId]);
      
      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 404 });
      }

      await client.query(`
        INSERT INTO discord_webhooks (monitor_id, webhook_url)
        VALUES ($1, $2)
        ON CONFLICT (monitor_id) DO UPDATE SET webhook_url = EXCLUDED.webhook_url
      `, [monitorId, webhookUrl]);

      await client.query('COMMIT');

      console.log('Discord webhook URL saved and alert type updated successfully for monitor:', monitorId);
      return NextResponse.json({ success: true, message: 'Discord webhook URL saved and alert type updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving Discord webhook URL:', error);
    return NextResponse.json({ success: false, message: 'Error saving Discord webhook URL' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await initializeDatabase();
  if (request.nextUrl.searchParams.has('autoNotifications')) {
    return handleAutoNotifications(request);
  }
  const { searchParams } = new URL(request.url);
  const monitorId = searchParams.get('monitorId');

  if (!monitorId) {
    return NextResponse.json({ success: false, message: 'Missing monitorId parameter' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT webhook_url FROM discord_webhooks WHERE monitor_id = $1', [monitorId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, webhookUrl: null });
    }

    return NextResponse.json({ success: true, webhookUrl: result.rows[0].webhook_url });
  } catch (error) {
    console.error('Error fetching Discord webhook URL:', error);
    return NextResponse.json({ success: false, message: 'Error fetching Discord webhook URL' }, { status: 500 });
  } finally {
    client.release();
  }
}
