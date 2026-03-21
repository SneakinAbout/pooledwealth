'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  TrendingUp,
  Users,
  Building2,
  ArrowLeft,
  Info,
  Lock,
  Tag,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import PurchaseModal from '@/components/investments/PurchaseModal';
import InvestmentAdminSection from '@/components/investments/InvestmentAdminSection';
import ProposalList from '@/components/investments/ProposalList';
import InvestmentUpdates from '@/components/investments/InvestmentUpdates';
import ValuationWidget from '@/components/investments/ValuationWidget';
import { formatCurrency, formatDate, calculateProgress } from '@/lib/utils';

interface Investment {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  locked: boolean;
  totalUnits: number;
  availableUnits: number;
  pricePerUnit: number;
  minimumUnits: number;
  minimumRaise?: number;
  targetReturn: number;
  currentValue?: number | null;
  startDate: Date | string;
  endDate: Date | string;
  imageUrl?: string | null;
  createdBy: { name: string };
  _count: { holdings: number };
  // Asset identification for supplement
  edition?: string | null;
  grade?: string | null;
  gradingCompany?: string | null;
  certNumber?: string | null;
  acquisitionPrice?: number | null;
  acquisitionDate?: string | null;
}

interface AdminData {
  totalCostBasis: number;
  remainingCostBasis: number;
  isManager?: boolean;
  previouslyDistributedGross: number;
  previousDistributions: {
    id: string;
    totalAmount: number;
    profitShareDeducted: number;
    netAmount: number;
    distributedAt: string;
    notes: string | null;
  }[];
}

interface Props {
  investment: Investment;
  settings: { managementFeePercent: number; profitSharePercent: number };
  canInvest: boolean;
  subscriptionEnded?: boolean;
  adminData?: AdminData | null;
  isAdmin?: boolean;
  isManager?: boolean;
  isOwner?: boolean;
}

