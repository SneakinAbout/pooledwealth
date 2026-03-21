import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import FeeCollectionClient from './FeeCollectionClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Users, TrendingDown, AlertTriangle } from 'lucide-react';

function calcEffectiveFee(totalInvested: number, annualPct: number, discountPct: number) {
  const gross = Math.round((totalInvested * (annualPct / 100) / 12) * 100) / 100;
  return Math.round(gross * (1 - discountPct / 100) * 100) / 100;
}

export default async function AdminFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/investments');

  const [settings, users, lastFee] = await Promise.all([
    prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.user.findMany({
      include: {
        holdings: { select: { purchasePrice: true } },
        wallet: { select: { balance: true } },
      },
    }),
    prisma.transaction.findFirst({
      where: { type: 'FEE' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const annualPct = Number(settings?.managementFeePercent ?? 2);

  const breakdown = users.map((u) => {
    const totalInvested = u.holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
    const discountPct = parseFloat(String(u.feeDiscountPercent)) || 0;
    const grossFee = Math.round((totalInvested * (annualPct / 100) / 12) * 100) / 100;
    const effectiveFee = calcEffectiveFee(totalInvested, annualPct, discountPct);
    const walletBalance = Number(u.wallet?.balance ?? 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as string,
      totalInvested,
      grossFee,
      discountPercent: discountPct,
      effectiveFee,
      walletBalance,
      canPay: walletBalance >= effectiveFee,
      hasInvestments: totalInvested > 0,
    };
  }).filter((u) => u.hasInvestments);

  const totalFee = breakdown.reduce((s, u) => s + u.effectiveFee, 0);
  const collectible = breakdown.filter((u) => u.canPay).reduce((s, u) => s + u.effectiveFee, 0);
  const insufficientCount = breakdown.filter((u) => !u.canPay).length;

  const stats = [
    { label: 'Annual Rate', value: `${annualPct}% p.a.`, sub: `${(annualPct / 12).toFixed(3)}% / month`, icon: TrendingDown, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
    { label: 'Users with Holdings', value: breakdown.length.toString(), sub: 'All roles included', icon: Users, color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]' },
    { label: 'Total Due This Month', value: formatCurrency(totalFee), sub: 'After discounts', icon: DollarSign, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
    { label: 'Insufficient Funds', value: insufficientCount.toString(), sub: insufficientCount > 0 ? 'Will be skipped' : 'All covered', icon: AlertTriangle, color: insufficientCount > 0 ? 'text-[#E65100]' : 'text-[#6A5A40]', bg: insufficientCount > 0 ? 'bg-[#FFF3E0]' : 'bg-[#EDE6D6]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Fee Collection</h1>
        <p className="text-[#6A5A40]">
          Monthly management fee — {annualPct}% p.a. on invested balance, for all users
        </p>
        <p className="text-xs text-[#8A7A60] mt-1">
          Auto-charges on the 1st of each month via cron &nbsp;·&nbsp;{' '}
          {lastFee
            ? <>Last charged: <span className="text-[#6A5A40]">{formatDate(lastFee.createdAt)}</span></>
            : 'No fees charged yet'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6A5A40]">{label}</p>
              <p className={`text-base font-bold font-mono-val ${color}`}>{value}</p>
              <p className="text-xs text-[#8A7A60]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <FeeCollectionClient breakdown={breakdown} totalFee={totalFee} collectible={collectible} annualPct={annualPct} />
    </div>
  );
}
