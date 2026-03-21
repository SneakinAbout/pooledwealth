import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

/**
 * POST /api/admin/investments/[id]/close
 * Closes an investment after its subscription period:
 * - If minimumRaise was met: sets status to CLOSED, locks it
 * - If minimumRaise NOT met: sets status to ARCHIVED, refunds all investors
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const permError = requireAdmin(session);
  if (permError) return permError;

  const investment = await prisma.investment.findUnique({
    where: { id: params.id },
    include: {
      holdings: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
  if (investment.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Only ACTIVE investments can be closed' }, { status: 409 });
  }

  const soldUnits = investment.totalUnits - investment.availableUnits;
  const totalRaised = Number(investment.pricePerUnit) * soldUnits;
  const minimumRaise = Number(investment.minimumRaise ?? 0);
  const minimumMet = minimumRaise === 0 || totalRaised >= minimumRaise;

  if (minimumMet) {
    // Success — close and lock
    await prisma.investment.update({
      where: { id: params.id },
      data: { status: 'CLOSED', locked: true },
    });
    return NextResponse.json({ outcome: 'closed', totalRaised, minimumMet: true });
  }

  // Failed raise — refund all investors
  await prisma.$transaction(async (tx) => {
    await tx.investment.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    for (const holding of investment.holdings) {
      const refundAmount = Number(holding.purchasePrice);

      // Delete the holding
      await tx.holding.delete({ where: { id: holding.id } });

      // Restore available units
      await tx.investment.update({
        where: { id: params.id },
        data: { availableUnits: { increment: holding.unitsPurchased } },
      });

      // Refund wallet
      await tx.wallet.upsert({
        where: { userId: holding.userId },
        update: { balance: { increment: refundAmount } },
        create: { userId: holding.userId, balance: refundAmount },
      });

      // Record refund transaction
      await tx.transaction.create({
        data: {
          userId: holding.userId,
          investmentId: params.id,
          type: 'REDEMPTION',
          amount: refundAmount,
          units: holding.unitsPurchased,
          status: 'COMPLETED',
        },
      });
    }
  });

  return NextResponse.json({
    outcome: 'refunded',
    totalRaised,
    minimumRaise,
    refundedCount: investment.holdings.length,
  });
}
