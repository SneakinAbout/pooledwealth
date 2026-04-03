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
    feeAggregate,
    feeExtractionAggregate,
    feeExtractions,
    disbursements,
    walletAggregate,
  ] = await Promise.all([
    prisma.deposit.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'FEE', status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.trustFeeExtraction.aggregate({ _sum: { amount: true } }),
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
    prisma.wallet.aggregate({ _sum: { balance: true } }),
  ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);
  const totalFeesCharged = Number(feeAggregate._sum.amount ?? 0);
  const totalMgmtFeesSwept = Number(feeExtractionAggregate._sum.amount ?? 0);
  const mgmtFeesAwaitingSweep = totalFeesCharged - totalMgmtFeesSwept;

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  const totalInvestmentFeesExtracted = disbursements
    .filter((d) => d.platformFeeExtractedAt !== null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  const pendingVendorDisbursement = disbursements
    .filter((d) => d.disbursedAt === null)
    .reduce((sum, d) => sum + Number(d.totalRaised), 0);

  const pendingInvestmentFeeExtraction = disbursements
    .filter((d) => d.platformFeeAmount !== null && d.platformFeeExtractedAt === null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  const expectedBalance =
    totalDeposited - totalWithdrawn - totalFeesCharged - totalVendorDisbursed - totalInvestmentFeesExtracted - totalMgmtFeesSwept;

  const actualBalance = Number(walletAggregate._sum.balance ?? 0);
  const discrepancy = actualBalance - expectedBalance;

  return (
    <TrustClient
      summary={{
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
      disbursements={disbursements.map((d) => ({
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
      }))}
    />
  );
}
