'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type FeeExtraction = {
  id: string;
  amount: number;
  extractedAt: string;
  bankRef: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
};

type DisbursementRecord = {
  id: string;
  investmentId: string;
  investmentTitle: string;
  investmentStatus: string;
  totalRaised: number;
  vendorAmount: number | null;
  disbursedAt: string | null;
  disbursementRef: string | null;
  platformFeeAmount: number | null;
  platformFeeExtractedAt: string | null;
  feeRef: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalDeposited: number;
  totalWithdrawn: number;
  totalFeesCharged: number;
  totalMgmtFeesSwept: number;
  mgmtFeesAwaitingSweep: number;
  totalVendorDisbursed: number;
  totalInvestmentFeesExtracted: number;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  pendingVendorDisbursement: number;
  pendingInvestmentFeeExtraction: number;
};

type Props = {
  summary: Summary;
  feeExtractions: FeeExtraction[];
  disbursements: DisbursementRecord[];
};

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

type ModalType =
  | { type: 'sweep' }
  | { type: 'vendor'; record: DisbursementRecord }
  | { type: 'investmentFee'; record: DisbursementRecord }
  | null;

export default function TrustClient({ summary: initialSummary, feeExtractions: initialExtractions, disbursements: initialDisbursements }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [feeExtractions, setFeeExtractions] = useState(initialExtractions);
  const [disbursements, setDisbursements] = useState(initialDisbursements);
  const [modal, setModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  // Shared form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');

  function openSweepModal() {
    setAmount(summary.mgmtFeesAwaitingSweep > 0 ? summary.mgmtFeesAwaitingSweep.toFixed(2) : '');
    setDate(new Date().toISOString().slice(0, 10));
    setBankRef('');
    setNotes('');
    setModal({ type: 'sweep' });
  }

  function openVendorModal(record: DisbursementRecord) {
    setAmount(record.vendorAmount?.toFixed(2) ?? record.totalRaised.toFixed(2));
    setDate(record.disbursedAt ? record.disbursedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setBankRef(record.disbursementRef ?? '');
    setNotes(record.notes ?? '');
    setModal({ type: 'vendor', record });
  }

  function openInvestmentFeeModal(record: DisbursementRecord) {
    setAmount(record.platformFeeAmount?.toFixed(2) ?? '');
    setDate(record.platformFeeExtractedAt ? record.platformFeeExtractedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setBankRef(record.feeRef ?? '');
    setNotes('');
    setModal({ type: 'investmentFee', record });
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.type === 'sweep') {
        const res = await fetch('/api/admin/trust/fee-extractions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            extractedAt: new Date(date).toISOString(),
            bankRef: bankRef || undefined,
            notes: notes || undefined,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save');
        toast.success('Fee sweep recorded');
      } else if (modal.type === 'vendor') {
        const res = await fetch(`/api/admin/trust/disbursements/${modal.record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorAmount: parseFloat(amount),
            disbursedAt: new Date(date).toISOString(),
            disbursementRef: bankRef || undefined,
            notes: notes || undefined,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save');
        toast.success('Vendor payment recorded');
      } else if (modal.type === 'investmentFee') {
        const res = await fetch(`/api/admin/trust/disbursements/${modal.record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platformFeeAmount: parseFloat(amount),
            platformFeeExtractedAt: new Date(date).toISOString(),
            feeRef: bankRef || undefined,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save');
        toast.success('Investment fee extraction recorded');
      }

      // Refresh from API
      const recon = await fetch('/api/admin/trust/reconciliation');
      const data = await recon.json();
      setSummary(data.summary);
      setFeeExtractions(data.feeExtractions ?? []);
      setDisbursements(data.disbursements);
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const hasDiscrepancy = Math.abs(summary.discrepancy) > 0.01;

  // Build action items list
  const actionItems: { id: string; label: string; amount: number; tag: string; onAction: () => void }[] = [];

  if (summary.mgmtFeesAwaitingSweep > 0.01) {
    actionItems.push({
      id: 'sweep',
      label: 'Management fees collected — transfer to general account',
      amount: summary.mgmtFeesAwaitingSweep,
      tag: 'Fee Sweep',
      onAction: openSweepModal,
    });
  }

  disbursements.forEach((d) => {
    if (!d.disbursedAt) {
      actionItems.push({
        id: `vendor-${d.id}`,
        label: `${d.investmentTitle} — pay vendor for asset purchase`,
        amount: d.totalRaised,
        tag: 'Vendor Payment',
        onAction: () => openVendorModal(d),
      });
    }
    if (d.platformFeeAmount && !d.platformFeeExtractedAt) {
      actionItems.push({
        id: `fee-${d.id}`,
        label: `${d.investmentTitle} — extract profit share fee to general account`,
        amount: d.platformFeeAmount,
        tag: 'Profit Share Fee',
        onAction: () => openInvestmentFeeModal(d),
      });
    }
  });

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Trust Account</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Track all capital flows into and out of trust — vendor payments, fee extractions, and live reconciliation.
        </p>
      </div>

      {/* ─── Actions Required ─── */}
      {actionItems.length > 0 && (
        <div className="bg-navy-800 border border-gold-500/40 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-700 flex items-center gap-3">
            <span className="h-6 w-6 rounded-full bg-gold-500 text-navy-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {actionItems.length}
            </span>
            <h2 className="text-base font-semibold text-white">Actions Required</h2>
            <p className="text-xs text-gray-400">These transfers need to be recorded once completed in your bank</p>
          </div>
          <div className="divide-y divide-navy-700">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30 whitespace-nowrap">
                  {item.tag}
                </span>
                <p className="flex-1 text-sm text-gray-300">{item.label}</p>
                <span className="text-sm font-semibold text-white whitespace-nowrap">{fmt(item.amount)}</span>
                <button
                  onClick={item.onAction}
                  className="px-4 py-1.5 text-xs rounded-lg bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold transition-colors whitespace-nowrap"
                >
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Reconciliation ─── */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Reconciliation</h2>
          {hasDiscrepancy ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-900/40 text-red-400 border border-red-800">
              ⚠ Discrepancy Detected
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800">
              ✓ Balanced
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trust IN */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-400">Trust IN</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investor deposits</span>
                <span className="text-white font-medium">{fmt(summary.totalDeposited)}</span>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-green-400">Total IN</span>
              <span className="text-green-400">{fmt(summary.totalDeposited)}</span>
            </div>
          </div>

          {/* Trust OUT */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Trust OUT</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investor withdrawals</span>
                <span className="text-white font-medium">{fmt(summary.totalWithdrawn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Management fees charged</span>
                <span className="text-white font-medium">{fmt(summary.totalFeesCharged)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Vendor payments (asset purchases)</span>
                <span className="text-white font-medium">{fmt(summary.totalVendorDisbursed)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Mgmt fees swept to general account</span>
                <span className="text-white font-medium">{fmt(summary.totalMgmtFeesSwept)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investment profit share extracted</span>
                <span className="text-white font-medium">{fmt(summary.totalInvestmentFeesExtracted)}</span>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-red-400">Total OUT</span>
              <span className="text-red-400">
                {fmt(
                  summary.totalWithdrawn +
                  summary.totalFeesCharged +
                  summary.totalVendorDisbursed +
                  summary.totalMgmtFeesSwept +
                  summary.totalInvestmentFeesExtracted
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Balance comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-navy-600">
          <div className="bg-navy-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Expected Balance</p>
            <p className="text-xl font-bold text-white">{fmt(summary.expectedBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">IN minus OUT</p>
          </div>
          <div className="bg-navy-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Actual Balance</p>
            <p className="text-xl font-bold text-white">{fmt(summary.actualBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">Sum of all investor wallets</p>
          </div>
          <div className={`rounded-lg p-4 ${hasDiscrepancy ? 'bg-red-900/30 border border-red-800' : 'bg-green-900/20 border border-green-900'}`}>
            <p className="text-xs text-gray-400 mb-1">Discrepancy</p>
            <p className={`text-xl font-bold ${hasDiscrepancy ? 'text-red-400' : 'text-green-400'}`}>
              {summary.discrepancy > 0 ? '+' : ''}{fmt(summary.discrepancy)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{hasDiscrepancy ? 'Investigate immediately' : 'Trust is balanced'}</p>
          </div>
        </div>

        {/* Pending alerts */}
        {(summary.mgmtFeesAwaitingSweep > 0.01 || summary.pendingVendorDisbursement > 0 || summary.pendingInvestmentFeeExtraction > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-navy-600">
            {summary.mgmtFeesAwaitingSweep > 0.01 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400 text-lg">💰</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Fees Awaiting Sweep</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.mgmtFeesAwaitingSweep)} ready to transfer to general account</p>
                </div>
              </div>
            )}
            {summary.pendingVendorDisbursement > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400 text-lg">⏳</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Pending Vendor Payments</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.pendingVendorDisbursement)} committed to deals</p>
                </div>
              </div>
            )}
            {summary.pendingInvestmentFeeExtraction > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400 text-lg">📋</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Profit Share to Extract</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.pendingInvestmentFeeExtraction)} not yet extracted</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Per-Investment Disbursements ─── */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-white">Investment Disbursements</h2>
          <p className="text-xs text-gray-400 mt-0.5">Vendor payments and profit share fees per closed investment</p>
        </div>
        {disbursements.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No disbursement records yet. Created automatically when an investment is closed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-900/50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Investment</th>
                  <th className="px-4 py-3 text-right">Capital Raised</th>
                  <th className="px-4 py-3 text-center">Vendor Payment</th>
                  <th className="px-4 py-3 text-center">Profit Share Fee</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{d.investmentTitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Closed {fmtDate(d.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-white">{fmt(d.totalRaised)}</td>
                    <td className="px-4 py-4 text-center">
                      {d.disbursedAt ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">
                            ✓ {fmtDate(d.disbursedAt)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{fmt(d.vendorAmount!)}</p>
                          {d.disbursementRef && <p className="text-xs text-gray-600">Ref: {d.disbursementRef}</p>}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800">
                          ✗ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {d.platformFeeExtractedAt ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">
                            ✓ {fmtDate(d.platformFeeExtractedAt)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{fmt(d.platformFeeAmount!)}</p>
                          {d.feeRef && <p className="text-xs text-gray-600">Ref: {d.feeRef}</p>}
                        </div>
                      ) : d.platformFeeAmount ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400 border border-gold-500/40">
                          ⏳ Ready
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openVendorModal(d)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-white border border-navy-600 transition-colors"
                        >
                          {d.disbursedAt ? 'Edit' : 'Record Payment'}
                        </button>
                        <button
                          onClick={() => openInvestmentFeeModal(d)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-gold-400 border border-navy-600 transition-colors"
                        >
                          {d.platformFeeExtractedAt ? 'Edit' : 'Record Fee'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Fee Sweep History ─── */}
      {feeExtractions.length > 0 && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-navy-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Management Fee Sweep History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Recorded transfers of pooled fees from trust → general account</p>
            </div>
            <span className="text-sm font-semibold text-white">{fmt(feeExtractions.reduce((s, e) => s + e.amount, 0))} total</span>
          </div>
          <div className="divide-y divide-navy-700">
            {feeExtractions.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{fmt(e.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtDate(e.extractedAt)}
                    {e.bankRef && ` · Ref: ${e.bankRef}`}
                    {e.notes && ` · ${e.notes}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{e.recordedBy ?? '—'}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">✓ Swept</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-navy-700">
              <h3 className="text-lg font-semibold text-white">
                {modal.type === 'sweep' && 'Record Management Fee Sweep'}
                {modal.type === 'vendor' && 'Record Vendor Payment'}
                {modal.type === 'investmentFee' && 'Record Profit Share Fee Extraction'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {modal.type === 'sweep' && 'Record the bank transfer of pooled management fees to your general account'}
                {modal.type === 'vendor' && `Investment: ${modal.record.investmentTitle}`}
                {modal.type === 'investmentFee' && `Investment: ${modal.record.investmentTitle}`}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Amount (AUD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                />
                {modal.type === 'sweep' && summary.mgmtFeesAwaitingSweep > 0.01 && (
                  <p className="text-xs text-gray-500 mt-1">Uncollected fees: {fmt(summary.mgmtFeesAwaitingSweep)}</p>
                )}
                {modal.type === 'vendor' && (
                  <p className="text-xs text-gray-500 mt-1">Capital raised: {fmt(modal.record.totalRaised)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {modal.type === 'vendor' ? 'Payment Date' : 'Date Transferred'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Bank Reference / Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                  placeholder="e.g. TFR-20260401-001"
                />
              </div>
              {modal.type !== 'investmentFee' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500 resize-none"
                    placeholder={modal.type === 'vendor' ? 'Vendor name, invoice number…' : 'Optional notes…'}
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-navy-700 flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-300 border border-navy-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !amount || !date}
                className="px-4 py-2 text-sm rounded-lg bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
