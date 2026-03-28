import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const WithdrawalSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

// POST /api/investor/withdrawals — request a withdrawal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = WithdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount } = parsed.data;

  // Fetch user with wallet and bank details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { wallet: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!user.bankAccountName || !user.bankBsb || !user.bankAccountNumber) {
    return NextResponse.json({ error: 'Please save your bank account details before requesting a withdrawal' }, { status: 400 });
  }

  // Atomic: balance check + deduction inside transaction to prevent race condition
  try {
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Atomic balance check — updateMany with WHERE balance >= amount
      const updated = await tx.wallet.updateMany({
        where: { userId: user.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });

      if (updated.count === 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const wd = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          bankAccountName: user.bankAccountName!,
          bankBsb: user.bankBsb!,
          bankAccountNumber: user.bankAccountNumber!,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
        },
      });

      return wd;
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }
    throw err;
  }
}

// GET /api/investor/withdrawals — list own withdrawals
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(withdrawals.map((w) => ({
    ...w,
    amount: Number(w.amount),
  })));
}
