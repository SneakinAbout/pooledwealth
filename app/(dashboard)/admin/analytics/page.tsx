import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getTransactionTypeColor } from '@/lib/utils';
import { Users, TrendingUp, Building2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/investments');
  }

  const [
    totalUsers,
    totalInvestors,
    totalInvestments,
    activeInvestments,
    totalTxValue,
    recentTransactions,
    topInvestments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'INVESTOR' } }),
    prisma.investment.count(),
    prisma.investment.count({ where: { status: 'ACTIVE' } }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', type: 'PURCHASE' },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        investment: { select: { title: true } },
      },
    }),
    prisma.investment.findMany({
      take: 5,
      where: { status: 'ACTIVE' },
      include: { _count: { select: { holdings: true } } },
      orderBy: { holdings: { _count: 'desc' } },
    }),
  ]);

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers.toString(),
      sub: `${totalInvestors} co-owners`,
      icon: Users,
      color: 'text-[#1565C0]',
      bg: 'bg-[#E3F2FD]',
    },
    {
      label: 'Total Investments',
      value: totalInvestments.toString(),
      sub: `${activeInvestments} active`,
      icon: Building2,
      color: 'text-[#6A5A40]',
      bg: 'bg-[#EDE6D6]',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(Number(totalTxValue._sum.amount ?? 0)),
      sub: 'Completed purchases',
      icon: DollarSign,
      color: 'text-[#C9A84C]',
      bg: 'bg-[#C9A84C]/10',
    },
    {
      label: 'Active Investments',
      value: activeInvestments.toString(),
      sub: 'Currently open',
      icon: TrendingUp,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#E8F5E9]',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Platform Analytics</h1>
        <p className="text-[#6A5A40]">Overview of platform performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <Icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#6A5A40] mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-mono-val ${s.color}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-[#8A7A60]">{s.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-[#1A1207] mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#E8E2D6] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1207] truncate">{tx.user.name}</p>
                  <p className="text-xs text-[#6A5A40] truncate">{tx.investment?.title ?? tx.type}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-medium font-mono-val">
                    {formatCurrency(Number(tx.amount))}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded', getTransactionTypeColor(tx.type))}>
                      {tx.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-[#1A1207] mb-4">Top Investments by Co-Owners</h2>
          <div className="space-y-3">
            {topInvestments.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-[#E8E2D6] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1207] truncate">{inv.title}</p>
                  <p className="text-xs text-[#6A5A40]">{inv.category}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-bold font-mono-val">{inv._count.holdings}</p>
                  <p className="text-xs text-[#6A5A40]">co-owners</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
