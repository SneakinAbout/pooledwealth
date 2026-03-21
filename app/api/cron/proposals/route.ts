import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { closeProposal } from '@/lib/proposals';

// Secured with a shared secret — set CRON_SECRET in env.
// Call daily: GET /api/cron/proposals
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all OPEN proposals past their close date
    const expired = await prisma.proposal.findMany({
      where: { status: 'OPEN', closesAt: { lt: now } },
      select: { id: true, type: true },
    });

    const results: { id: string; finalStatus: string }[] = [];

    for (const proposal of expired) {
      const finalStatus = await closeProposal(proposal.id);
      results.push({ id: proposal.id, finalStatus });
    }

    console.log('[CRON proposals] closed', results.length, 'proposals', results);
    return NextResponse.json({ closed: results.length, results });
  } catch (err) {
    console.error('[CRON proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
