import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    const holdings = await prisma.holding.findMany({
      where: { userId: session!.user.id },
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            category: true,
            pricePerUnit: true,
            targetReturn: true,
            status: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    const totalInvested = holdings.reduce(
      (sum, h) => sum + Number(h.purchasePrice),
      0
    );

    const currentValue = holdings.reduce(
      (sum, h) => sum + Number(h.investment.pricePerUnit) * h.unitsPurchased,
      0
    );

    return NextResponse.json({
      holdings,
      summary: {
        totalInvested,
        currentValue,
        holdingsCount: holdings.length,
        totalUnits: holdings.reduce((sum, h) => sum + h.unitsPurchased, 0),
      },
    });
  } catch (err) {
    console.error('[GET /api/portfolio]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
