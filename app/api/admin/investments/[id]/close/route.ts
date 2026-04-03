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
 *
 * All reads and writes happen inside a single transaction to prevent
 * race conditions where investors buy units during the close operation.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    // Quick pre-check outside transaction for early 404/409 feedback
    const preCheck = await prisma.investment.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!preCheck) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    if (preCheck.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE investments can be closed' }, { status: 409 });
    }

    // All authoritative logic inside a single transaction — re-fetch investment
    // and holdings here so we see the true final state with no race conditions.
    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: params.id },
        include: {
          holdings: {
            include: { user: { select: { email: true, name: true } } },
          },
        },
      });

      if (!investment || investment.status !== 'ACTIVE') {
        throw Object.assign(new Error('Only ACTIVE investments can be closed'), { status: 409 });
      }

      const soldUnits = investment.totalUnits - investment.availableUnits;
      const totalRaised = Number(investment.pricePerUnit) * soldUnits;
      const minimumRaise = Number(investment.minimumRaise ?? 0);
      // minimumRaise is a unit count; compare sold units (not dollars) to the minimum
      const minimumMet = minimumRaise === 0 || soldUnits >= minimumRaise;

      if (minimumMet) {
        // Success — close, lock, and create trust disbursement record
        await tx.investment.update({
          where: { id: params.id },
          data: { status: 'CLOSED', locked: true },
        });
        await tx.trustDisbursement.upsert({
          where: { investmentId: params.id },
          update: { totalRaised },
          create: { investmentId: params.id, totalRaised },
        });
        return { outcome: 'closed', totalRaised, minimumMet: true, refundedCount: 0 };
      }

      // Failed raise — archive and refund all investors
      await tx.investment.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' },
      });

      // Pro-rate the management fee refund for the current month.
      // Fees are charged on the 1st — if archiving mid-month, refund the
      // unused portion (remaining days / days in month) for each investor's
      // share of this investment.
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      // Fraction of the month already used (1 = full month, 0 = no days elapsed)
      const usedFraction = dayOfMonth / daysInMonth;
      const refundFraction = 1 - usedFraction;

      const settings = await tx.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
      const annualPct = Number(settings?.managementFeePercent ?? 2);

      for (const holding of investment.holdings) {
        const refundAmount = Number(holding.purchasePrice);

        await tx.holding.delete({ where: { id: holding.id } });

        await tx.investment.update({
          where: { id: params.id },
          data: { availableUnits: { increment: holding.unitsPurchased } },
        });

        // Refund capital
        await tx.wallet.upsert({
          where: { userId: holding.userId },
          update: { balance: { increment: refundAmount } },
          create: { userId: holding.userId, balance: refundAmount },
        });

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

        // Pro-rated fee refund for unused days this month (only if archiving after the 1st)
        if (refundFraction > 0.01) {
          const monthlyFee = Math.round((refundAmount * (annualPct / 100) / 12) * 100) / 100;
          const feeRefund = Math.round(monthlyFee * refundFraction * 100) / 100;
          if (feeRefund > 0) {
            await tx.wallet.update({
              where: { userId: holding.userId },
              data: { balance: { increment: feeRefund } },
            });
            await tx.transaction.create({
              data: {
                userId: holding.userId,
                investmentId: params.id,
                type: 'FEE',
                amount: -feeRefund, // negative = refund
                status: 'COMPLETED',
              },
            });
          }
        }
      }

      return {
        outcome: 'refunded',
        totalRaised,
        minimumRaise,
        refundedCount: investment.holdings.length,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e.status) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[POST /api/admin/investments/[id]/close]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
