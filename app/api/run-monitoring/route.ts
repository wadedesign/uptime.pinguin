import { NextResponse } from 'next/server';
import { runMonitoringCycle } from '@/lib/monitoringService';

export async function GET() {
  try {
    await runMonitoringCycle();
    return NextResponse.json({ success: true, message: 'Monitoring cycle completed successfully' });
  } catch (error) {
    console.error('Error running monitoring cycle:', error);
    return NextResponse.json({ success: false, message: 'Error running monitoring cycle' }, { status: 500 });
  }
}
