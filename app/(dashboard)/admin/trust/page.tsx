import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TrustClient from './TrustClient';

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/investments');

  const [
    depositAggregate,
    withdrawalAggregate,
    mgmtFeeAggregate,
    mgmtFeeSweepAggregate,
    feeExtractions,
    distributions,
    disbursements,
    walletAggregate,
  ] = await Promise.all([
    prisma.deposit.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'FEE', status: 'COMPLETED', investmentId: null }, _sum: { amount: true } }),
    prisma.trustFeeExtraction.aggregate({ _sum: { amount: true } }),
    prisma.trustFeeExtraction.findMany({
      include: { recordedBy: { select: { name: true } } },
      orderBy: { extractedAt: 'desc' },
    }),
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
  ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);
  const totalMgmtFeesCharged = Number(mgmtFeeAggregate._sum.amount ?? 0);
  const totalMgmtFeesSwept = Number(mgmtFeeSweepAggregate._sum.amount ?? 0);
  const mgmtFeesAwaitingSweep = Math.max(0, totalMgmtFeesCharged - totalMgmtFeesSwept);

  const totalSaleProceeds = distributions.reduce((sum, d) => sum + Number(d.saleProceeds ?? 0), 0);

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  const totalProfitShareSwept = distributions
    .filter((d) => d.profitShareSweptAt !== null)
    .reduce((sum, d) => sum + Number(d.profitShareDeducted), 0);

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

  return (
    <TrustClient
      summary={{
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
      }}
      feeExtractions={feeExtractions.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        extractedAt: e.extractedAt.toISOString(),
        bankRef: e.bankRef,
        notes: e.notes,
        recordedBy: e.recordedBy?.name ?? null,
        createdAt: e.createdAt.toISOString(),
      }))}
      distributions={distributions.map((d) => ({
        id: d.id,
        investmentId: d.investmentId,
        investmentTitle: d.investment.title,
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
      }))}
      disbursements={disbursements.map((d) => ({
        id: d.id,
        investmentId: d.investmentId,
        investmentTitle: d.investment.title,
        totalRaised: Number(d.totalRaised),
        vendorAmount: d.vendorAmount ? Number(d.vendorAmount) : null,
        disbursedAt: d.disbursedAt?.toISOString() ?? null,
        disbursementRef: d.disbursementRef,
        notes: d.notes,
        recordedBy: d.recordedBy?.name ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }))}
    />
  );
}
