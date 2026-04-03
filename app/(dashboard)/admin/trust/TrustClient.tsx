'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

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
  totalVendorDisbursed: number;
  totalFeesExtracted: number;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  pendingVendorDisbursement: number;
  pendingFeeExtraction: number;
};

type Props = {
  summary: Summary;
  disbursements: DisbursementRecord[];
};

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

type ModalState = {
  record: DisbursementRecord;
  mode: 'vendor' | 'fee';
} | null;

export default function TrustClient({ summary: initialSummary, disbursements: initialDisbursements }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [disbursements, setDisbursements] = useState(initialDisbursements);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);

  // Form state for vendor payment modal
  const [vendorAmount, setVendorAmount] = useState('');
  const [disbursedAt, setDisbursedAt] = useState('');
  const [disbursementRef, setDisbursementRef] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  // Form state for fee extraction modal
  const [feeAmount, setFeeAmount] = useState('');
  const [feeExtractedAt, setFeeExtractedAt] = useState('');
  const [feeRef, setFeeRef] = useState('');

  function openVendorModal(record: DisbursementRecord) {
    setVendorAmount(record.vendorAmount?.toString() ?? record.totalRaised.toFixed(2));
    setDisbursedAt(record.disbursedAt ? record.disbursedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setDisbursementRef(record.disbursementRef ?? '');
    setVendorNotes(record.notes ?? '');
    setModal({ record, mode: 'vendor' });
  }

  function openFeeModal(record: DisbursementRecord) {
    setFeeAmount(record.platformFeeAmount?.toString() ?? '');
    setFeeExtractedAt(record.platformFeeExtractedAt ? record.platformFeeExtractedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFeeRef(record.feeRef ?? '');
    setModal({ record, mode: 'fee' });
  }

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      const body =
        modal.mode === 'vendor'
          ? {
              vendorAmount: parseFloat(vendorAmount),
              disbursedAt: new Date(disbursedAt).toISOString(),
              disbursementRef: disbursementRef || undefined,
              notes: vendorNotes || undefined,
            }
          : {
              platformFeeAmount: parseFloat(feeAmount),
              platformFeeExtractedAt: new Date(feeExtractedAt).toISOString(),
              feeRef: feeRef || undefined,
            };

      const res = await fetch(`/api/admin/trust/disbursements/${modal.record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }

      // Refresh data from API
      const recon = await fetch('/api/admin/trust/reconciliation');
      const data = await recon.json();
      setSummary(data.summary);
      setDisbursements(data.disbursements);

      toast.success(modal.mode === 'vendor' ? 'Vendor payment recorded' : 'Fee extraction recorded');
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const hasDiscrepancy = Math.abs(summary.discrepancy) > 0.01;
  const pendingCount = disbursements.filter((d) => !d.disbursedAt).length;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Trust Account</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Track all capital flows into and out of trust — vendor payments, fee extractions, and live reconciliation.
        </p>
      </div>

      {/* Reconciliation Summary */}
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

        {/* IN / OUT flow */}
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
                <span className="text-gray-400">Platform fees extracted to general account</span>
                <span className="text-white font-medium">{fmt(summary.totalFeesExtracted)}</span>
              </div>
            </div>
            <div className="border-t border-navy-600 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-red-400">Total OUT</span>
              <span className="text-red-400">
                {fmt(summary.totalWithdrawn + summary.totalFeesCharged + summary.totalVendorDisbursed + summary.totalFeesExtracted)}
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
              {hasDiscrepancy ? (summary.discrepancy > 0 ? '+' : '') : ''}{fmt(summary.discrepancy)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{hasDiscrepancy ? 'Investigate immediately' : 'Trust is balanced'}</p>
          </div>
        </div>

        {/* Pending actions */}
        {(summary.pendingVendorDisbursement > 0 || summary.pendingFeeExtraction > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-navy-600">
            {summary.pendingVendorDisbursement > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400 text-lg">⏳</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Pending Vendor Payments</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmt(summary.pendingVendorDisbursement)} committed but not yet paid to vendors
                  </p>
                </div>
              </div>
            )}
            {summary.pendingFeeExtraction > 0 && (
              <div className="flex items-start gap-3 bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
                <span className="text-gold-400 text-lg">💰</span>
                <div>
                  <p className="text-sm font-medium text-gold-400">Pending Fee Extractions</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmt(summary.pendingFeeExtraction)} in platform fees ready to extract
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disbursement Records */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-navy-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Disbursement Records</h2>
            <p className="text-xs text-gray-400 mt-0.5">One record per closed investment — track vendor payments and fee extractions</p>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-400 border border-gold-500/40">
              {pendingCount} pending
            </span>
          )}
        </div>

        {disbursements.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No disbursement records yet. They are created automatically when an investment is closed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-900/50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Investment</th>
                  <th className="px-4 py-3 text-right">Capital Raised</th>
                  <th className="px-4 py-3 text-center">Vendor Payment</th>
                  <th className="px-4 py-3 text-center">Fee Extraction</th>
                  <th className="px-4 py-3 text-left">Recorded By</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{d.investmentTitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Closed {fmtDate(d.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-white">
                      {fmt(d.totalRaised)}
                    </td>

                    {/* Vendor payment status */}
                    <td className="px-4 py-4 text-center">
                      {d.disbursedAt ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">
                            ✓ Paid {fmtDate(d.disbursedAt)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{fmt(d.vendorAmount!)}</p>
                          {d.disbursementRef && (
                            <p className="text-xs text-gray-600">Ref: {d.disbursementRef}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800">
                          ✗ Pending
                        </span>
                      )}
                    </td>

                    {/* Fee extraction status */}
                    <td className="px-4 py-4 text-center">
                      {d.platformFeeExtractedAt ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">
                            ✓ Extracted {fmtDate(d.platformFeeExtractedAt)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{fmt(d.platformFeeAmount!)}</p>
                          {d.feeRef && (
                            <p className="text-xs text-gray-600">Ref: {d.feeRef}</p>
                          )}
                        </div>
                      ) : d.platformFeeAmount ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400 border border-gold-500/40">
                          ⏳ Ready to extract
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">Not set</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-400">
                      {d.recordedBy ?? '—'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openVendorModal(d)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-white border border-navy-600 transition-colors"
                        >
                          {d.disbursedAt ? 'Edit Vendor' : 'Record Payment'}
                        </button>
                        <button
                          onClick={() => openFeeModal(d)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-navy-700 hover:bg-navy-600 text-gold-400 border border-navy-600 transition-colors"
                        >
                          {d.platformFeeExtractedAt ? 'Edit Fee' : 'Record Fee'}
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-navy-700">
              <h3 className="text-lg font-semibold text-white">
                {modal.mode === 'vendor' ? 'Record Vendor Payment' : 'Record Fee Extraction'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{modal.record.investmentTitle}</p>
            </div>

            <div className="p-5 space-y-4">
              {modal.mode === 'vendor' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Amount Paid to Vendor (AUD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={vendorAmount}
                      onChange={(e) => setVendorAmount(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                      placeholder={modal.record.totalRaised.toFixed(2)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Capital raised: {fmt(modal.record.totalRaised)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={disbursedAt}
                      onChange={(e) => setDisbursedAt(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Bank Reference / Transaction ID (optional)
                    </label>
                    <input
                      type="text"
                      value={disbursementRef}
                      onChange={(e) => setDisbursementRef(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                      placeholder="e.g. TFR-20260401-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Notes (optional)
                    </label>
                    <textarea
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500 resize-none"
                      placeholder="Vendor name, invoice number, etc."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Platform Fee Amount (AUD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                      placeholder="e.g. 500.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Amount transferred from trust → your general account
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Date Extracted
                    </label>
                    <input
                      type="date"
                      value={feeExtractedAt}
                      onChange={(e) => setFeeExtractedAt(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Bank Reference (optional)
                    </label>
                    <input
                      type="text"
                      value={feeRef}
                      onChange={(e) => setFeeRef(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                      placeholder="e.g. FEE-20260401-001"
                    />
                  </div>
                </>
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
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
