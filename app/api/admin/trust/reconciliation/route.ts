import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/trust/reconciliation
 *
 * Trust IN:
 *   + Investor deposits (bank transfers + Stripe)
 *   + Asset sale proceeds recorded per distribution
 *
 * Trust OUT:
 *   - Investor withdrawals
 *   - Management fees charged from investor wallets
 *   - Vendor payments (trust → asset vendor on investment close)
 *   - Management fee sweeps (trust → general account, manual)
 *   - Distribution profit share sweeps (trust → general account, per distribution)
 *
 * Expected balance = IN - OUT
 * Actual balance   = sum of all investor wallet balances
 * Discrepancy      = Actual - Expected (should be $0)
 */
export async function GET() {
  try {
  const session = await getServerSession(authOptions);
  const permError = requireAdmin(session);
  if (permError) return permError;

  const [
    depositAggregate,
    withdrawalAggregate,
    mgmtFeeAggregate,
    mgmtFeeSweepAggregate,
    feeExtractions,
    distributions,
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
    // Monthly management fees deducted from investor wallets
    prisma.transaction.aggregate({
      where: { type: 'FEE', status: 'COMPLETED', investmentId: null },
      _sum: { amount: true },
    }),
    // Total management fee sweeps already transferred to general account
    prisma.trustFeeExtraction.aggregate({ _sum: { amount: true } }),
    // All fee sweep records for history
    prisma.trustFeeExtraction.findMany({
      include: { recordedBy: { select: { name: true } } },
      orderBy: { extractedAt: 'desc' },
    }),
    // All distributions with sale proceeds and profit share sweep status
    prisma.distribution.findMany({
      include: {
        investment: { select: { id: true, title: true, status: true } },
        profitShareSweptBy: { select: { name: true } },
      },
      orderBy: { distributedAt: 'desc' },
    }),
    prisma.trustDisbursement.findMany({
      include: {
        investment: { select: { id: true, title: true, status: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.investment.findMany({
      where: { status: 'CLOSED', trustDisbursement: null },
      select: { id: true, title: true },
    }),
  ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);
  const totalMgmtFeesCharged = Number(mgmtFeeAggregate._sum.amount ?? 0);
  const totalMgmtFeesSwept = Number(mgmtFeeSweepAggregate._sum.amount ?? 0);

  // Fees awaiting sweep = fees charged since the last sweep date (each cycle independent)
  const lastSweepDate = feeExtractions.length > 0 ? new Date(feeExtractions[0].extractedAt) : null;
  const feesChargedSinceLastSweep = lastSweepDate
    ? await prisma.transaction.aggregate({
        where: { type: 'FEE', status: 'COMPLETED', investmentId: null, createdAt: { gt: lastSweepDate } },
        _sum: { amount: true },
      }).then((r) => Number(r._sum.amount ?? 0))
    : totalMgmtFeesCharged;
  const mgmtFeesAwaitingSweep = feesChargedSinceLastSweep;

  // Asset sale proceeds: recorded against each distribution
  const totalSaleProceeds = distributions.reduce(
    (sum, d) => sum + Number(d.saleProceeds ?? 0),
    0
  );

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  // Profit share swept from distributions to general account
  const totalProfitShareSwept = distributions
    .filter((d) => d.profitShareSweptAt !== null)
    .reduce((sum, d) => sum + Number(d.profitShareDeducted), 0);

  // Profit share sitting in trust (distribution processed but not yet swept)
  const profitShareAwaitingSweep = distributions
    .filter((d) => d.profitShareSweptAt === null && Number(d.profitShareDeducted) > 0)
    .reduce((sum, d) => sum + Number(d.profitShareDeducted), 0);

  const pendingVendorDisbursement = disbursements
    .filter((d) => d.disbursedAt === null)
    .reduce((sum, d) => sum + Number(d.totalRaised), 0);

  const expectedBalance =
    totalDeposited +
    totalSaleProceeds -
    totalWithdrawn -
    totalMgmtFeesCharged -
    totalVendorDisbursed -
    totalMgmtFeesSwept -
    totalProfitShareSwept;

  const actualBalance = Number(walletAggregate._sum.balance ?? 0);
  const discrepancy = actualBalance - expectedBalance;

  return NextResponse.json({
    summary: {
      totalDeposited,
      totalSaleProceeds,
      totalWithdrawn,
      totalMgmtFeesCharged,
      totalMgmtFeesSwept,
      mgmtFeesAwaitingSweep,
      totalVendorDisbursed,
      totalProfitShareSwept,
      profitShareAwaitingSweep,
      expectedBalance,
      actualBalance,
      discrepancy,
      pendingVendorDisbursement,
    },
    distributions: distributions.map((d) => ({
      id: d.id,
      investmentId: d.investmentId,
      investmentTitle: d.investment.title,
      investmentStatus: d.investment.status,
      totalAmount: Number(d.totalAmount),
      profitShareDeducted: Number(d.profitShareDeducted),
      netAmount: Number(d.netAmount),
      distributedAt: d.distributedAt.toISOString(),
      notes: d.notes,
      saleProceeds: d.saleProceeds ? Number(d.saleProceeds) : null,
      saleProceedsRef: d.saleProceedsRef,
      profitShareSweptAt: d.profitShareSweptAt?.toISOString() ?? null,
      profitShareSweptRef: d.profitShareSweptRef,
      profitShareSweptBy: d.profitShareSweptBy?.name ?? null,
    })),
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
      notes: d.notes,
      recordedBy: d.recordedBy?.name ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    pendingSetup: pendingDisbursements,
  });
  } catch (err) {
    console.error('[GET /api/admin/trust/reconciliation]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
