import { NextRequest, NextResponse } from 'next/server';
import ping from 'ping';
import { storePingResult } from '@/lib/monitorPingOperations';

export async function POST(req: NextRequest) {
  const { ip, timeout, monitorId } = await req.json();

  const trimmedIp = ip.trim();

  console.log(`Received ping request for IP: ${trimmedIp}, timeout: ${timeout}, monitorId: ${monitorId}`);

  if (!trimmedIp || !monitorId) {
    return NextResponse.json({ error: 'IP address and monitorId are required' }, { status: 400 });
  }

  try {
    console.log(`Pinging ${trimmedIp}...`);
    const result = await ping.promise.probe(trimmedIp, {
      timeout: timeout ? timeout / 1000 : 5, // Use 5 seconds as default if timeout is undefined
    });
    console.log(`Ping result for ${trimmedIp}:`, result);

    const responseTime = typeof result.time === 'number' ? Math.round(result.time) : 0;
    await storePingResult(monitorId, responseTime, result.alive);

    return NextResponse.json({
      alive: result.alive,
      time: responseTime,
      output: result.output,
    });
  } catch (error) {
    console.error('Error pinging IP:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
