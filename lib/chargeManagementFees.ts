import { prisma } from '@/lib/prisma';
import { sendFeeOutstanding } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';

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
 * - If the wallet has sufficient balance: deducts immediately.
 * - If not: records the debt on wallet.outstandingFees and emails the investor.
 * Returns counts of charged / skipped users plus total collected.
 */
export async function chargeManagementFees(): Promise<ChargeResult> {
  const [settings, users] = await Promise.all([
    prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.user.findMany({
      where: { holdings: { some: { soldAt: null, investment: { status: { in: ['CLOSED'] } } } } },
      include: {
        holdings: {
          where: { soldAt: null, investment: { status: { in: ['CLOSED'] } } },
          select: { purchasePrice: true },
        },
        wallet: { select: { id: true } },
      },
    }),
  ]);

  const annualPct = Number(settings?.managementFeePercent ?? 2);
  let charged = 0, skipped = 0, totalCollected = 0;

  for (const user of users) {
    const totalInvested = user.holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
    if (totalInvested === 0) continue;

    const discountPct = Number(user.feeDiscountPercent) || 0;
    const { effective } = calcEffectiveFee(totalInvested, annualPct, discountPct);
    if (effective === 0) { charged++; continue; } // 100% discount

    // Atomically deduct fee only if wallet has sufficient balance.
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

      // Record the debt so it is collected on the investor's next deposit
      if (user.wallet) {
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { outstandingFees: { increment: effective } },
        });
      }

      // Notify the investor — fire-and-forget, don't fail the cron if email errors
      sendFeeOutstanding(user.email, user.name ?? 'there', formatCurrency(effective)).catch((err) => {
        console.error(`[chargeManagementFees] Email failed for ${user.email}:`, err);
      });
    }
  }

  return { charged, skipped, totalCollected };
}
