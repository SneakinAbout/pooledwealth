import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TrustClient from './TrustClient';

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/investments');

  const [depositAggregate, withdrawalAggregate, disbursements, walletAggregate] =
    await Promise.all([
      prisma.deposit.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
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
    ]);

  const totalDeposited = Number(depositAggregate._sum.amount ?? 0);
  const totalWithdrawn = Number(withdrawalAggregate._sum.amount ?? 0);

  const totalVendorDisbursed = disbursements
    .filter((d) => d.disbursedAt !== null)
    .reduce((sum, d) => sum + Number(d.vendorAmount ?? 0), 0);

  const totalFeesExtracted = disbursements
    .filter((d) => d.platformFeeExtractedAt !== null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  const expectedBalance =
    totalDeposited - totalWithdrawn - totalVendorDisbursed - totalFeesExtracted;

  const actualBalance = Number(walletAggregate._sum.balance ?? 0);
  const discrepancy = actualBalance - expectedBalance;

  const pendingVendorDisbursement = disbursements
    .filter((d) => d.disbursedAt === null)
    .reduce((sum, d) => sum + Number(d.totalRaised), 0);

  const pendingFeeExtraction = disbursements
    .filter((d) => d.platformFeeAmount !== null && d.platformFeeExtractedAt === null)
    .reduce((sum, d) => sum + Number(d.platformFeeAmount ?? 0), 0);

  return (
    <TrustClient
      summary={{
        totalDeposited,
        totalWithdrawn,
        totalVendorDisbursed,
        totalFeesExtracted,
        expectedBalance,
        actualBalance,
        discrepancy,
        pendingVendorDisbursement,
        pendingFeeExtraction,
      }}
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
