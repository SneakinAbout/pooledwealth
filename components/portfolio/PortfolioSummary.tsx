import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Wallet, PieChart, BarChart2 } from 'lucide-react';

interface SummaryProps {
  totalInvested: number;
  currentValue: number;
  holdingsCount: number;
  totalUnits: number;
}

export default function PortfolioSummary({
  totalInvested,
  currentValue,
  holdingsCount,
  totalUnits,
}: SummaryProps) {
  const gain = currentValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

  const stats = [
    {
      label: 'Total Invested',
      value: formatCurrency(totalInvested),
      icon: Wallet,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Current Value',
      value: formatCurrency(currentValue),
      icon: BarChart2,
      color: 'text-[#C9A84C]',
      bg: 'bg-[#C9A84C]/10',
    },
    {
      label: 'Gain / Loss',
      value: `${gain >= 0 ? '+' : ''}${formatCurrency(gain)}`,
      sub: `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%`,
      icon: TrendingUp,
      color: gain >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]',
      bg: gain >= 0 ? 'bg-[#E8F5E9]' : 'bg-[#FFEBEE]',
    },
    {
      label: 'Active Holdings',
      value: holdingsCount.toString(),
      sub: `${totalUnits.toLocaleString()} units`,
      icon: PieChart,
      color: 'text-[#6A5A40]',
      bg: 'bg-[#EDE6D6]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
              <Icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6A5A40] mb-1">{stat.label}</p>
              <p className={`text-xl font-bold font-mono-val ${stat.color}`}>{stat.value}</p>
              {stat.sub && (
                <p className="text-xs text-[#8A7A60]">{stat.sub}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
