import { NextRequest, NextResponse } from 'next/server';
import { chargeManagementFees } from '@/lib/chargeManagementFees';

// Called by Vercel Cron on the 1st of each month (see vercel.json)
// Protected by CRON_SECRET — Vercel sets Authorization: Bearer <secret> automatically
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { charged, skipped, totalCollected } = await chargeManagementFees();
    console.log(`[cron] Monthly fees charged: $${totalCollected.toFixed(2)} from ${charged} users, ${skipped} skipped`);
    return NextResponse.json({ ok: true, charged, skipped, totalCollected });
  } catch (err) {
    console.error('[cron] Fee charge failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
