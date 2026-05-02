'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { Building2, Copy, CreditCard, RefreshCw } from 'lucide-react';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

interface BankDetails {
  bankName: string;
  bankAccountName: string;
  bankBSB: string;
  bankAccountNumber: string;
  bankSwift: string;
  minDepositAmount: number;
  maxDepositAmount: number;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [depositCode, setDepositCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

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
        .then((d) => {
          if (d.depositCode) setDepositCode(d.depositCode);
        })
        .catch(() => {})
        .finally(() => setLoadingCode(false));
    }
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

  const handleClose = () => {
    setNotified(false);
    setAmount(1000);
    onClose();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

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

        {/* Bank Transfer section */}
        <div>
          <p className="text-sm font-medium text-[#6A5A40] mb-3">
            <Building2 className="inline h-4 w-4 mr-1.5 text-[#1565C0]" />
            Bank Transfer
          </p>

          {/* Your deposit code — always visible */}
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
              Use this code as the reference/description for <strong>every</strong> bank transfer. It stays the same — perfect for recurring deposits.
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

        {/* Notify us section */}
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

        <p className="text-xs text-[#8A7A60] text-center">
          Funds typically appear within 1–2 business days after transfer is received.
        </p>

        <Button variant="ghost" className="w-full" onClick={handleClose}>Done</Button>
      </div>
    </Modal>
  );
}
