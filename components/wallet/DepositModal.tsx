'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { Building2, Copy, CreditCard } from 'lucide-react';

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
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'amount' | 'bank-details'>('amount');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useEffect(() => {
    if (isOpen && !bankDetails) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => setBankDetails(d))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleAmountSubmit = async () => {
    if (amount < 10) { toast.error('Minimum deposit is $10'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReference(data.reference);
      setStep('bank-details');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('amount');
    setReference('');
    setAmount(1000);
    onClose();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds" size="md">

      {step === 'amount' ? (
        <div className="space-y-5">
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

          {/* Amount */}
          <div>
            <p className="text-sm font-medium text-[#6A5A40] mb-3">
              <Building2 className="inline h-4 w-4 mr-1.5 text-[#1565C0]" />
              Bank Transfer — select amount
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
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
              label="Custom Amount (AUD)"
              type="number"
              min={10}
              max={100000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              hint="Minimum $10 · Maximum $100,000"
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleAmountSubmit} loading={loading}>
            Get Bank Details
          </Button>
        </div>

      ) : (
        <div className="space-y-4">
          <button onClick={() => setStep('amount')} className="text-sm text-[#6A5A40] hover:text-[#1A1207] transition-colors">
            ← Back
          </button>

          <div className="bg-[#EDE6D6] rounded-lg p-4 text-center border border-[#E8E2D6]">
            <p className="text-[#6A5A40] text-sm">Transfer amount</p>
            <p className="text-3xl font-bold font-mono-val">{formatCurrency(amount)}</p>
          </div>

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

          <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6A5A40]">Your unique reference</p>
                <p className="text-sm font-mono font-semibold text-[#C9A84C]">{reference}</p>
              </div>
              <button onClick={() => copy(reference, 'Reference')} className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#8A7A60] mt-1">Include this reference in your transfer description</p>
          </div>

          <p className="text-xs text-[#8A7A60] text-center">
            Funds typically appear within 1–2 business days after transfer is received.
          </p>

          <Button variant="ghost" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
