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

type DistributionRecord = {
  id: string;
  investmentId: string;
  investmentTitle: string;
  totalAmount: number;
  profitShareDeducted: number;
  netAmount: number;
  distributedAt: string;
  notes: string | null;
  saleProceeds: number | null;
  saleProceedsRef: string | null;
  profitShareSweptAt: string | null;
  profitShareSweptRef: string | null;
  profitShareSweptBy: string | null;
};

type DisbursementRecord = {
  id: string;
  investmentId: string;
  investmentTitle: string;
  totalRaised: number;
  vendorAmount: number | null;
  disbursedAt: string | null;
  disbursementRef: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalDeposited: number;
  totalSaleProceeds: number;
  totalWithdrawn: number;
  totalMgmtFeesCharged: number;
  totalMgmtFeesSwept: number;
  mgmtFeesAwaitingSweep: number;
  totalVendorDisbursed: number;
  totalProfitShareSwept: number;
  profitShareAwaitingSweep: number;
  committedCapital: number;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  pendingVendorDisbursement: number;
};

type Props = {
  summary: Summary;
  feeExtractions: FeeExtraction[];
  distributions: DistributionRecord[];
  disbursements: DisbursementRecord[];
};

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

type ModalType =
  | { type: 'mgmtSweep' }
  | { type: 'vendor'; record: DisbursementRecord }
  | { type: 'saleProceeds'; dist: DistributionRecord }
  | { type: 'profitShareSweep'; dist: DistributionRecord }
  | null;

