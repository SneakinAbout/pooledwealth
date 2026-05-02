'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { Building2, Copy, CreditCard, RefreshCw, Repeat, X, ChevronDown } from 'lucide-react';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];
const FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
] as const;

interface BankDetails {
  bankName: string;
  bankAccountName: string;
  bankBSB: string;
  bankAccountNumber: string;
  bankSwift: string;
  minDepositAmount: number;
  maxDepositAmount: number;
}

interface RecurringSchedule {
  id: string;
  amount: number;
  frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
  nextExpectedDate: string;
  missedCount: number;
  status: string;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState(1000);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [depositCode, setDepositCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  // Recurring state
  const [schedule, setSchedule] = useState<RecurringSchedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState(1000);
  const [recurringFrequency, setRecurringFrequency] = useState<'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'>('MONTHLY');
  const [recurringStartDate, setRecurringStartDate] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [cancellingSchedule, setCancellingSchedule] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (!bankDetails) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => setBankDetails(d))
        .catch(() => {});
    }

    if (!depositCode) {
      setLoadingCode(true);
      fetch('/api/wallet/deposit-code')
        .then((r) => r.json())
        .then((d) => { if (d.depositCode) setDepositCode(d.depositCode); })
        .catch(() => {})
        .finally(() => setLoadingCode(false));
    }

    setLoadingSchedule(true);
    fetch('/api/wallet/recurring')
      .then((r) => r.json())
      .then((d) => { setSchedule(d.schedule); })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false));
  }, [isOpen]);

  const handleNotifyDeposit = async () => {
    if (amount < (bankDetails?.minDepositAmount ?? 10)) {
      toast.error(`Minimum deposit is $${bankDetails?.minDepositAmount ?? 10}`);
      return;
    }
    setNotifying(true);
    try {
      const res = await fetch('/api/wallet/deposit/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotified(true);
      toast.success('Deposit notification sent — we\'ll credit your wallet once the transfer arrives');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to notify deposit');
    } finally {
      setNotifying(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!recurringStartDate) { toast.error('Please select a start date'); return; }
    if (new Date(recurringStartDate) <= new Date()) { toast.error('Start date must be in the future'); return; }
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/wallet/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: recurringAmount, frequency: recurringFrequency, startDate: new Date(recurringStartDate).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchedule(data.schedule);
      setShowRecurringForm(false);
      toast.success('Recurring deposit schedule saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCancelSchedule = async () => {
    setCancellingSchedule(true);
    try {
      const res = await fetch('/api/wallet/recurring', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel');
      setSchedule(null);
      toast.success('Recurring schedule cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel schedule');
    } finally {
      setCancellingSchedule(false);
    }
  };

  const handleClose = () => {
    setNotified(false);
    setAmount(1000);
    setShowRecurringForm(false);
    setRecurringStartDate('');
    onClose();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const freqLabel = (f: string) =>
    f === 'WEEKLY' ? 'weekly' : f === 'FORTNIGHTLY' ? 'fortnightly' : 'monthly';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds" size="md">
      <div className="space-y-4">
        {/* Card payment — coming soon */}
        <div className="flex items-center gap-4 p-4 bg-[#F7F4EE] border border-[#E8E2D6] rounded-xl opacity-60 cursor-not-allowed">
          <div className="h-10 w-10 rounded-lg bg-[#E8E2D6] flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-[#8A7A60]" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-[#6A5A40] font-medium">Card Payment</p>
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-[#C9A84C]/15 text-[#8A7A60] px-2 py-0.5 rounded">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-[#8A7A60]">Online card payments are not yet available</p>
          </div>
        </div>

        {/* Bank Transfer */}
        <div>
          <p className="text-sm font-medium text-[#6A5A40] mb-3">
            <Building2 className="inline h-4 w-4 mr-1.5 text-[#1565C0]" />
            Bank Transfer
          </p>

          {/* Deposit code */}
          <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6A5A40]">Your deposit reference code</p>
                {loadingCode ? (
                  <div className="flex items-center gap-2 mt-1">
                    <RefreshCw className="h-3.5 w-3.5 text-[#8A7A60] animate-spin" />
                    <span className="text-sm text-[#8A7A60]">Loading…</span>
                  </div>
                ) : (
                  <p className="text-lg font-mono font-bold text-[#C9A84C] tracking-wide">{depositCode ?? '—'}</p>
                )}
              </div>
              {depositCode && (
                <button onClick={() => copy(depositCode, 'Deposit code')} className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-[#8A7A60] mt-1">
              Use this as the reference for <strong>every</strong> transfer — it never changes, perfect for recurring payments.
            </p>
          </div>

          {/* Bank details */}
          <div className="bg-[#E3F2FD] border border-[#1565C0]/20 rounded-xl p-4 space-y-3">
            {[
              { label: 'Bank', value: bankDetails?.bankName ?? '—' },
              { label: 'Account Name', value: bankDetails?.bankAccountName ?? '—' },
              { label: 'BSB', value: bankDetails?.bankBSB ?? '—' },
              { label: 'Account Number', value: bankDetails?.bankAccountNumber ?? '—' },
              { label: 'SWIFT / BIC', value: bankDetails?.bankSwift ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[#6A5A40]">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#1A1207] font-medium">{value}</span>
                  <button onClick={() => copy(value, label)} className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notify us */}
        <div className="border-t border-[#E8E2D6] pt-4">
          <p className="text-xs font-medium text-[#6A5A40] mb-2">
            Already transferred or about to? Let us know the amount so we can match it faster.
          </p>
          {notified ? (
            <div className="bg-[#E8F5E9] border border-[#2E7D32]/20 rounded-xl p-4 text-center">
              <p className="text-sm text-[#2E7D32] font-medium">Deposit logged — {formatCurrency(amount)}</p>
              <p className="text-xs text-[#6A5A40] mt-1">
                We&apos;ll credit your wallet once the transfer is confirmed (typically 1–2 business days).
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setNotified(false)}>
                Log another deposit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      amount === a
                        ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]'
                        : 'bg-white border-[#E8E2D6] text-[#6A5A40] hover:text-[#1A1207] hover:border-[#C9A84C]/40'
                    }`}
                  >
                    ${a.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input
                label="Transfer Amount (AUD)"
                type="number"
                min={bankDetails?.minDepositAmount ?? 10}
                max={bankDetails?.maxDepositAmount ?? 100000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                hint={`Minimum $${bankDetails?.minDepositAmount ?? 10} · Maximum $${(bankDetails?.maxDepositAmount ?? 100000).toLocaleString()}`}
              />
              <Button className="w-full" size="lg" onClick={handleNotifyDeposit} loading={notifying}>
                Notify Us of Transfer
              </Button>
            </div>
          )}
        </div>

        {/* ── Recurring deposit section ── */}
        <div className="border-t border-[#E8E2D6] pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-[#C9A84C]" />
              <p className="text-sm font-medium text-[#1A1207]">Recurring Deposit</p>
            </div>
            {!loadingSchedule && !schedule && !showRecurringForm && (
              <button
                onClick={() => setShowRecurringForm(true)}
                className="text-xs text-[#C9A84C] hover:text-[#A07830] font-medium flex items-center gap-1 transition-colors"
              >
                Set up <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>

          {loadingSchedule ? (
            <div className="flex items-center gap-2 text-xs text-[#8A7A60]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading schedule…
            </div>
          ) : schedule && schedule.status === 'ACTIVE' ? (
            /* Active schedule card */
            <div className="bg-[#E8F5E9] border border-[#2E7D32]/20 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2E7D32]">
                    {formatCurrency(schedule.amount)} · {freqLabel(schedule.frequency)}
                  </p>
                  <p className="text-xs text-[#6A5A40] mt-0.5">
                    Next expected:{' '}
                    {new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                      new Date(schedule.nextExpectedDate)
                    )}
                  </p>
                  {schedule.missedCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ {schedule.missedCount} missed deposit{schedule.missedCount !== 1 ? 's' : ''} — 1 more will cancel this schedule
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCancelSchedule}
                  disabled={cancellingSchedule}
                  className="text-[#8A7A60] hover:text-[#C62828] transition-colors ml-2 flex-shrink-0"
                  title="Cancel schedule"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#6A5A40] mt-2">
                Set up this exact amount as a recurring transfer in your bank app using reference <strong className="text-[#C9A84C]">{depositCode}</strong>.
                Auto-cancels after 2 consecutive missed transfers.
              </p>
              <button
                onClick={() => {
                  setRecurringAmount(schedule.amount);
                  setRecurringFrequency(schedule.frequency);
                  setShowRecurringForm(true);
                  setSchedule(null);
                }}
                className="text-xs text-[#6A5A40] hover:text-[#1A1207] underline mt-2 transition-colors"
              >
                Change schedule
              </button>
            </div>
          ) : schedule && schedule.status === 'CANCELLED' ? (
            <div className="bg-[#FFF3E0] border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Your previous schedule was cancelled after 2 missed deposits.{' '}
              <button onClick={() => setShowRecurringForm(true)} className="underline font-medium">
                Set up a new one
              </button>
            </div>
          ) : showRecurringForm ? (
            /* Setup form */
            <div className="bg-[#F7F4EE] border border-[#E8E2D6] rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">Transfer amount (AUD)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setRecurringAmount(a)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        recurringAmount === a
                          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]'
                          : 'bg-white border-[#E8E2D6] text-[#6A5A40] hover:border-[#C9A84C]/40'
                      }`}
                    >
                      ${a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A5A40] text-sm">$</span>
                  <input
                    type="number"
                    min={10}
                    value={recurringAmount}
                    onChange={(e) => setRecurringAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRecurringFrequency(value)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        recurringFrequency === value
                          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]'
                          : 'bg-white border-[#E8E2D6] text-[#6A5A40] hover:border-[#C9A84C]/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">
                  Date of first transfer
                  <span className="text-[#8A7A60] font-normal ml-1">— match the date in your bank app</span>
                </label>
                <input
                  type="date"
                  value={recurringStartDate}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setRecurringStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 bg-white"
                />
              </div>
              <p className="text-xs text-[#8A7A60]">
                Set up a matching recurring transfer in your bank app using reference <strong className="text-[#C9A84C]">{depositCode}</strong>.
                We&apos;ll track it and remind you if a transfer is missed. After 2 consecutive misses the schedule auto-cancels.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowRecurringForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSchedule}
                  loading={savingSchedule}
                  disabled={recurringAmount < 10 || !recurringStartDate}
                  className="flex-1"
                >
                  Save Schedule
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8A7A60]">
              Set up a recurring schedule and we&apos;ll track your transfers and remind you if one is missed.
            </p>
          )}
        </div>

        <p className="text-xs text-[#8A7A60] text-center">
          Funds typically appear within 1–2 business days after transfer is received.
        </p>

        <Button variant="ghost" className="w-full" onClick={handleClose}>Done</Button>
      </div>
    </Modal>
  );
}
