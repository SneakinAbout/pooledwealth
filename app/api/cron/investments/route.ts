import { NextRequest, NextResponse } from 'next/server';
import { processExpiredInvestments } from '@/lib/investmentActions';

// Secured with a shared secret — set CRON_SECRET in your environment variables.
// Call daily: GET /api/cron/investments
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processExpiredInvestments();
    console.log('[CRON investments]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[CRON investments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
