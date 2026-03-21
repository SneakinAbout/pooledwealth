'use client';

import { useState, useEffect } from 'react';
import { Landmark, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
}

interface BankInfo {
  hasBankAccount: boolean;
  bankAccountName: string | null;
  bankBsb: string | null;
  bankAccountNumber: string | null; // masked
}

export default function WithdrawModal({ isOpen, onClose, walletBalance }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingBank(true);
    fetch('/api/investor/profile')
      .then((r) => r.json())
      .then((d) => setBankInfo({
        hasBankAccount: d.hasBankAccount,
        bankAccountName: d.bankAccountName,
        bankBsb: d.bankBsb,
        bankAccountNumber: d.bankAccountNumber,
      }))
      .catch(() => {})
      .finally(() => setLoadingBank(false));
  }, [isOpen]);

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    if (num > walletBalance) { toast.error('Insufficient balance'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/investor/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Withdrawal failed'); return; }
      toast.success('Withdrawal request submitted');
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Withdrawal" size="sm">
      {loadingBank ? (
        <div className="h-24 flex items-center justify-center text-sm text-[#8A7A60]">Loading…</div>
      ) : !bankInfo?.hasBankAccount ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-[#FFF8E1] border border-[#FFECB3] rounded-xl">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#7B5800]">No bank account saved</p>
              <p className="text-xs text-[#7B5800] mt-0.5">
                You need to add your bank account details before requesting a withdrawal.
              </p>
            </div>
          </div>
          <Link href="/investor/settings" onClick={handleClose}>
            <Button className="w-full">Go to Settings</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Bank details */}
          <div className="flex items-start gap-3 p-4 bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl">
            <Landmark className="h-4 w-4 text-[#8A7A60] flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-[#1A1207]">{bankInfo.bankAccountName}</p>
              <p className="text-[#6A5A40]">BSB: {bankInfo.bankBsb}</p>
              <p className="text-[#6A5A40]">Account: {bankInfo.bankAccountNumber}</p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex justify-between text-sm">
            <span className="text-[#8A7A60]">Available balance</span>
            <span className="font-semibold text-[#2E7D32]">{formatCurrency(walletBalance)}</span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
              Amount (AUD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8A7A60] font-medium">$</span>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <p className="text-xs text-[#8A7A60]">
            Withdrawals are processed within 1–3 business days after admin approval. The amount will be deducted from your wallet immediately and refunded if rejected.
          </p>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || !amount}
            >
              Request Withdrawal
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
