import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/withdrawals — list all withdrawals (pending first)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(withdrawals.map((w) => ({
    ...w,
    amount: Number(w.amount),
  })));
}
