import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/pending-valuations — list all PENDING valuations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pending = await prisma.pendingValuation.findMany({
    where: { status: 'PENDING' },
    include: {
      investment: { select: { id: true, title: true, category: true, currentValue: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    pending.map((p) => ({
      id: p.id,
      investmentId: p.investmentId,
      investmentTitle: p.investment.title,
      investmentCategory: p.investment.category,
      currentValue: p.investment.currentValue ? Number(p.investment.currentValue) : null,
      marketValue: Number(p.marketValue),
      confidence: p.confidence,
      compCount: p.compCount,
      searchQuery: p.searchQuery,
      flagReason: p.flagReason,
      createdAt: p.createdAt.toISOString(),
    })),
  );
}
