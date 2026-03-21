import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import HoldingsTable from '@/components/portfolio/HoldingsTable';
import WalletCard from '@/components/wallet/WalletCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate, getTransactionTypeColor } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import CsvExportButton from '@/components/portfolio/CsvExportButton';

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const [holdings, transactions, wallet] = await Promise.all([
    prisma.holding.findMany({
      where: { userId: session.user.id },
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            category: true,
            pricePerUnit: true,
            targetReturn: true,
            status: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        investment: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, balance: 0 },
    }),
  ]);

  // Active holdings = investment still open or closed (not yet distributed/exited)
  // Archived = investment completed, distributions done — exclude from live totals
  const activeHoldings = holdings.filter((h) => h.investment.status !== 'ARCHIVED');
  const completedHoldings = holdings.filter((h) => h.investment.status === 'ARCHIVED');

  const totalInvested = activeHoldings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
  const currentValue = activeHoldings.reduce(
    (sum, h) => sum + Number(h.investment.pricePerUnit) * h.unitsPurchased,
    0
  );

  // For completed holdings, calculate actual return from distribution transactions
  const completedInvestmentIds = completedHoldings.map((h) => h.investmentId);
  const distributionTxs = completedInvestmentIds.length > 0
    ? await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          investmentId: { in: completedInvestmentIds },
          type: 'DISTRIBUTION',
          status: 'COMPLETED',
        },
        select: { investmentId: true, amount: true },
      })
    : [];

  // Sum distributions per investment
  const distByInvestment = distributionTxs.reduce<Record<string, number>>((acc, tx) => {
    if (!tx.investmentId) return acc;
    acc[tx.investmentId] = (acc[tx.investmentId] ?? 0) + Number(tx.amount);
    return acc;
  }, {});

  const serialize = (h: (typeof holdings)[0], actualReturnPct?: number) => ({
    ...h,
    purchasePrice: Number(h.purchasePrice),
    purchasedAt: h.purchasedAt.toISOString(),
    actualReturnPct: actualReturnPct ?? null,
    investment: {
      ...h.investment,
      pricePerUnit: Number(h.investment.pricePerUnit),
      targetReturn: Number(h.investment.targetReturn),
    },
  });

  const serializedActive = activeHoldings.map((h) => serialize(h));
  const serializedCompleted = completedHoldings.map((h) => {
    const totalDist = distByInvestment[h.investmentId] ?? 0;
    const paid = Number(h.purchasePrice);
    const actualReturnPct = paid > 0 ? ((totalDist - paid) / paid) * 100 : 0;
    return serialize(h, actualReturnPct);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">My Portfolio</h1>
        <p className="text-[#6A5A40]">Track your investments and performance</p>
      </div>

      <WalletCard balance={Number(wallet.balance)} />

      <PortfolioSummary
        totalInvested={totalInvested}
        currentValue={currentValue}
        holdingsCount={activeHoldings.length}
        totalUnits={activeHoldings.reduce((sum, h) => sum + h.unitsPurchased, 0)}
      />

      <Card>
        <CardTitle className="mb-5">Holdings</CardTitle>
        <HoldingsTable holdings={serializedActive} />
      </Card>

      {serializedCompleted.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <CardTitle>Completed Investments</CardTitle>
            <span className="text-xs text-[#8A7A60] bg-[#EDE6D6] px-2 py-0.5 rounded-full">
              {serializedCompleted.length}
            </span>
          </div>
          <p className="text-xs text-[#8A7A60] mb-4">
            These investments have been closed and distributions processed. Units are no longer active.
          </p>
          <HoldingsTable holdings={serializedCompleted} />
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-5">
          <CardTitle>Transaction History</CardTitle>
          <CsvExportButton />
        </div>
        {transactions.length === 0 ? (
          <p className="text-[#6A5A40] text-sm py-8 text-center">
            No transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D6] text-left">
                  <th className="pb-3 text-[#6A5A40] font-medium">Investment</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Type</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Amount</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Status</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D6]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#EDE6D6]/50 transition-colors">
                    <td className="py-3">
                      <p className="font-medium text-[#1A1207]">
                        {tx.investment?.title ?? (tx.type === 'DEPOSIT' ? 'Wallet Deposit' : 'Wallet Withdrawal')}
                      </p>
                      <p className="text-xs text-[#6A5A40]">{tx.investment?.category ?? 'Wallet'}</p>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getTransactionTypeColor(tx.type)
                        )}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium font-mono-val">
                      {formatCurrency(Number(tx.amount))}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3 text-[#6A5A40] text-xs">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
