// app/api/createincident/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Create the incidents table if it doesn't exist
async function createIncidentsTableIfNotExists() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        monitor_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
      );
    `);
  } finally {
    client.release();
  }
}

createIncidentsTableIfNotExists().catch((error) => {
  console.error('Error creating incidents table:', error);
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['monitor_id', 'title', 'status', 'severity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const client = await pool.connect();
    try {
      // First, check if the monitor exists
      const monitorCheck = await client.query('SELECT id FROM monitors WHERE id = $1', [body.monitor_id]);
      if (monitorCheck.rowCount === 0) {
        return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 404 });
      }

      // Insert the new incident
      const result = await client.query(
        `INSERT INTO incidents (
          monitor_id, title, description, status, severity
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          body.monitor_id,
          body.title,
          body.description || null,
          body.status,
          body.severity
        ]
      );

      const incidentId = result.rows[0].id;
      return NextResponse.json({ 
        success: true, 
        message: 'Incident created successfully', 
        incidentId 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ success: false, message: 'Error creating incident' }, { status: 500 });
  }
}

// Get all incidents
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT i.*, m.name as monitor_name 
        FROM incidents i 
        JOIN monitors m ON i.monitor_id = m.id 
        ORDER BY i.created_at DESC
      `);
      return NextResponse.json({ success: true, incidents: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ success: false, message: 'Error fetching incidents' }, { status: 500 });
  }
}

// Update an incident
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Incident ID is required for updating' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const { id, title, description, status, severity } = body;
      const result = await client.query(
        `UPDATE incidents SET
          title = $1, description = $2, status = $3, severity = $4, updated_at = NOW()
        WHERE id = $5 RETURNING id`,
        [title, description || null, status, severity, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Incident updated successfully', incidentId: id });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ success: false, message: 'Error updating incident' }, { status: 500 });
  }
}

// Delete an incident
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('id');
  
    if (!incidentId) {
      return NextResponse.json({ success: false, message: 'Incident ID is required' }, { status: 400 });
    }
  
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [incidentId]);
  
      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, message: 'Incident deleted successfully', deletedId: incidentId });
    } catch (error) {
      console.error('Error deleting incident:', error);
      return NextResponse.json({ success: false, message: 'Error deleting incident' }, { status: 500 });
    } finally {
      client.release();
    }
  }
