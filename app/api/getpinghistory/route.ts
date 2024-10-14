import { NextRequest, NextResponse } from 'next/server';
import { getPingHistory } from '@/lib/getpinghistory';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monitorId = searchParams.get('monitorId');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!monitorId) {
    return NextResponse.json({ error: 'Monitor ID is required' }, { status: 400 });
  }

  try {
    const history = await getPingHistory(monitorId, limit);
    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching ping history:', error);
    return NextResponse.json({ success: false, message: 'Error fetching ping history' }, { status: 500 });
  }
}
