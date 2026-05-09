import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/investments/[id]/snapshots — valuation history for charts
// Accessible to admin, manager, or any investor who holds units in this investment
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isStaff = ['ADMIN', 'MANAGER'].includes(session.user.role);

  if (!isStaff) {
    const holding = await prisma.holding.findUnique({
      where: { userId_investmentId: { userId: session.user.id, investmentId: params.id } },
      select: { id: true },
    });
    if (!holding) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snapshots = await prisma.valuationSnapshot.findMany({
    where: { investmentId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { value: true, confidence: true, compCount: true, source: true, createdAt: true },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      value: Number(s.value),
      confidence: s.confidence,
      compCount: s.compCount,
      source: s.source,
      createdAt: s.createdAt.toISOString(),
    })),
  );
}
