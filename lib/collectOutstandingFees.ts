import { Prisma } from '@prisma/client';

/**
 * Called inside an existing Prisma transaction after a deposit is credited.
 * Collects as much of the outstanding fee balance as the wallet can afford.
 * Returns the amount actually collected (0 if nothing owed / nothing to collect).
 */
export async function collectOutstandingFees(
  tx: Prisma.TransactionClient,
  userId: string,
  walletId: string,
): Promise<number> {
  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
    select: { balance: true, outstandingFees: true },
  });

  if (!wallet) return 0;

  const owed = Number(wallet.outstandingFees);
  if (owed <= 0) return 0;

  const balance = Number(wallet.balance);
  const collect = Math.min(owed, balance);
  if (collect <= 0) return 0;

  // Round to 2 dp to avoid floating-point drift
  const toCollect = Math.round(collect * 100) / 100;

  await tx.wallet.update({
    where: { id: walletId },
    data: {
      balance:         { decrement: toCollect },
      outstandingFees: { decrement: toCollect },
    },
  });

  await tx.transaction.create({
    data: {
      userId,
      type:   'FEE',
      amount: toCollect,
      status: 'COMPLETED',
    },
  });

  return toCollect;
}
