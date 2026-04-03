import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/trust/reconciliation
 *
 * Computes the full trust account reconciliation:
 *
 * Trust IN:
 *   + All COMPLETED deposits (bank transfers + Stripe)
 *
 * Trust OUT:
 *   - All COMPLETED withdrawals (paid back to investors)
 *   - Management fees charged from investor wallets (FEE transactions)
 *   - Unit purchases by investors (PURCHASE transactions — funds committed to deals)
 *   - Vendor disbursements recorded (trust → asset vendor, manual record)
 *   - Platform fee extractions recorded (trust → general account, manual record)
 *
 * Expected trust balance = IN - OUT
 * Actual recorded balance = sum of all wallet balances
 * Discrepancy = Actual - Expected (should be $0)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const permError = requireAdmin(session);
  if (permError) return permError;

  const [
    depositAggregate,
    withdrawalAggregate,
    feeAggregate,
    disbursements,
    walletAggregate,
    pendingDisbursements,
  ] = await Promise.all([
    // Total funds ever deposited into trust (COMPLETED only)
    prisma.deposit.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),

    // Total funds paid out to investors (COMPLETED withdrawals)
    prisma.withdrawal.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),

    // Total management fees charged from investor wallets
    prisma.transaction.aggregate({
      where: { type: 'FEE', status: 'COMPLETED' },
      _sum: { amount: true },
    }),

    // All trust disbursement records (vendor + fee extractions)
    prisma.trustDisbursement.findMany({
      include: {
        investment: { select: { id: true, title: true, status: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Current sum of all wallet balances (actual trust balance)
    prisma.wallet.aggregate({
      _sum: { balance: true },
    }),

    // CLOSED investments with no disbursement yet (shouldn't happen after schema change, but defensive)
    prisma.investment.findMany({
      where: {
        status: 'CLOSED',
        trustDisbursement: null,
      },
      select: { id: true, title: true },
    }),
  ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);
  const totalFeesCharged = Number(feeAggregate._sum.amount ?? 0);

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  const totalFeesExtracted = disbursements
    .filter((d) => d.platformFeeExtractedAt !== null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  // Fees charged reduce wallet balances (actual), so must be included in expected OUT
  const expectedBalance =
    totalDeposited - totalWithdrawn - totalFeesCharged - totalVendorDisbursed - totalFeesExtracted;

  const actualBalance = Number(walletAggregate._sum.balance ?? 0);
  const discrepancy = actualBalance - expectedBalance;

  // Capital committed to investments but not yet disbursed to vendors
  const pendingVendorDisbursement = disbursements
    .filter((d) => d.disbursedAt === null)
    .reduce((sum, d) => sum + Number(d.totalRaised), 0);

  // Platform fees accrued but not yet extracted
  const pendingFeeExtraction = disbursements
    .filter((d) => d.platformFeeAmount !== null && d.platformFeeExtractedAt === null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  return NextResponse.json({
    summary: {
      totalDeposited,
      totalWithdrawn,
      totalFeesCharged,
      totalVendorDisbursed,
      totalFeesExtracted,
      expectedBalance,
      actualBalance,
      discrepancy,
      pendingVendorDisbursement,
      pendingFeeExtraction,
    },
    disbursements: disbursements.map((d) => ({
      id: d.id,
      investmentId: d.investmentId,
      investmentTitle: d.investment.title,
      investmentStatus: d.investment.status,
      totalRaised: Number(d.totalRaised),
      vendorAmount: d.vendorAmount ? Number(d.vendorAmount) : null,
      disbursedAt: d.disbursedAt?.toISOString() ?? null,
      disbursementRef: d.disbursementRef,
      platformFeeAmount: d.platformFeeAmount ? Number(d.platformFeeAmount) : null,
      platformFeeExtractedAt: d.platformFeeExtractedAt?.toISOString() ?? null,
      feeRef: d.feeRef,
      notes: d.notes,
      recordedBy: d.recordedBy?.name ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    pendingSetup: pendingDisbursements,
  });
}