export default function InvestmentDetailClient({ investment, settings, canInvest, subscriptionEnded = false, adminData, isAdmin = false, isManager = false, isOwner = false }: Props) {
  const [showPurchase, setShowPurchase] = useState(false);
  const progress = calculateProgress(investment.totalUnits, investment.availableUnits);
  const soldUnits = investment.totalUnits - investment.availableUnits;
  const isSoldOut = investment.availableUnits === 0;
  const minAmount = investment.pricePerUnit * investment.minimumUnits;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/investments"
        className="inline-flex items-center gap-1.5 text-[#6A5A40] hover:text-[#1A1207] text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Assets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero card */}
          <Card className="p-0 overflow-hidden">
            {investment.imageUrl ? (
              <div className="relative h-64 bg-[#EDE6D6]">
                <Image
                  src={investment.imageUrl}
                  alt={investment.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B1F]/50 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="h-56 bg-[#EDE6D6] flex items-center justify-center border-b border-[#E8E2D6]">
                <Building2 className="h-16 w-16 text-[#C9A84C]/30" />
              </div>
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 bg-[#1A2B1F] text-[#C9A84C] text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide">
                  <Tag className="h-2.5 w-2.5" />
                  {investment.category}
                </span>
                <StatusBadge status={investment.status} />
              </div>
              <h1 className="text-xl font-bold text-[#1A1207] mb-3">{investment.title}</h1>
              <p className="text-[#6A5A40] text-sm leading-relaxed">{investment.description}</p>
              <p className="text-xs text-[#8A7A60] mt-4">Listed by {investment.createdBy.name}</p>
            </div>
          </Card>

          {/* Fee Disclosure */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-[#1565C0]" />
              </div>
              <h2 className="text-sm font-semibold text-[#1A1207]">Fee Disclosure</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6]">
                <div>
                  <p className="text-sm text-[#1A1207] font-medium">Management Fee</p>
                  <p className="text-xs text-[#8A7A60] mt-0.5">Charged monthly on your invested balance</p>
                </div>
                <span className="text-sm text-[#1A1207] font-semibold tabular-nums font-mono-val">{settings.managementFeePercent}% p.a.</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6]">
                <div>
                  <p className="text-sm text-[#1A1207] font-medium">Profit Share</p>
                  <p className="text-xs text-[#8A7A60] mt-0.5">Deducted from distributions only</p>
                </div>
                <span className="text-sm text-[#1A1207] font-semibold tabular-nums font-mono-val">{settings.profitSharePercent}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: purchase panel */}
        <div className="space-y-4">
          <Card className="sticky top-20 bg-white border border-[#E8E2D6]">
            {/* Price */}
            <div className="mb-5">
              <p className="text-[10px] text-[#6A5A40] uppercase tracking-widest mb-1">Price per unit</p>
              <p className="text-3xl font-bold font-mono-val">
                {formatCurrency(investment.pricePerUnit)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#2E7D32]" />
                <span className="text-sm text-[#2E7D32] font-medium font-mono-val">
                  {investment.targetReturn.toFixed(1)}% target annual return
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-5 space-y-1.5">
              <div className="flex justify-between text-xs text-[#8A7A60]">
                <span>{soldUnits.toLocaleString()} sold</span>
                <span>{progress}% owned</span>
              </div>
              <ProgressBar value={progress} showLabel={false} />
              <div className="flex justify-between text-[10px] text-[#6A5A40]">
                <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {investment._count.holdings} investors</span>
                <span>{investment.availableUnits.toLocaleString()} remaining</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
              {[
                { label: 'Min. units', value: `${investment.minimumUnits}` },
                { label: 'Total units', value: investment.totalUnits.toLocaleString() },
                { label: 'Min. amount', value: formatCurrency(minAmount) },
                { label: 'Owners', value: investment._count.holdings.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#EDE6D6] rounded-xl p-3 border border-[#E8E2D6]">
                  <p className="text-[10px] text-[#6A5A40] uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-[#1A1207] tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-1.5 mb-5 text-xs text-[#8A7A60] border-t border-[#E8E2D6] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Open date</span>
                </div>
                <span className="text-[#6A5A40]">{formatDate(investment.startDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Close date</span>
                </div>
                <span className="text-[#6A5A40]">{formatDate(investment.endDate)}</span>
              </div>
            </div>

            {/* Valuation — shown to admin/manager (can edit) and owners (read-only) */}
            {(isAdmin || isManager || isOwner) && (
              <div className="mb-5">
                <ValuationWidget
                  investmentId={investment.id}
                  currentValue={investment.currentValue ?? null}
                  totalCostBasis={adminData?.totalCostBasis ?? (investment.pricePerUnit * (investment.totalUnits - investment.availableUnits))}
                  canEdit={isAdmin || isManager}
                />
              </div>
            )}

          {canInvest && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowPurchase(true)}
                disabled={isSoldOut}
              >
                {isSoldOut ? 'Sold Out' : 'Invest Now'}
              </Button>
            )}

            {!canInvest && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#8A7A60] py-2">
                <Lock className="h-3 w-3" />
                {subscriptionEnded
                  ? 'Subscription period has closed.'
                  : investment.status !== 'ACTIVE'
                  ? 'This investment is not currently open.'
                  : 'KYC approval required to invest.'}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Investment updates feed */}
      <div className="mt-6">
        <InvestmentUpdates
          investmentId={investment.id}
          canPost={isAdmin || isManager}
        />
      </div>

      {/* Co-owner proposals — visible to owners and admins when investment is locked */}
      {investment.locked && (isOwner || isAdmin) && (
        <div className="mt-6">
          <ProposalList
            investmentId={investment.id}
            isAdmin={isAdmin}
            isOwner={isOwner}
          />
        </div>
      )}

      {adminData && (
        <InvestmentAdminSection
          investmentId={investment.id}
          status={investment.status}
          locked={investment.locked}
          totalUnits={investment.totalUnits}
          availableUnits={investment.availableUnits}
          minimumRaise={investment.minimumRaise ?? 0}
          endDate={typeof investment.endDate === 'string' ? investment.endDate : new Date(investment.endDate).toISOString()}
          holdingsCount={investment._count.holdings}
          totalCostBasis={adminData.totalCostBasis}
          remainingCostBasis={adminData.remainingCostBasis}
          previouslyDistributedGross={adminData.previouslyDistributedGross}
          previousDistributions={adminData.previousDistributions}
          settings={settings}
        />
      )}

      <PurchaseModal
        isOpen={showPurchase}
        onClose={() => setShowPurchase(false)}
        investment={{
          id: investment.id,
          title: investment.title,
          pricePerUnit: investment.pricePerUnit,
          minimumUnits: investment.minimumUnits,
          availableUnits: investment.availableUnits,
          totalUnits: investment.totalUnits,
          endDate: typeof investment.endDate === 'string' ? investment.endDate : new Date(investment.endDate).toISOString(),
          edition: investment.edition,
          grade: investment.grade,
          gradingCompany: investment.gradingCompany,
          certNumber: investment.certNumber,
          acquisitionPrice: investment.acquisitionPrice,
          acquisitionDate: investment.acquisitionDate,
        }}
        settings={settings}
      />
    </div>
  );
}