export default function TrustClient({
  summary: initialSummary,
  feeExtractions: initialExtractions,
  distributions: initialDistributions,
  disbursements: initialDisbursements,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [feeExtractions, setFeeExtractions] = useState(initialExtractions);
  const [distributions, setDistributions] = useState(initialDistributions);
  const [disbursements, setDisbursements] = useState(initialDisbursements);
  const [modal, setModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');

  function openMgmtSweepModal() {
    setAmount(summary.mgmtFeesAwaitingSweep > 0.01 ? summary.mgmtFeesAwaitingSweep.toFixed(2) : '');
    setDate(new Date().toISOString().slice(0, 10));
    setBankRef('');
    setNotes('');
    setModal({ type: 'mgmtSweep' });
  }

  function openVendorModal(record: DisbursementRecord) {
    setAmount(record.vendorAmount?.toFixed(2) ?? record.totalRaised.toFixed(2));
    setDate(record.disbursedAt ? record.disbursedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setBankRef(record.disbursementRef ?? '');
    setNotes(record.notes ?? '');
    setModal({ type: 'vendor', record });
  }

  function openSaleProceedsModal(dist: DistributionRecord) {
    setAmount(dist.saleProceeds?.toFixed(2) ?? dist.totalAmount.toFixed(2));
    setDate(dist.distributedAt.slice(0, 10));
    setBankRef(dist.saleProceedsRef ?? '');
    setNotes('');
    setModal({ type: 'saleProceeds', dist });
  }

  function openProfitShareSweepModal(dist: DistributionRecord) {
    setAmount(dist.profitShareDeducted.toFixed(2));
    setDate(new Date().toISOString().slice(0, 10));
    setBankRef(dist.profitShareSweptRef ?? '');
    setNotes('');
    setModal({ type: 'profitShareSweep', dist });
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.type === 'mgmtSweep') {
        const res = await fetch('/api/admin/trust/fee-extractions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), extractedAt: new Date().toISOString(), bankRef: bankRef || undefined, notes: notes || undefined }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
        toast.success('Management fee sweep recorded');
      } else if (modal.type === 'vendor') {
        const res = await fetch(`/api/admin/trust/disbursements/${modal.record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorAmount: parseFloat(amount), disbursedAt: new Date(date).toISOString(), disbursementRef: bankRef || undefined, notes: notes || undefined }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
        toast.success('Vendor payment recorded');
      } else if (modal.type === 'saleProceeds') {
        const res = await fetch(`/api/admin/distributions/${modal.dist.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleProceeds: parseFloat(amount), saleProceedsRef: bankRef || undefined }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
        toast.success('Sale proceeds recorded');
      } else if (modal.type === 'profitShareSweep') {
        const res = await fetch(`/api/admin/distributions/${modal.dist.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profitShareSweptAt: new Date(date).toISOString(), profitShareSweptRef: bankRef || undefined }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
        toast.success('Profit share sweep recorded');
      }

      const recon = await fetch('/api/admin/trust/reconciliation');
      const data = await recon.json();
      setSummary(data.summary);
      setFeeExtractions(data.feeExtractions ?? []);
      setDistributions(data.distributions ?? []);
      setDisbursements(data.disbursements ?? []);
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const hasDiscrepancy = Math.abs(summary.discrepancy) > 0.01;

  // Build action items
  const actionItems: { id: string; label: string; sublabel: string; amount: number; tag: string; onAction: () => void }[] = [];

  if (summary.mgmtFeesAwaitingSweep > 0.01) {
    const lastSweep = feeExtractions.length > 0 ? fmtDate(feeExtractions[0].extractedAt) : null;
    actionItems.push({
      id: 'mgmt-sweep',
      label: 'Transfer management fees to general account',
      sublabel: lastSweep
        ? `Fees charged since last sweep on ${lastSweep}`
        : 'Pooled monthly fees charged from investor wallets',
      amount: summary.mgmtFeesAwaitingSweep,
      tag: 'Fee Sweep',
      onAction: openMgmtSweepModal,
    });
  }

  disbursements.forEach((d) => {
    if (!d.disbursedAt) {
      actionItems.push({
        id: `vendor-${d.id}`,
        label: `${d.investmentTitle} — pay vendor for asset purchase`,
        sublabel: 'Trust → vendor bank account',
        amount: d.totalRaised,
        tag: 'Vendor Payment',
        onAction: () => openVendorModal(d),
      });
    }
  });

  distributions.forEach((d) => {
    if (!d.saleProceeds) {
      actionItems.push({
        id: `proceeds-${d.id}`,
        label: `${d.investmentTitle} — record sale proceeds received`,
        sublabel: `Distribution run ${fmtDate(d.distributedAt)} · confirm buyer paid into trust`,
        amount: d.totalAmount,
        tag: 'Sale Proceeds IN',
        onAction: () => openSaleProceedsModal(d),
      });
    }
    if (d.profitShareDeducted > 0 && !d.profitShareSweptAt) {
      actionItems.push({
        id: `profit-${d.id}`,
        label: `${d.investmentTitle} — sweep profit share to general account`,
        sublabel: `From distribution on ${fmtDate(d.distributedAt)}`,
        amount: d.profitShareDeducted,
        tag: 'Profit Share Sweep',
        onAction: () => openProfitShareSweepModal(d),
      });
    }
  });

  const modalTitle = {
    mgmtSweep: 'Record Management Fee Sweep',
    vendor: 'Record Vendor Payment',
    saleProceeds: 'Record Asset Sale Proceeds',
    profitShareSweep: 'Record Profit Share Sweep',
  }[modal?.type ?? 'mgmtSweep'];

  const modalSubtitle = modal?.type === 'vendor'
    ? `Investment: ${modal.record.investmentTitle}`
    : modal?.type === 'saleProceeds'
    ? `Investment: ${modal.dist.investmentTitle} — buyer paid into trust account`
    : modal?.type === 'profitShareSweep'
    ? `Investment: ${modal.dist.investmentTitle} — transfer profit share to general account`
    : 'Transfer pooled management fees from trust to general account';

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trust Account</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Track all capital flows into and out of trust — vendor payments, sale proceeds, profit share, and live reconciliation.
        </p>
      </div>

      {/* Actions Required */}
      {actionItems.length > 0 && (
        <div className="bg-navy-800 border border-gold-500/40 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-700 flex items-center gap-3">
            <span className="h-6 w-6 rounded-full bg-gold-500 text-navy-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {actionItems.length}
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Actions Required</h2>
              <p className="text-xs text-gray-400">Record these once the actual bank transfers are complete</p>
            </div>
          </div>
          <div className="divide-y divide-navy-700">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30 whitespace-nowrap flex-shrink-0">
                  {item.tag}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sublabel}</p>
                </div>
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

      {/* Reconciliation */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Reconciliation</h2>
          {hasDiscrepancy ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-900/40 text-red-400 border border-red-800">⚠ Discrepancy Detected</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800">✓ Balanced</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Physical trust bank flows IN */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-400">Physical Trust IN</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investor deposits</span>
                <span className="text-white font-medium">{fmt(summary.totalDeposited)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Asset sale proceeds (from buyers)</span>
                <span className="text-white font-medium">{fmt(summary.totalSaleProceeds)}</span>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-green-400">Total IN</span>
              <span className="text-green-400">{fmt(summary.totalDeposited + summary.totalSaleProceeds)}</span>
            </div>
          </div>

          {/* Physical trust bank flows OUT */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Physical Trust OUT</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investor withdrawals</span>
                <span className="text-white font-medium">{fmt(summary.totalWithdrawn)}</span>
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
                <span className="text-gray-400">Profit share swept to general account</span>
                <span className="text-white font-medium">{fmt(summary.totalProfitShareSwept)}</span>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-red-400">Total OUT</span>
              <span className="text-red-400">
                {fmt(summary.totalWithdrawn + summary.totalVendorDisbursed + summary.totalMgmtFeesSwept + summary.totalProfitShareSwept)}
              </span>
            </div>
          </div>
        </div>

        {/* Actual balance breakdown */}
        <div className="pt-4 border-t border-navy-600 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Actual Balance Breakdown</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-navy-700/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Investor Wallets</p>
              <p className="text-sm font-semibold text-white">{fmt(summary.actualBalance - summary.committedCapital - (summary.totalMgmtFeesCharged - summary.totalMgmtFeesSwept) - summary.profitShareAwaitingSweep)}</p>
            </div>
            <div className="bg-navy-700/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Committed to Investments</p>
              <p className="text-sm font-semibold text-white">{fmt(summary.committedCapital)}</p>
            </div>
            <div className="bg-navy-700/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Mgmt Fees in Trust</p>
              <p className="text-sm font-semibold text-white">{fmt(Math.max(0, summary.totalMgmtFeesCharged - summary.totalMgmtFeesSwept))}</p>
            </div>
            <div className="bg-navy-700/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Profit Share in Trust</p>
              <p className="text-sm font-semibold text-white">{fmt(summary.profitShareAwaitingSweep)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-navy-600">
          <div className="bg-navy-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Expected Balance</p>
            <p className="text-xl font-bold text-white">{fmt(summary.expectedBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">IN minus OUT</p>
          </div>
          <div className="bg-navy-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Actual Balance</p>
            <p className="text-xl font-bold text-white">{fmt(summary.actualBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">Sum of investor wallets</p>
          </div>
          <div className={`rounded-lg p-4 ${hasDiscrepancy ? 'bg-red-900/30 border border-red-800' : 'bg-green-900/20 border border-green-900'}`}>
            <p className="text-xs text-gray-400 mb-1">Discrepancy</p>
            <p className={`text-xl font-bold ${hasDiscrepancy ? 'text-red-400' : 'text-green-400'}`}>
              {summary.discrepancy > 0 ? '+' : ''}{fmt(summary.discrepancy)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{hasDiscrepancy ? 'Investigate immediately' : 'Trust is balanced'}</p>
          </div>
        </div>

        {(summary.mgmtFeesAwaitingSweep > 0.01 || summary.profitShareAwaitingSweep > 0 || summary.pendingVendorDisbursement > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-navy-600">
            {summary.mgmtFeesAwaitingSweep > 0.01 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400">💰</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Mgmt Fees Awaiting Sweep</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.mgmtFeesAwaitingSweep)}</p>
                </div>
              </div>
            )}
            {summary.profitShareAwaitingSweep > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400">📋</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Profit Share Awaiting Sweep</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.profitShareAwaitingSweep)}</p>
                </div>
              </div>
            )}
            {summary.pendingVendorDisbursement > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400">⏳</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Pending Vendor Payments</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.pendingVendorDisbursement)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Distributions */}
      {distributions.length > 0 && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-navy-700">
            <h2 className="text-lg font-semibold text-white">Distributions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track asset sale proceeds received and profit share sweeps per distribution</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-900/50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Investment / Date</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Profit Share</th>
                  <th className="px-4 py-3 text-center">Sale Proceeds IN</th>
                  <th className="px-4 py-3 text-center">Profit Share Swept</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{d.investmentTitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDate(d.distributedAt)}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-white">{fmt(d.totalAmount)}</td>
                    <td className="px-4 py-4 text-right text-gold-400 font-medium">{fmt(d.profitShareDeducted)}</td>
                    <td className="px-4 py-4 text-center">
                      {d.saleProceeds ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">✓ {fmt(d.saleProceeds)}</span>
                          {d.saleProceedsRef && <p className="text-xs text-gray-600 mt-1">Ref: {d.saleProceedsRef}</p>}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800">✗ Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {d.profitShareDeducted === 0 ? (
                        <span className="text-xs text-gray-600">No profit share</span>
                      ) : d.profitShareSweptAt ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">✓ {fmtDate(d.profitShareSweptAt)}</span>
                          {d.profitShareSweptRef && <p className="text-xs text-gray-600 mt-1">Ref: {d.profitShareSweptRef}</p>}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400 border border-gold-500/40">⏳ Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openSaleProceedsModal(d)} className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-white border border-navy-600 transition-colors whitespace-nowrap">
                          {d.saleProceeds ? 'Edit Proceeds' : 'Record Proceeds'}
                        </button>
                        {d.profitShareDeducted > 0 && (
                          <button onClick={() => openProfitShareSweepModal(d)} className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-gold-400 border border-navy-600 transition-colors whitespace-nowrap">
                            {d.profitShareSweptAt ? 'Edit Sweep' : 'Record Sweep'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investment Disbursements (vendor payments) */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-white">Investment Disbursements</h2>
          <p className="text-xs text-gray-400 mt-0.5">Vendor payments when acquiring assets after a round closes</p>
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
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">✓ {fmtDate(d.disbursedAt)}</span>
                          <p className="text-xs text-gray-500 mt-1">{fmt(d.vendorAmount!)}</p>
                          {d.disbursementRef && <p className="text-xs text-gray-600">Ref: {d.disbursementRef}</p>}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800">✗ Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => openVendorModal(d)} className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-white border border-navy-600 transition-colors">
                        {d.disbursedAt ? 'Edit' : 'Record Payment'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mgmt Fee Sweep History */}
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-navy-700">
              <h3 className="text-lg font-semibold text-white">{modalTitle}</h3>
              <p className="text-xs text-gray-400 mt-1">{modalSubtitle}</p>
            </div>
            <div className="p-5 space-y-4">
              {modal.type !== 'profitShareSweep' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount (AUD)</label>
                  <input
                    type="number" step="0.01" min="0" value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                  />
                  {modal.type === 'saleProceeds' && (
                    <p className="text-xs text-gray-500 mt-1">Gross distribution amount was {fmt(modal.dist.totalAmount)}</p>
                  )}
                  {modal.type === 'mgmtSweep' && summary.mgmtFeesAwaitingSweep > 0.01 && (
                    <p className="text-xs text-gray-500 mt-1">Uncollected: {fmt(summary.mgmtFeesAwaitingSweep)}</p>
                  )}
                </div>
              )}
              {modal.type === 'profitShareSweep' && (
                <div className="bg-navy-700/50 rounded-lg p-3 text-sm">
                  <p className="text-gray-400">Profit share amount</p>
                  <p className="text-white font-semibold text-lg mt-0.5">{fmt(modal.dist.profitShareDeducted)}</p>
                  <p className="text-xs text-gray-500 mt-1">This is the fixed amount from the distribution calculation</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {modal.type === 'saleProceeds' ? 'Date Received' : 'Date Transferred'}
                </label>
                <input
                  type="date" value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Bank Reference (optional)</label>
                <input
                  type="text" value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="e.g. TFR-20260401-001"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
              {modal.type === 'mgmtSweep' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500 resize-none"
                  />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-navy-700 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-300 border border-navy-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (modal.type !== 'profitShareSweep' && !amount) || !date}
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
