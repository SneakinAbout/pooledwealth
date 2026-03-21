import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const [
      totalUsers,
      totalInvestors,
      totalInvestments,
      activeInvestments,
      totalTransactionValue,
      recentTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'INVESTOR' } }),
      prisma.investment.count(),
      prisma.investment.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: 'PURCHASE' },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          investment: { select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalInvestors,
      totalInvestments,
      activeInvestments,
      totalTransactionValue: Number(totalTransactionValue._sum.amount ?? 0),
      recentTransactions,
    });
  } catch (err) {
    console.error('[GET /api/admin/analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
