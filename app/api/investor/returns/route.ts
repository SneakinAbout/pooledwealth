import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';

/**
 * GET /api/investor/returns?from=2024-07-01&to=2025-06-30
 * Returns a breakdown of distributions, fees, and purchases within a date range.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to date params required' }, { status: 400 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    // Include the full end day
    toDate.setHours(23, 59, 59, 999);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const userId = session!.user.id;

    // Fetch all relevant transactions in the date range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: { gte: fromDate, lte: toDate },
        type: { in: ['DISTRIBUTION', 'FEE', 'PURCHASE', 'REDEMPTION'] },
      },
      include: {
        investment: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by investment
    const byInvestment: Record<string, {
      investmentId: string;
      title: string;
      category: string;
      distributions: number;
      fees: number;
      purchases: number;
      redemptions: number;
    }> = {};

    let totalDistributions = 0;
    let totalFees = 0;
    let totalPurchases = 0;
    let totalRedemptions = 0;

    for (const tx of transactions) {
      const key = tx.investmentId ?? '__wallet__';
      const title = tx.investment?.title ?? 'Wallet';
      const category = tx.investment?.category ?? 'Wallet';
      const amount = Number(tx.amount);

      if (!byInvestment[key]) {
        byInvestment[key] = {
          investmentId: key,
          title,
          category,
          distributions: 0,
          fees: 0,
          purchases: 0,
          redemptions: 0,
        };
      }

      if (tx.type === 'DISTRIBUTION') {
        byInvestment[key].distributions += amount;
        totalDistributions += amount;
      } else if (tx.type === 'FEE') {
        byInvestment[key].fees += amount;
        totalFees += amount;
      } else if (tx.type === 'PURCHASE') {
        byInvestment[key].purchases += amount;
        totalPurchases += amount;
      } else if (tx.type === 'REDEMPTION') {
        byInvestment[key].redemptions += amount;
        totalRedemptions += amount;
      }
    }

    const breakdown = Object.values(byInvestment)
      .filter((inv) => inv.investmentId !== '__wallet__')
      .map((inv) => ({
        ...inv,
        netReturn: inv.distributions + inv.redemptions - inv.purchases - inv.fees,
      }))
      .sort((a, b) => b.distributions - a.distributions);

    const netReturn = totalDistributions + totalRedemptions - totalPurchases - totalFees;

    return NextResponse.json({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      summary: {
        totalDistributions,
        totalFees,
        totalPurchases,
        totalRedemptions,
        netReturn,
      },
      breakdown,
    });
  } catch (err) {
    console.error('[GET /api/investor/returns]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
