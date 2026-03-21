import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// List all pending bank transfer deposits
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const deposits = await prisma.deposit.findMany({
      where: { type: 'BANK_TRANSFER' },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deposits);
  } catch (err) {
    console.error('[GET /api/admin/deposits]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
