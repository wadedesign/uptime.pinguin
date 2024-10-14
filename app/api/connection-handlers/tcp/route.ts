// app/api/connection-handlers/tcp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { host, port, timeout } = await req.json();

    if (!host || !port) {
      return NextResponse.json({ error: 'Host and port are required' }, { status: 400 });
    }

    const result = await testTcpConnection(host, port, timeout);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      ...result,
      responseTime,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function testTcpConnection(host: string, port: number, timeout: number = 5000): Promise<{ success: boolean, message: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      socket.destroy();
      resolve({ success: true, message: `Successfully connected to ${host}:${port}` });
    });

    socket.on('error', (error) => {
      socket.destroy();
      resolve({ success: false, message: `Failed to connect: ${error.message}` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, message: `Connection timed out after ${timeout}ms` });
    });
  });
}
