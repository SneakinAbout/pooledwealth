import { prisma } from '@/lib/prisma';

/**
 * Refunds all investors in an investment and resets it to DRAFT for re-listing.
 * - Returns each holder's cost basis to their wallet
 * - Creates a REDEMPTION transaction per investor
 * - Deletes all holdings
 * - Resets availableUnits = totalUnits, status = DRAFT
 */
export async function refundAndRelist(investmentId: string): Promise<{ refunded: number; totalReturned: number }> {
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: { holdings: true },
  });

  if (!investment) throw new Error('Investment not found');

  let totalReturned = 0;

  await prisma.$transaction(async (tx) => {
    for (const holding of investment.holdings) {
      const refundAmount = Number(holding.purchasePrice);
      totalReturned += refundAmount;

      // Credit wallet
      await tx.wallet.upsert({
        where: { userId: holding.userId },
        update: { balance: { increment: refundAmount } },
        create: { userId: holding.userId, balance: refundAmount },
      });

      // Record REDEMPTION transaction
      await tx.transaction.create({
        data: {
          userId: holding.userId,
          investmentId,
          type: 'REDEMPTION',
          amount: refundAmount,
          status: 'COMPLETED',
        },
      });

      // Remove the holding
      await tx.holding.delete({ where: { id: holding.id } });
    }

    // Reset investment
    await tx.investment.update({
      where: { id: investmentId },
      data: {
        status: 'DRAFT',
        availableUnits: investment.totalUnits,
      },
    });
  });

  return { refunded: investment.holdings.length, totalReturned };
}

/**
 * Auto-allocates remaining unallocated units to the platform (admin user as investor).
 * The platform takes the units at face value (pricePerUnit × remainingUnits) so that
 * the total cost basis is preserved and profit share calculations are not skewed.
 * No wallet deduction occurs — this is a notional cost basis only.
 * Sets availableUnits to 0.
 */
export async function autoAllocateToPlatform(investmentId: string): Promise<{ unitsAllocated: number; notionalCostBasis: number }> {
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
  });

  if (!investment) throw new Error('Investment not found');
  if (investment.availableUnits === 0) throw new Error('No unallocated units remaining');

  const platformUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!platformUser) throw new Error('No platform admin user found');

  const units = investment.availableUnits;
  const notionalCostBasis = Number(investment.pricePerUnit) * units;

  await prisma.$transaction(async (tx) => {
    const existingHolding = await tx.holding.findFirst({
      where: { userId: platformUser.id, investmentId },
    });

    if (existingHolding) {
      await tx.holding.update({
        where: { id: existingHolding.id },
        data: {
          unitsPurchased: { increment: units },
          purchasePrice: { increment: notionalCostBasis },
        },
      });
    } else {
      await tx.holding.create({
        data: {
          userId: platformUser.id,
          investmentId,
          unitsPurchased: units,
          purchasePrice: notionalCostBasis,
        },
      });
    }

    await tx.investment.update({
      where: { id: investmentId },
      data: { availableUnits: 0 },
    });
  });

  return { unitsAllocated: units, notionalCostBasis };
}

/**
 * Checks all ACTIVE investments whose endDate has passed and processes them:
 * - If minimumRaise > 0 and units sold < minimumRaise: refund all + re-list
 * - If minimumRaise met (or 0): close the investment (ACTIVE → CLOSED)
 */
export async function processExpiredInvestments(): Promise<{
  closed: number;
  refundedAndRelisted: number;
}> {
  const expired = await prisma.investment.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() },
    },
  });

  let closed = 0;
  let refundedAndRelisted = 0;

  for (const inv of expired) {
    const unitsSold = inv.totalUnits - inv.availableUnits;
    const minimumMet = inv.minimumRaise === 0 || unitsSold >= inv.minimumRaise;

    if (minimumMet) {
      await prisma.investment.update({
        where: { id: inv.id },
        data: { status: 'CLOSED' },
      });
      closed++;
    } else {
      await refundAndRelist(inv.id);
      refundedAndRelisted++;
    }
  }

  return { closed, refundedAndRelisted };
}
