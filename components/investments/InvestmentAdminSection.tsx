'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateDistributionFees } from '@/lib/fees';
import { DollarSign, CheckCircle, AlertTriangle, Lock, Unlock } from 'lucide-react';

interface PreviousDistribution {
  id: string;
  totalAmount: number;
  profitShareDeducted: number;
  netAmount: number;
  distributedAt: string;
  notes: string | null;
}

interface Props {
  investmentId: string;
  status: string;
  locked: boolean;
  totalUnits: number;
  availableUnits: number;
  minimumRaise: number;
  endDate: string;
  holdingsCount: number;
  totalCostBasis: number;
  remainingCostBasis: number;
  previouslyDistributedGross: number;
  previousDistributions: PreviousDistribution[];
  settings: { managementFeePercent: number; profitSharePercent: number };
}

export default function InvestmentAdminSection({
  investmentId,
  status,
  locked,
  totalUnits,
  availableUnits,
  minimumRaise,
  endDate,
  holdingsCount,
  totalCostBasis,
  remainingCostBasis,
  previouslyDistributedGross,
  previousDistributions,
  settings,
}: Props) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showAutoAllocate, setShowAutoAllocate] = useState(false);
  const [showLock, setShowLock] = useState(false);

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof calculateDistributionFees> | null>(null);
  const [distLoading, setDistLoading] = useState(false);
  const [distSuccess, setDistSuccess] = useState(false);

  const handleToggleLock = async () => {
    setLockLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/lock`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.locked ? 'Investment locked — refunds disabled.' : 'Investment unlocked.');
      setShowLock(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lock toggle failed');
    } finally {
      setLockLoading(false);
    }
  };

  const unitsSold = totalUnits - availableUnits;
  const minimumMet = minimumRaise === 0 || unitsSold >= minimumRaise;
  const subscriptionEnded = new Date() > new Date(endDate);
  const profitToDate = Math.max(0, previouslyDistributedGross - totalCostBasis);
  const canDistribute = holdingsCount > 0 && (status === 'ACTIVE' || status === 'CLOSED');

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Investment ${newStatus.toLowerCase()}`);
      setShowArchive(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRefundAndRelist = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/refund`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Refunded ${result.refunded} investors. Investment reset to Draft.`);
      setShowRefund(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refund failed');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAutoAllocate = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/auto-allocate`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`${result.unitsAllocated} units allocated to platform.`);
      setShowAutoAllocate(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-allocate failed');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCloseInvestment = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${investmentId}/close`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (result.outcome === 'refunded') {
        toast.success(`Minimum raise not met — ${result.refundedCount} investors refunded. Investment archived.`);
      } else {
        toast.success('Investment closed and locked successfully.');
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Close failed');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePreview = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setPreview(calculateDistributionFees(val, settings, remainingCostBasis));
  };

  const handleDistribute = async () => {
    if (!preview) return;
    setDistLoading(true);
    try {
      const res = await fetch('/api/admin/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentId, totalAmount: parseFloat(amount), notes }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success('Distribution processed');
      setDistSuccess(true);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Distribution failed');
    } finally {
      setDistLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      {/* Header + status controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#1A1207]">Admin Controls</h2>
          {locked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1A2B1F] text-[#C9A84C]">
              <Lock className="h-2.5 w-2.5" /> Locked
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('ACTIVE')} disabled={statusLoading}>
              Activate
            </Button>
          )}
          {status === 'ACTIVE' && subscriptionEnded && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseInvestment}
              disabled={statusLoading}
              title={minimumMet ? 'Close investment and lock holdings' : 'Minimum raise not met — investors will be refunded'}
            >
              {minimumMet ? 'Close Investment' : 'Close & Refund All'}
            </Button>
          )}
          {status === 'ACTIVE' && !subscriptionEnded && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusChange('CLOSED')} disabled={statusLoading}>
              Force Close
            </Button>
          )}
          {holdingsCount > 0 && !locked && (
            <Button variant="secondary" size="sm" onClick={() => setShowRefund(true)} disabled={statusLoading}>
              Refund &amp; Re-list
            </Button>
          )}
          {availableUnits === 0 && status !== 'ARCHIVED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLock(true)}
              disabled={lockLoading}
              className="flex items-center gap-1.5"
            >
              {locked ? <><Unlock className="h-3 w-3" /> Unlock</> : <><Lock className="h-3 w-3" /> Lock</>}
            </Button>
          )}
          {availableUnits > 0 && status !== 'ARCHIVED' && (
            <Button variant="secondary" size="sm" onClick={() => setShowAutoAllocate(true)} disabled={statusLoading}>
              Auto-allocate Remaining
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setShowArchive(true)} disabled={statusLoading}>
            Archive
          </Button>
        </div>
      </div>

      {/* Locked banner */}
      {locked && (
        <div className="flex items-start gap-3 bg-[#1A2B1F]/8 border border-[#1A2B1F]/20 rounded-xl p-4">
          <Lock className="h-4 w-4 text-[#1A2B1F] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#1A1207]">Investment is locked</p>
            <p className="text-xs text-[#6A5A40] mt-0.5">
              Refunds and re-listing are disabled. Distributions can still be processed. Unlock to re-enable refunds.
            </p>
          </div>
        </div>
      )}

      {/* Minimum raise alert */}
      {minimumRaise > 0 && subscriptionEnded && !minimumMet && (
        <div className="flex items-start gap-3 bg-[#FFF3E0] border border-[#FFB74D]/40 rounded-xl p-4">
          <AlertTriangle className="h-4 w-4 text-[#E65100] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#E65100]">Minimum raise not met</p>
            <p className="text-xs text-[#BF360C] mt-0.5">
              Only {unitsSold} of {minimumRaise} required units were sold. Investors should be refunded and the investment re-listed, or use &quot;Refund &amp; Re-list&quot; above.
            </p>
          </div>
        </div>
      )}

      {/* Subscription closed notice */}
      {subscriptionEnded && status === 'ACTIVE' && (
        <div className="flex items-start gap-3 bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4">
          <AlertTriangle className="h-4 w-4 text-[#6A5A40] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#6A5A40]">
            Subscription period ended. Close or process this investment.
          </p>
        </div>
      )}

      {/* Minimum raise progress */}
      {minimumRaise > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#1A1207] text-sm">Minimum Raise Progress</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${minimumMet ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'}`}>
              {minimumMet ? 'Met' : 'Not Met'}
            </span>
          </div>
          <ProgressBar value={Math.min(100, Math.round((unitsSold / minimumRaise) * 100))} showLabel={false} />
          <div className="flex justify-between text-xs text-[#6A5A40] mt-2">
            <span>{unitsSold.toLocaleString()} units sold</span>
            <span>{minimumRaise.toLocaleString()} required</span>
          </div>
        </Card>
      )}

      {/* Cost basis summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Cost Basis', value: formatCurrency(totalCostBasis), sub: 'What investors paid' },
          { label: 'Previously Distributed', value: formatCurrency(previouslyDistributedGross), sub: 'Gross returned so far' },
          { label: 'Remaining Cost Basis', value: formatCurrency(remainingCostBasis), sub: remainingCostBasis === 0 ? 'Fully recovered' : 'Yet to be returned' },
          { label: 'Profit to Date', value: formatCurrency(profitToDate), sub: profitToDate > 0 ? 'Above cost basis' : 'No profit yet' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#6A5A40] mb-1">{label}</p>
            <p className="text-lg font-bold font-mono-val text-[#1A1207]">{value}</p>
            <p className="text-[10px] text-[#8A7A60] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Distribution form */}
      {canDistribute && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="h-7 w-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-[#C9A84C]" />
            </div>
            <h3 className="font-semibold text-[#1A1207]">Process Distribution</h3>
          </div>

          {distSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-[#2E7D32] mx-auto mb-3" />
              <p className="font-medium text-[#1A1207] mb-1">Distribution Complete</p>
              <p className="text-sm text-[#6A5A40] mb-4">
                Funds distributed to {holdingsCount} investor{holdingsCount !== 1 ? 's' : ''}.
              </p>
              <Button variant="secondary" size="sm" onClick={() => { setDistSuccess(false); setPreview(null); setAmount(''); setNotes(''); }}>
                Process Another
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="Gross Distribution Amount (USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setPreview(null); }}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" onClick={handlePreview} disabled={!amount || parseFloat(amount) <= 0}>
                    Preview
                  </Button>
                </div>
              </div>

              <Textarea
                label="Notes (optional)"
                placeholder="e.g. Q1 2025 profit distribution"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {preview && (
                <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6A5A40]">Gross Distribution</span>
                    <span className="font-mono-val text-[#1A1207]">{formatCurrency(preview.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A5A40]">Cost Basis Applied</span>
                    <span className="font-mono-val text-[#1A1207]">−{formatCurrency(preview.costBasis)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E8E2D6] pt-2">
                    <span className="text-[#6A5A40]">Taxable Profit</span>
                    <span className="font-mono-val text-[#1A1207]">{formatCurrency(preview.profit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A5A40]">Profit Share ({settings.profitSharePercent}%)</span>
                    <span className="font-mono-val text-[#C62828]">−{formatCurrency(preview.profitShare)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E8E2D6] pt-2 font-semibold">
                    <span className="text-[#1A1207]">Net to Investors</span>
                    <span className="font-mono-val text-[#2E7D32] text-base">{formatCurrency(preview.netAmount)}</span>
                  </div>
                  <p className="text-xs text-[#8A7A60] pt-1">
                    Distributed proportionally across {holdingsCount} investor{holdingsCount !== 1 ? 's' : ''} by units held.
                  </p>
                </div>
              )}

              <Button onClick={handleDistribute} loading={distLoading} disabled={!preview}>
                Process Distribution
              </Button>
              {!preview && (
                <p className="text-xs text-[#8A7A60]">Click "Preview" to review the fee breakdown before processing.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {!canDistribute && holdingsCount === 0 && (
        <Card>
          <p className="text-sm text-[#6A5A40] text-center py-4">No investors hold units in this investment yet.</p>
        </Card>
      )}

      {/* Distribution history */}
      {previousDistributions.length > 0 && (
        <Card>
          <h3 className="font-semibold text-[#1A1207] mb-4">Distribution History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D6] text-left">
                  <th className="pb-3 text-[#6A5A40] font-medium">Date</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Gross</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Profit Share</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Net</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D6]">
                {previousDistributions.map((d) => (
                  <tr key={d.id} className="hover:bg-[#EDE6D6]/50">
                    <td className="py-3 text-[#6A5A40] text-xs">{formatDate(d.distributedAt)}</td>
                    <td className="py-3 text-right font-mono-val">{formatCurrency(d.totalAmount)}</td>
                    <td className="py-3 text-right font-mono-val text-[#C62828]">−{formatCurrency(d.profitShareDeducted)}</td>
                    <td className="py-3 text-right font-mono-val text-[#2E7D32] font-medium">{formatCurrency(d.netAmount)}</td>
                    <td className="py-3 text-xs text-[#6A5A40]">{d.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={() => handleStatusChange('ARCHIVED')}
        title="Archive Investment"
        message="This investment will be hidden from all users. This action cannot be undone."
        confirmLabel="Archive"
        loading={statusLoading}
      />
      <ConfirmDialog
        isOpen={showRefund}
        onClose={() => setShowRefund(false)}
        onConfirm={handleRefundAndRelist}
        title="Refund All Investors & Re-list"
        message={`This will refund all ${holdingsCount} investor${holdingsCount !== 1 ? 's' : ''}, remove their holdings, and reset the investment to Draft so it can be re-listed. This cannot be undone.`}
        confirmLabel="Refund & Re-list"
        variant="warning"
        loading={statusLoading}
      />
      <ConfirmDialog
        isOpen={showAutoAllocate}
        onClose={() => setShowAutoAllocate(false)}
        onConfirm={handleAutoAllocate}
        title="Auto-allocate to Platform"
        message={`The platform will take the remaining ${availableUnits} unallocated unit${availableUnits !== 1 ? 's' : ''} at $0 cost basis and participate in future distributions proportionally.`}
        confirmLabel="Auto-allocate"
        variant="warning"
        loading={statusLoading}
      />
      <ConfirmDialog
        isOpen={showLock}
        onClose={() => setShowLock(false)}
        onConfirm={handleToggleLock}
        title={locked ? 'Unlock Investment' : 'Lock Investment'}
        message={
          locked
            ? 'Unlocking will re-enable the Refund & Re-list option for this investment.'
            : 'Locking this investment disables all refunds and re-listing. Distributions can still be processed. This can be reversed by unlocking.'
        }
        confirmLabel={locked ? 'Unlock' : 'Lock Investment'}
        variant={locked ? undefined : 'warning'}
        loading={lockLoading}
      />
    </div>
  );
}
