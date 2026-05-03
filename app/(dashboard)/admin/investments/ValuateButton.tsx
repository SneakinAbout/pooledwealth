'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ValuationResult {
  format: string;
  formatDescription: string;
  searchQuery: string;
  marketValue: number | null;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  compCount: number;
  flaggedForReview: boolean;
  flagReason?: string;
  currentValue: number | null;
  rawListingsFound: number;
  filteredOut: number;
}

const confidenceConfig = {
  high:         { label: 'High',         colour: 'text-[#1E5E38] bg-[#E8F5EE]' },
  medium:       { label: 'Medium',       colour: 'text-[#92600A] bg-[#FEF9EC]' },
  low:          { label: 'Low',          colour: 'text-[#8A4A00] bg-[#FFF3E0]' },
  insufficient: { label: 'Insufficient', colour: 'text-[#9B2C2C] bg-[#FDF0F0]' },
};

function fmt(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export default function ValuateButton({
  investmentId,
  investmentTitle,
}: {
  investmentId: string;
  investmentTitle: string;
}) {
  const router = useRouter();
  const [running, setRunning]       = useState(false);
  const [accepting, setAccepting]   = useState(false);
  const [result, setResult]         = useState<ValuationResult | null>(null);
  const [showModal, setShowModal]   = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setShowModal(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/valuation`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Valuation failed');
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Valuation failed');
      setShowModal(false);
    } finally {
      setRunning(false);
    }
  };

  const handleAccept = async () => {
    if (!result?.marketValue) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/valuation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: result.marketValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      toast.success('Market value updated');
      setShowModal(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setAccepting(false);
    }
  };

  const conf = result ? confidenceConfig[result.confidence] : null;
  const valueChanged = result?.marketValue !== null && result?.marketValue !== result?.currentValue;

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleRun} disabled={running} loading={running}>
        <Sparkles className="h-3.5 w-3.5" />
        {running ? 'Running…' : 'Valuate'}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => { if (!running && !accepting) setShowModal(false); }}
        title="AI Market Valuation"
        size="lg"
      >
        {/* Loading state */}
        {running && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[#C9A84C]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#1A1207]">Searching eBay sold listings…</p>
              <p className="text-xs text-[#8A7A60] mt-1">Classifying asset · Finding comps · Filtering results</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!running && result && (
          <div className="space-y-5">
            {/* Asset format detected */}
            <div className="bg-[#F7F4EE] rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-[#8A7A60] uppercase tracking-widest">Asset Identified As</p>
              <p className="text-sm font-semibold text-[#1A1207]">{result.formatDescription}</p>
              <p className="text-xs text-[#8A7A60]">
                Search query: <span className="font-mono text-[#6A5A40]">{result.searchQuery}</span>
              </p>
            </div>

            {/* Flag warning */}
            {result.flaggedForReview && (
              <div className="flex gap-3 bg-[#FEF9EC] border border-[#F0D060]/40 rounded-xl p-4">
                <AlertTriangle className="h-4 w-4 text-[#92600A] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#92600A]">{result.flagReason ?? 'Flagged for manual review'}</p>
              </div>
            )}

            {/* Value comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#E8E2D6] rounded-xl p-4">
                <p className="text-xs text-[#8A7A60] uppercase tracking-widest mb-1">Current Value</p>
                <p className="text-xl font-semibold text-[#8A7A60]">
                  {result.currentValue !== null ? fmt(result.currentValue) : '—'}
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${result.marketValue ? 'border-[#C9A84C]/40 bg-[#FDFAF3]' : 'border-[#E8E2D6]'}`}>
                <p className="text-xs text-[#8A7A60] uppercase tracking-widest mb-1">Suggested Value</p>
                <p className={`text-xl font-semibold ${result.marketValue ? 'text-[#1A2B1F]' : 'text-[#9B2C2C]'}`}>
                  {result.marketValue !== null ? fmt(result.marketValue) : 'No data'}
                </p>
                {valueChanged && result.marketValue && result.currentValue && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${result.marketValue > result.currentValue ? 'text-[#1E5E38]' : 'text-[#9B2C2C]'}`}>
                    <TrendingUp className="h-3 w-3" />
                    {result.marketValue > result.currentValue ? '+' : ''}
                    {fmt(result.marketValue - result.currentValue)}
                  </p>
                )}
              </div>
            </div>

            {/* Comp stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-[#6A5A40]">
                <CheckCircle2 className="h-4 w-4 text-[#1E5E38]" />
                <span><strong className="text-[#1A1207]">{result.compCount}</strong> comparable sale{result.compCount !== 1 ? 's' : ''} used</span>
              </div>
              <span className="text-xs text-[#8A7A60]">
                {result.rawListingsFound} found · {result.filteredOut} filtered out
              </span>
              {conf && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${conf.colour}`}>
                  {conf.label} confidence
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-[#E8E2D6]">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={accepting}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleAccept}
                disabled={!result.marketValue || accepting}
                loading={accepting}
              >
                Accept &amp; Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
