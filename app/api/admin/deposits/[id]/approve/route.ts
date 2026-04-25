import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';
import { sendDepositApproved } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

// Approve a pending bank transfer deposit: mark COMPLETED and credit the wallet.
// Accepts optional body { amount } to override the deposit amount (e.g. partial receipts).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    // Parse optional amount override from body
    const body = await request.json().catch(() => ({}));
    const amountOverride = body.amount ? Number(body.amount) : null;

    if (amountOverride !== null && (isNaN(amountOverride) || amountOverride <= 0)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Fetch deposit for walletId/amount (read-only context)
    const deposit = await prisma.deposit.findUnique({
      where: { id: params.id },
      include: { wallet: true },
    });

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }
    if (deposit.type !== 'BANK_TRANSFER') {
      return NextResponse.json({ error: 'Only bank transfer deposits can be approved here' }, { status: 400 });
    }
    if (deposit.status !== 'PENDING') {
      return NextResponse.json({ error: `Deposit is already ${deposit.status.toLowerCase()}` }, { status: 409 });
    }

    const originalAmount = Number(deposit.amount);
    const approvedAmount = amountOverride ?? originalAmount;

    // Atomic: use updateMany with WHERE status='PENDING' to prevent double-approve race
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.deposit.updateMany({
        where: { id: deposit.id, status: 'PENDING' },
        data: { status: 'COMPLETED', amount: approvedAmount },
      });

      if (updated.count === 0) {
        // Another admin already approved/rejected this deposit
        return null;
      }

      await tx.wallet.update({
        where: { id: deposit.walletId },
        data: { balance: { increment: approvedAmount } },
      });

      await tx.transaction.create({
        data: {
          userId: deposit.wallet.userId,
          type: 'DEPOSIT',
          amount: approvedAmount,
          status: 'COMPLETED',
        },
      });

      return true;
    });

    if (result === null) {
      return NextResponse.json({ error: 'Deposit has already been processed' }, { status: 409 });
    }

    await auditLog(session!.user.id, 'APPROVE_BANK_DEPOSIT', deposit.id, {
      originalAmount,
      approvedAmount,
      adjusted: approvedAmount !== originalAmount,
      reference: deposit.stripePaymentIntentId,
    });

    // Notify user
    const user = await prisma.user.findUnique({ where: { id: deposit.wallet.userId }, select: { email: true, name: true } });
    if (user) {
      sendDepositApproved(user.email, user.name ?? 'there', formatCurrency(approvedAmount)).catch(() => {});
    }

    return NextResponse.json({ ok: true, approvedAmount });
  } catch (err) {
    console.error('[POST /api/admin/deposits/[id]/approve]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
