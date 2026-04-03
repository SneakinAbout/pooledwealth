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
    feeExtractionAggregate,
    feeExtractions,
    disbursements,
    walletAggregate,
    pendingDisbursements,
  ] = await Promise.all([
    prisma.deposit.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'FEE', status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Total management fees already swept to general account
    prisma.trustFeeExtraction.aggregate({
      _sum: { amount: true },
    }),
    // All fee extraction records for action list
    prisma.trustFeeExtraction.findMany({
      include: { recordedBy: { select: { name: true } } },
      orderBy: { extractedAt: 'desc' },
    }),
    prisma.trustDisbursement.findMany({
      include: {
        investment: { select: { id: true, title: true, status: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.aggregate({
      _sum: { balance: true },
    }),
    prisma.investment.findMany({
      where: { status: 'CLOSED', trustDisbursement: null },
      select: { id: true, title: true },
    }),
  ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);
  const totalFeesCharged = Number(feeAggregate._sum.amount ?? 0);
  const totalMgmtFeesSwept = Number(feeExtractionAggregate._sum.amount ?? 0);

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  const totalInvestmentFeesExtracted = disbursements
    .filter((d) => d.platformFeeExtractedAt !== null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  // Management fees sitting in trust but not yet swept to general account
  const mgmtFeesAwaitingSweep = totalFeesCharged - totalMgmtFeesSwept;

  const expectedBalance =
    totalDeposited - totalWithdrawn - totalFeesCharged - totalVendorDisbursed - totalInvestmentFeesExtracted - totalMgmtFeesSwept;

  const actualBalance = Number(walletAggregate._sum.balance ?? 0);
  const discrepancy = actualBalance - expectedBalance;

  const pendingVendorDisbursement = disbursements
    .filter((d) => d.disbursedAt === null)
    .reduce((sum, d) => sum + Number(d.totalRaised), 0);

  const pendingInvestmentFeeExtraction = disbursements
    .filter((d) => d.platformFeeAmount !== null && d.platformFeeExtractedAt === null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  return NextResponse.json({
    summary: {
      totalDeposited,
      totalWithdrawn,
      totalFeesCharged,
      totalMgmtFeesSwept,
      mgmtFeesAwaitingSweep,
      totalVendorDisbursed,
      totalInvestmentFeesExtracted,
      expectedBalance,
      actualBalance,
      discrepancy,
      pendingVendorDisbursement,
      pendingInvestmentFeeExtraction,
    },
    feeExtractions: feeExtractions.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      extractedAt: e.extractedAt.toISOString(),
      bankRef: e.bankRef,
      notes: e.notes,
      recordedBy: e.recordedBy?.name ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
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
