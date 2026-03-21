import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import InvestmentDetailClient from './InvestmentDetailClient';

export default async function InvestmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';
  const isManager = session?.user?.role === 'MANAGER';

  const [investment, settings] = await Promise.all([
    prisma.investment.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { holdings: true } },
      },
    }),
    prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
  ]);

  if (!investment) notFound();

  const subscriptionEnded = new Date() > investment.endDate;
  const isActive = investment.status === 'ACTIVE';
  // Investors can only buy if active AND subscription period hasn't ended
  const canInvest = !!session && isActive && !subscriptionEnded;

  const feeSettings = settings
    ? {
        managementFeePercent: Number(settings.managementFeePercent),
        profitSharePercent: Number(settings.profitSharePercent),
      }
    : { managementFeePercent: 5, profitSharePercent: 30 };

  // Check if current user holds units (needed for proposal eligibility)
  const isOwner = session?.user
    ? !!(await prisma.holding.findFirst({
        where: { investmentId: params.id, userId: session.user.id },
      }))
    : false;

  let adminData = null;
  if (isAdmin) {
    const [holdings, previousDistributions] = await Promise.all([
      prisma.holding.findMany({
        where: { investmentId: params.id },
        select: { purchasePrice: true },
      }),
      prisma.distribution.findMany({
        where: { investmentId: params.id },
        orderBy: { distributedAt: 'desc' },
      }),
    ]);

    const totalCostBasis = holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
    const previouslyDistributedGross = previousDistributions.reduce(
      (sum, d) => sum + Number(d.totalAmount),
      0
    );
    const remainingCostBasis = Math.max(0, totalCostBasis - previouslyDistributedGross);

    adminData = {
      totalCostBasis,
      remainingCostBasis,
      previouslyDistributedGross,
      previousDistributions: previousDistributions.map((d) => ({
        id: d.id,
        totalAmount: Number(d.totalAmount),
        profitShareDeducted: Number(d.profitShareDeducted),
        netAmount: Number(d.netAmount),
        distributedAt: d.distributedAt.toISOString(),
        notes: d.notes,
      })),
    };
  }

  return (
    <InvestmentDetailClient
      investment={{
        ...investment,
        pricePerUnit: Number(investment.pricePerUnit),
        targetReturn: Number(investment.targetReturn),
        currentValue: investment.currentValue ? Number(investment.currentValue) : null,
        endDate: investment.endDate.toISOString(),
        startDate: investment.startDate.toISOString(),
      }}
      settings={feeSettings}
      canInvest={canInvest}
      subscriptionEnded={subscriptionEnded}
      adminData={adminData}
      isAdmin={isAdmin}
      isManager={isManager}
      isOwner={isOwner}
    />
  );
}

