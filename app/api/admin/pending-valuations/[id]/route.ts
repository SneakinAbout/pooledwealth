import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/admin/pending-valuations/[id]  body: { action: 'approve' | 'reject' }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action } = await req.json() as { action: string };
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const pending = await prisma.pendingValuation.findUnique({ where: { id: params.id } });
  if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (pending.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.pendingValuation.update({
        where: { id: params.id },
        data: { status: 'APPROVED', reviewedById: session.user.id, reviewedAt: new Date() },
      }),
      prisma.investment.update({
        where: { id: pending.investmentId },
        data: { currentValue: new Decimal(pending.marketValue) },
      }),
      prisma.valuationSnapshot.create({
        data: {
          investmentId: pending.investmentId,
          value: new Decimal(pending.marketValue),
          confidence: pending.confidence,
          compCount: pending.compCount,
          source: 'AUTO',
        },
      }),
    ]);
  } else {
    await prisma.pendingValuation.update({
      where: { id: params.id },
      data: { status: 'REJECTED', reviewedById: session.user.id, reviewedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
