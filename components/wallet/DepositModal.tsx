'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, CreditCard, Building2, Copy, ChevronRight } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

type Method = 'stripe' | 'bank';
type Step = 'method' | 'amount' | 'payment' | 'bank-details';

function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message ?? 'Payment failed');
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[#EDE6D6] rounded-lg p-4 text-center border border-[#E8E2D6]">
        <p className="text-[#6A5A40] text-sm">Depositing</p>
        <p className="text-3xl font-bold font-mono-val">{formatCurrency(amount)}</p>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Deposit {formatCurrency(amount)}
      </Button>
    </form>
  );
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('stripe');
  const [amount, setAmount] = useState(1000);
  const [clientSecret, setClientSecret] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<Step>('method');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  // Fetch live bank details when modal opens
  useEffect(() => {
    if (isOpen && !bankDetails) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => setBankDetails(d))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleMethodSelect = (m: Method) => {
    setMethod(m);
    setStep('amount');
  };

  const handleAmountSubmit = async () => {
    if (amount < 10) {
      toast.error('Minimum deposit is $10');
      return;
    }
    setLoading(true);
    try {
      if (method === 'stripe') {
        const res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setClientSecret(data.clientSecret);
        setStep('payment');
      } else {
        const res = await fetch('/api/wallet/deposit/bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setReference(data.reference);
        setStep('bank-details');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('method');
    setMethod('stripe');
    setClientSecret('');
    setReference('');
    setSuccess(false);
    setAmount(1000);
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds" size="md">
      {/* Success */}
      {success ? (
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-[#2E7D32] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1207] mb-2">Deposit Successful!</h3>
          <p className="text-[#6A5A40] mb-6">
            <span className="font-bold font-mono-val">{formatCurrency(amount)}</span> has been
            added to your wallet.
          </p>
          <Button className="w-full" onClick={handleClose}>Start Investing</Button>
        </div>

      /* Method selection */
      ) : step === 'method' ? (
        <div className="space-y-3">
          <p className="text-[#6A5A40] text-sm mb-4">Choose how you&apos;d like to deposit funds.</p>

          <button
            onClick={() => handleMethodSelect('stripe')}
            className="w-full flex items-center gap-4 p-4 bg-[#F7F4EE] border border-[#E8E2D6] hover:border-[#C9A84C]/40 rounded-xl transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#1A1207] font-medium">Card / Online Payment</p>
              <p className="text-xs text-[#6A5A40]">Pay instantly with credit or debit card via Stripe</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8A7A60] group-hover:text-[#C9A84C] transition-colors" />
          </button>

          <button
            onClick={() => handleMethodSelect('bank')}
            className="w-full flex items-center gap-4 p-4 bg-[#F7F4EE] border border-[#E8E2D6] hover:border-[#C9A84C]/40 rounded-xl transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-[#E3F2FD] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-[#1565C0]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#1A1207] font-medium">Bank Transfer</p>
              <p className="text-xs text-[#6A5A40]">Transfer directly from your bank — 1–2 business days</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8A7A60] group-hover:text-[#C9A84C] transition-colors" />
          </button>
        </div>

      /* Amount step */
      ) : step === 'amount' ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-[#6A5A40] mb-1">
            <button onClick={() => setStep('method')} className="hover:text-[#1A1207] transition-colors">
              ← Back
            </button>
            <span>·</span>
            <span>{method === 'stripe' ? 'Card Payment' : 'Bank Transfer'}</span>
          </div>

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
            label="Custom Amount (AUD)"
            type="number"
            min={10}
            max={100000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            hint="Minimum $10 · Maximum $100,000"
          />

          <Button className="w-full" size="lg" onClick={handleAmountSubmit} loading={loading}>
            {method === 'stripe' ? 'Continue to Payment' : 'Get Bank Details'}
          </Button>
        </div>

      /* Stripe payment */
      ) : step === 'payment' ? (
        clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#C9A84C' } } }}
          >
            <CheckoutForm amount={amount} onSuccess={() => setSuccess(true)} />
          </Elements>
        ) : null

      /* Bank details */
      ) : step === 'bank-details' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-[#6A5A40] mb-1">
            <button onClick={() => setStep('amount')} className="hover:text-[#1A1207] transition-colors">
              ← Back
            </button>
          </div>

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
                  <button
                    onClick={() => copyToClipboard(value, label)}
                    className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors"
                  >
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
              <button
                onClick={() => copyToClipboard(reference, 'Reference')}
                className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#8A7A60] mt-1">Include this reference in your transfer description</p>
          </div>

          <p className="text-xs text-[#8A7A60] text-center">
            Funds typically appear within 1–2 business days after transfer is received.
          </p>

          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
