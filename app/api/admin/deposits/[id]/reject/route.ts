import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';
import { sendDepositRejected } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

// Reject a pending bank transfer deposit: mark FAILED
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const deposit = await prisma.deposit.findUnique({
      where: { id: params.id },
    });

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }
    if (deposit.type !== 'BANK_TRANSFER') {
      return NextResponse.json({ error: 'Only bank transfer deposits can be rejected here' }, { status: 400 });
    }
    if (deposit.status !== 'PENDING') {
      return NextResponse.json({ error: `Deposit is already ${deposit.status.toLowerCase()}` }, { status: 409 });
    }

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: 'FAILED' },
    });

    const amount = Number(deposit.amount);

    await auditLog(session!.user.id, 'REJECT_BANK_DEPOSIT', deposit.id, {
      amount,
      reference: deposit.stripePaymentIntentId,
    });

    // Notify user
    const walletRecord = await prisma.wallet.findUnique({ where: { id: deposit.walletId }, select: { userId: true } });
    if (walletRecord) {
      const user = await prisma.user.findUnique({ where: { id: walletRecord.userId }, select: { email: true, name: true } });
      if (user) {
        sendDepositRejected(user.email, user.name ?? 'there', formatCurrency(amount)).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/admin/deposits/[id]/reject]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
