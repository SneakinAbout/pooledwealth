import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';
import { sendDepositApproved } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

// List all bank transfer deposits
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
      take: 200,
    });

    return NextResponse.json(deposits);
  } catch (err) {
    console.error('[GET /api/admin/deposits]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Manually create a completed deposit for any investor (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const { userId, amount, note } = body;

    if (!userId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'userId and a positive amount are required' }, { status: 400 });
    }

    const approvedAmount = Number(amount);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deposit = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
      });

      // Create a completed deposit record
      const dep = await tx.deposit.create({
        data: {
          walletId: wallet.id,
          amount: approvedAmount,
          status: 'COMPLETED',
          type: 'BANK_TRANSFER',
          // Store admin note in stripePaymentIntentId field (repurposed for reference)
          stripePaymentIntentId: note || null,
        },
      });

      // Credit wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: approvedAmount } },
      });

      // Transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: approvedAmount,
          status: 'COMPLETED',
        },
      });

      return dep;
    });

    await auditLog(session!.user.id, 'MANUAL_DEPOSIT', deposit.id, {
      userId,
      amount: approvedAmount,
      note: note || null,
    });

    // Notify investor
    sendDepositApproved(user.email, user.name ?? 'there', formatCurrency(approvedAmount)).catch(() => {});

    return NextResponse.json({ ok: true, depositId: deposit.id });
  } catch (err) {
    console.error('[POST /api/admin/deposits]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
