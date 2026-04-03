import { prisma } from '@/lib/prisma';

interface ChargeResult {
  charged: number;
  skipped: number;
  totalCollected: number;
}

function calcEffectiveFee(totalInvested: number, annualPct: number, discountPct: number) {
  const gross = Math.round((totalInvested * (annualPct / 100) / 12) * 100) / 100;
  const effective = Math.round(gross * (1 - discountPct / 100) * 100) / 100;
  return { gross, effective };
}

/**
 * Charges monthly management fees for all users with holdings.
 * Uses an atomic wallet.updateMany (balance >= fee) to avoid stale-read races.
 * Returns counts of charged and skipped users plus total collected.
 */
export async function chargeManagementFees(): Promise<ChargeResult> {
  const [settings, users] = await Promise.all([
    prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.user.findMany({
      where: { holdings: { some: { soldAt: null, investment: { status: 'CLOSED' } } } },
      include: {
        holdings: {
          where: { soldAt: null, investment: { status: 'CLOSED' } },
          select: { purchasePrice: true },
        },
      },
    }),
  ]);

  const annualPct = Number(settings?.managementFeePercent ?? 2);
  let charged = 0, skipped = 0, totalCollected = 0;

  for (const user of users) {
    // purchasePrice on a Holding is the cumulative cost basis for that holding
    // (incremented on each subsequent purchase). Summing gives total invested capital.
    const totalInvested = user.holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
    if (totalInvested === 0) continue;

    const discountPct = Number(user.feeDiscountPercent) || 0;
    const { effective } = calcEffectiveFee(totalInvested, annualPct, discountPct);
    if (effective === 0) { charged++; continue; } // 100% discount

    // Atomically deduct fee only if wallet has sufficient balance.
    // updateMany with balance >= effective is a single SQL UPDATE — no stale-read race.
    const wasCharged = await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.updateMany({
        where: { userId: user.id, balance: { gte: effective } },
        data: { balance: { decrement: effective } },
      });
      if (updated.count === 0) return false;
      await tx.transaction.create({
        data: { userId: user.id, type: 'FEE', amount: effective, status: 'COMPLETED' },
      });
      return true;
    });

    if (wasCharged) {
      charged++;
      totalCollected += effective;
    } else {
      skipped++;
    }
  }

  return { charged, skipped, totalCollected };
}
