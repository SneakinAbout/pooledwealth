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

    const { searchParams } = new URL(_request.url);
    const take = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const skip = parseInt(searchParams.get('offset') ?? '0');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        kycApproved: true,
        createdAt: true,
        _count: {
          select: { holdings: true, transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
