import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWithdrawalApproved, sendWithdrawalRejected } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

// PATCH /api/admin/withdrawals/[id] — approve or reject
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action } = await req.json();
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } });
  if (!withdrawal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (withdrawal.status !== 'PENDING') {
    return NextResponse.json({ error: 'Withdrawal is not pending' }, { status: 409 });
  }

  const user = await prisma.user.findUnique({ where: { id: withdrawal.userId }, select: { email: true, name: true } });
  const amountStr = formatCurrency(Number(withdrawal.amount));

  if (action === 'approve') {
    const [updated] = await prisma.$transaction([
      prisma.withdrawal.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', processedAt: new Date() },
      }),
      prisma.transaction.updateMany({
        where: { userId: withdrawal.userId, type: 'WITHDRAWAL', status: 'PENDING' },
        data: { status: 'COMPLETED' },
      }),
    ]);
    if (user) sendWithdrawalApproved(user.email, user.name ?? 'there', amountStr).catch(() => {});
    return NextResponse.json({ ...updated, amount: Number(updated.amount) });
  }

  // reject — refund wallet
  const [updated] = await prisma.$transaction([
    prisma.withdrawal.update({
      where: { id: params.id },
      data: { status: 'FAILED', processedAt: new Date() },
    }),
    prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: { balance: { increment: Number(withdrawal.amount) } },
    }),
    prisma.transaction.updateMany({
      where: { userId: withdrawal.userId, type: 'WITHDRAWAL', status: 'PENDING' },
      data: { status: 'FAILED' },
    }),
  ]);
  if (user) sendWithdrawalRejected(user.email, user.name ?? 'there', amountStr).catch(() => {});
  return NextResponse.json({ ...updated, amount: Number(updated.amount) });
}
