import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { distributionSchema } from '@/lib/validations';
import { calculateDistributionFees } from '@/lib/fees';
import { auditLog } from '@/lib/audit';
import { sendDistributionReceived } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const distributions = await prisma.distribution.findMany({
      include: {
        investment: {
          select: { id: true, title: true, category: true },
        },
      },
      orderBy: { distributedAt: 'desc' },
    });

    return NextResponse.json(distributions);
  } catch (err) {
    console.error('[GET /api/admin/distributions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const result = distributionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { investmentId, totalAmount, notes, isFinal } = result.data;

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: { holdings: true },
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    const settings = await prisma.platformSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Platform settings not configured' },
        { status: 400 }
      );
    }

    const totalCostBasis = investment.holdings.reduce(
      (sum, h) => sum + Number(h.purchasePrice),
      0
    );

    // Subtract previously distributed gross to get remaining unrecovered cost basis.
    // Once investors have received back more than they paid in, all further
    // distributions are 100% profit and the full profit share applies.
    const prevDistributed = await prisma.distribution.aggregate({
      where: { investmentId },
      _sum: { totalAmount: true },
    });
    const previouslyDistributedGross = Number(prevDistributed._sum.totalAmount ?? 0);
    const remainingCostBasis = Math.max(0, totalCostBasis - previouslyDistributedGross);

    const fees = calculateDistributionFees(totalAmount, settings, remainingCostBasis);

    const totalHeldUnits = investment.holdings.reduce(
      (sum, h) => sum + h.unitsPurchased,
      0
    );

    if (totalHeldUnits === 0) {
      return NextResponse.json(
        { error: 'No investors hold units in this investment' },
        { status: 400 }
      );
    }

    // Use integer cents for proportional math to avoid floating point drift
    const grossCents = Math.round(fees.grossAmount * 100);
    const netCents = Math.round(fees.netAmount * 100);

    const [distribution] = await prisma.$transaction(async (tx) => {
      const distribution = await tx.distribution.create({
        data: {
          investmentId,
          totalAmount: fees.grossAmount,
          feeDeducted: 0,
          profitShareDeducted: fees.profitShare,
          netAmount: fees.netAmount,
          notes,
        },
      });

      // Only mark as final if admin explicitly opted in via the isFinal flag.
      // CLOSED investments may have multiple interim distributions before the final one.
      const isFinalDistribution = !!isFinal && investment.status === 'CLOSED';
      const soldAt = isFinalDistribution ? new Date() : null;

      let distributedNetCents = 0;
      let distributedGrossCents = 0;
      for (let i = 0; i < investment.holdings.length; i++) {
        const holding = investment.holdings[i];
        const isLast = i === investment.holdings.length - 1;
        // Give any rounding remainder to the last holder
        const holderNetCents = isLast
          ? netCents - distributedNetCents
          : Math.round((netCents * holding.unitsPurchased) / totalHeldUnits);
        const holderGrossCents = isLast
          ? grossCents - distributedGrossCents
          : Math.round((grossCents * holding.unitsPurchased) / totalHeldUnits);
        const holderFeeCents = holderGrossCents - holderNetCents;

        distributedNetCents += holderNetCents;
        distributedGrossCents += holderGrossCents;

        // DISTRIBUTION transaction shows the gross amount received
        await tx.transaction.create({
          data: {
            userId: holding.userId,
            investmentId,
            type: 'DISTRIBUTION',
            amount: holderGrossCents / 100,
            status: 'COMPLETED',
          },
        });

        // FEE transaction records the profit share deducted from this investor's share
        if (holderFeeCents > 0) {
          await tx.transaction.create({
            data: {
              userId: holding.userId,
              investmentId,
              type: 'FEE',
              amount: holderFeeCents / 100,
              status: 'COMPLETED',
            },
          });
        }

        // Credit the investor's wallet the net amount (gross − profit share)
        await tx.wallet.upsert({
          where: { userId: holding.userId },
          update: { balance: { increment: holderNetCents / 100 } },
          create: { userId: holding.userId, balance: holderNetCents / 100 },
        });

        // Mark holding as sold so it drops off the portfolio and stops accruing fees
        if (soldAt) {
          await tx.holding.update({
            where: { id: holding.id },
            data: { soldAt },
          });
        }
      }

      // Transition investment to EXITED once all holdings are marked sold
      if (isFinalDistribution) {
        await tx.investment.update({
          where: { id: investmentId },
          data: { status: 'EXITED' },
        });
      }

      return [distribution];
    });

    await auditLog(session!.user.id, 'CREATE_DISTRIBUTION', investmentId, {
      totalAmount,
      netAmount: fees.netAmount,
      holdersCount: investment.holdings.length,
    });

    // Notify each investor
    const holderUserIds = Array.from(new Set(investment.holdings.map((h) => h.userId)));
    const holderUsers = await prisma.user.findMany({
      where: { id: { in: holderUserIds } },
      select: { id: true, email: true, name: true },
    });
    const perUnitNet = fees.netAmount / (totalHeldUnits || 1);
    for (const user of holderUsers) {
      const userUnits = investment.holdings.filter((h) => h.userId === user.id).reduce((s, h) => s + h.unitsPurchased, 0);
      const userAmount = formatCurrency(perUnitNet * userUnits);
      sendDistributionReceived(user.email, user.name ?? 'there', userAmount, investment.title).catch(() => {});
    }

    return NextResponse.json(
      {
        distribution,
        breakdown: fees,
        holdersCount: investment.holdings.length,
        totalHeldUnits,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/admin/distributions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
