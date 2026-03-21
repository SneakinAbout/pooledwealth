import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireManagerOrAbove } from '@/lib/permissions';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireManagerOrAbove(session);
    if (permError) return permError;

    const holdings = await prisma.holding.findMany({
      where: { investmentId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            kycApproved: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return NextResponse.json(holdings);
  } catch (err) {
    console.error('[GET /api/investments/[id]/investors]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
