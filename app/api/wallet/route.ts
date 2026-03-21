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

    const wallet = await prisma.wallet.upsert({
      where: { userId: session!.user.id },
      update: {},
      create: { userId: session!.user.id, balance: 0 },
    });

    return NextResponse.json({ balance: Number(wallet.balance) });
  } catch (err) {
    console.error('[GET /api/wallet]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
