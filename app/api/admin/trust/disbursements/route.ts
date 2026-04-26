import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

/**
 * POST /api/admin/trust/disbursements
 *
 * Creates a TrustDisbursement record for a CLOSED investment that doesn't have
 * one yet. This can happen if the investment was closed outside the normal
 * close route (e.g. directly via status update).
 *
 * totalRaised is calculated from completed PURCHASE transactions so it always
 * reflects actual money received, not pricePerUnit * soldUnits.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const { investmentId } = body;

    if (!investmentId) {
      return NextResponse.json({ error: 'investmentId is required' }, { status: 400 });
    }

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: { trustDisbursement: true },
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }
    if (investment.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Only CLOSED investments can have a disbursement record created' },
        { status: 400 }
      );
    }
    if (investment.trustDisbursement) {
      return NextResponse.json(
        { error: 'A disbursement record already exists for this investment' },
        { status: 409 }
      );
    }

    // Calculate totalRaised from actual PURCHASE transactions (not pricePerUnit * units)
    const purchaseAgg = await prisma.transaction.aggregate({
      where: { investmentId, type: 'PURCHASE', status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRaised = Number(purchaseAgg._sum.amount ?? 0);

    const disbursement = await prisma.trustDisbursement.create({
      data: {
        investmentId,
        totalRaised,
        recordedById: session!.user.id,
      },
      include: {
        investment: { select: { id: true, title: true, status: true } },
        recordedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, disbursement });
  } catch (err) {
    console.error('[POST /api/admin/trust/disbursements]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
