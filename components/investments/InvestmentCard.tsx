'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Users, Package, ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, calculateProgress } from '@/lib/utils';
import WatchlistButton from './WatchlistButton';

interface Investment {
  id: string;
  title: string;
  category: string;
  status: string;
  totalUnits: number;
  availableUnits: number;
  pricePerUnit: string | number;
  targetReturn: string | number;
  imageUrl?: string | null;
  _count?: { holdings: number };
}

interface InvestmentCardProps {
  investment: Investment;
  showStatus?: boolean;
  isSaved?: boolean;
  showWatchlist?: boolean;
  actualReturn?: number | null;
}

export default function InvestmentCard({ investment, showStatus = false, isSaved = false, showWatchlist = false, actualReturn }: InvestmentCardProps) {
  const progress = calculateProgress(investment.totalUnits, investment.availableUnits);
  const soldShares = investment.totalUnits - investment.availableUnits;
  const isSoldOut = investment.availableUnits === 0;

  return (
    <Link href={`/investments/${investment.id}`} className="group block h-full">
      <div className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:border-[#C9A84C]/40 group-hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative h-44 bg-[#EDE6D6] overflow-hidden flex-shrink-0">
          {investment.imageUrl ? (
            <Image
              src={investment.imageUrl}
              alt={investment.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-12 w-12 text-[#C9A84C]/30" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B1F]/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="bg-[#1A2B1F] text-[#C9A84C] text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide">
              {investment.category}
            </span>
            {showStatus && (
              <div className="rounded-md px-1 py-0.5">
                <StatusBadge status={investment.status} />
              </div>
            )}
          </div>

          {showWatchlist && (
            <WatchlistButton investmentId={investment.id} initialSaved={isSaved} />
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-[#F7F4EE]/60 flex items-center justify-center">
              <span className="bg-white border border-[#E8E2D6] text-[#6A5A40] text-xs font-semibold px-3 py-1 rounded-full">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <h3 className="font-semibold text-[#1A1207] text-sm leading-snug line-clamp-2 group-hover:text-[#C9A84C] transition-colors">
            {investment.title}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6A5A40] mb-0.5 uppercase tracking-wide">Price / share</p>
              <p className="text-lg font-bold font-mono-val">
                {formatCurrency(Number(investment.pricePerUnit))}
              </p>
            </div>
            <div className="text-right">
              {actualReturn != null ? (
                <>
                  <p className="text-[10px] text-[#6A5A40] mb-0.5 uppercase tracking-wide">Actual return</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className={`h-3 w-3 ${actualReturn >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`} />
                    <p className={`text-sm font-semibold font-mono-val ${actualReturn >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                      {actualReturn >= 0 ? '+' : ''}{actualReturn.toFixed(1)}%
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-[#6A5A40] mb-0.5 uppercase tracking-wide">Target return</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="h-3 w-3 text-[#2E7D32]" />
                    <p className="text-sm font-semibold font-mono-val text-[#2E7D32]">
                      {Number(investment.targetReturn).toFixed(1)}% p.a.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <ProgressBar value={progress} />
            <div className="flex justify-between items-center text-[10px] text-[#6A5A40]">
              <span className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                {investment._count?.holdings ?? 0} holders
              </span>
              <span>{soldShares.toLocaleString()} / {investment.totalUnits.toLocaleString()} shares sold</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-1">
            <div className="flex items-center justify-between py-2 border-t border-[#E8E2D6] text-xs text-[#1A2B1F] group-hover:text-[#C9A84C] transition-colors">
              <span className="font-medium">View details</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
