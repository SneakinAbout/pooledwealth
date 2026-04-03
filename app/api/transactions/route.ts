import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      userId: session!.user.id,
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const take = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const skip = parseInt(searchParams.get('offset') ?? '0');

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return NextResponse.json(transactions);
  } catch (err) {
    console.error('[GET /api/transactions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
