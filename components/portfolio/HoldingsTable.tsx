'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { TrendingUp } from 'lucide-react';

interface Holding {
  id: string;
  unitsPurchased: number;
  purchasePrice: string | number;
  purchasedAt: string;
  actualReturnPct?: number | null;
  investment: {
    id: string;
    title: string;
    category: string;
    pricePerUnit: string | number;
    targetReturn: string | number;
    status: string;
  };
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-[#6A5A40]">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-[#1A1207] mb-1">No holdings yet</p>
        <p className="text-sm">
          Browse available investments and start building your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E2D6] text-left">
            <th className="pb-3 text-[#6A5A40] font-medium">Investment</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Units</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Invested</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Current Value</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Return</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Status</th>
            <th className="pb-3 text-[#6A5A40] font-medium text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8E2D6]">
          {holdings.map((holding) => {
            const currentValue =
              Number(holding.investment.pricePerUnit) * holding.unitsPurchased;
            const gain = currentValue - Number(holding.purchasePrice);

            return (
              <tr key={holding.id} className="hover:bg-[#EDE6D6]/50 transition-colors">
                <td className="py-4">
                  <Link
                    href={`/investments/${holding.investment.id}`}
                    className="hover:text-[#C9A84C] transition-colors"
                  >
                    <p className="font-medium text-[#1A1207]">{holding.investment.title}</p>
                    <p className="text-xs text-[#6A5A40]">{holding.investment.category}</p>
                  </Link>
                </td>
                <td className="py-4 text-right font-mono-val">
                  {holding.unitsPurchased.toLocaleString()}
                </td>
                <td className="py-4 text-right font-mono-val">
                  {formatCurrency(Number(holding.purchasePrice))}
                </td>
                <td className="py-4 text-right">
                  <span className="font-mono-val">{formatCurrency(currentValue)}</span>
                  {gain !== 0 && (
                    <span
                      className={`block text-xs ${gain > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}
                    >
                      {gain > 0 ? '+' : ''}
                      {formatCurrency(gain)}
                    </span>
                  )}
                </td>
                <td className="py-4 text-right font-mono-val">
                  {holding.actualReturnPct != null ? (
                    <span>
                      <span className={holding.actualReturnPct >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}>
                        {holding.actualReturnPct >= 0 ? '+' : ''}{holding.actualReturnPct.toFixed(1)}%
                      </span>
                      <span className="block text-[10px] text-[#8A7A60]">actual</span>
                    </span>
                  ) : (
                    <span>
                      <span className="text-[#2E7D32]">{Number(holding.investment.targetReturn).toFixed(1)}%</span>
                      <span className="block text-[10px] text-[#8A7A60]">target</span>
                    </span>
                  )}
                </td>
                <td className="py-4 text-right">
                  <StatusBadge status={holding.investment.status} />
                </td>
                <td className="py-4 text-right text-[#6A5A40]">
                  {formatDate(holding.purchasedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
