// api/createmonitor/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// we cretae the damn table here
async function createMonitorsTableIfNotExists() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url_ip_address VARCHAR(255) NOT NULL,
        protocol VARCHAR(50) NOT NULL,
        port INTEGER,
        check_interval INTEGER NOT NULL,
        timeout INTEGER,
        alert_type VARCHAR(50),
        alert_threshold INTEGER,
        expected_status_code INTEGER,
        content_match TEXT,
        ssl_tls_check BOOLEAN,
        auth_details JSONB,
        retry_count INTEGER,
        custom_headers JSONB,
        dns_query_type VARCHAR(50),
        ping_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

createMonitorsTableIfNotExists().catch((error) => {
  console.error('Error creating monitors table:', error);
});

// create a monitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const mandatoryFields = ['name', 'url_ip_address', 'protocol', 'check_interval'];
    for (const field of mandatoryFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `Missing mandatory field: ${field}` }, { status: 400 });
      }
    }

    if ((body.protocol === 'TCP' || body.protocol === 'UDP') && !body.port) {
      return NextResponse.json({ success: false, message: 'Port is required for TCP/UDP monitoring' }, { status: 400 });
    }

    // For ICMP, we don't need a port
    if (body.protocol === 'ICMP') {
      body.port = null;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO monitors (
          name, url_ip_address, protocol, port, check_interval, timeout, alert_type, 
          alert_threshold, expected_status_code, content_match, ssl_tls_check, 
          auth_details, retry_count, custom_headers, dns_query_type, ping_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          body.name,
          body.url_ip_address,
          body.protocol,
          body.port || null,
          body.check_interval,
          body.timeout || null,
          body.alert_type || null,
          body.alert_threshold || null,
          body.expected_status_code || null,
          body.content_match || null,
          body.ssl_tls_check || false,
          body.auth_details ? JSON.stringify(body.auth_details) : null,
          body.retry_count || null,
          body.custom_headers ? JSON.stringify(body.custom_headers) : null,
          body.dns_query_type || null,
          body.ping_count || null
        ]
      );

      const monitorId = result.rows[0].id;
      return NextResponse.json({ success: true, message: 'Monitor created successfully', monitorId });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating monitor:', error);
    return NextResponse.json({ success: false, message: 'Error creating monitor' }, { status: 500 });
  }
}

// get all monitors
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM monitors ORDER BY created_at DESC');
      return NextResponse.json({ success: true, monitors: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json({ success: false, message: 'Error fetching monitors' }, { status: 500 });
  }
}

// edit a monitor
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Monitor ID is required for updating' }, { status: 400 });
    }

    const mandatoryFields = ['name', 'url_ip_address', 'protocol', 'check_interval'];
    for (const field of mandatoryFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `Missing mandatory field: ${field}` }, { status: 400 });
      }
    }

    if ((body.protocol === 'TCP' || body.protocol === 'UDP') && !body.port) {
      return NextResponse.json({ success: false, message: 'Port is required for TCP/UDP monitoring' }, { status: 400 });
    }

    // For ICMP, we don't need a port
    if (body.protocol === 'ICMP') {
      body.port = null;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE monitors SET
          name = $1, url_ip_address = $2, protocol = $3, port = $4, check_interval = $5,
          timeout = $6, alert_type = $7, alert_threshold = $8, expected_status_code = $9,
          content_match = $10, ssl_tls_check = $11, auth_details = $12, retry_count = $13,
          custom_headers = $14, dns_query_type = $15, ping_count = $16
        WHERE id = $17 RETURNING id`,
        [
          body.name,
          body.url_ip_address,
          body.protocol,
          body.port,
          body.check_interval,
          body.timeout || null,
          body.alert_type || null,
          body.alert_threshold || null,
          body.expected_status_code || null,
          body.content_match || null,
          body.ssl_tls_check || false,
          body.auth_details ? JSON.stringify(body.auth_details) : null,
          body.retry_count || null,
          body.custom_headers ? JSON.stringify(body.custom_headers) : null,
          body.dns_query_type || null,
          body.ping_count || null,
          body.id
        ]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Monitor updated successfully', monitorId: body.id });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json({ success: false, message: 'Error updating monitor' }, { status: 500 });
  }
}

// delete a monitor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monitorId = searchParams.get('id');

    if (!monitorId) {
      return NextResponse.json({ success: false, message: 'Monitor ID is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM monitors WHERE id = $1 RETURNING id', [monitorId]);

      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Monitor deleted successfully', deletedId: monitorId });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json({ success: false, message: 'Error deleting monitor' }, { status: 500 });
  }
}
