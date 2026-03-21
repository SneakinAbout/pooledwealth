'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DepositModal from '@/components/wallet/DepositModal';
import { formatCurrency } from '@/lib/utils';
import { generateSupplementText } from '@/lib/supplementText';
import { AlertCircle, CheckCircle, Wallet, ChevronDown, FileText } from 'lucide-react';

interface PlatformSettings {
  managementFeePercent: number;
  profitSharePercent: number;
}

interface Investment {
  id: string;
  title: string;
  pricePerUnit: number;
  minimumUnits: number;
  availableUnits: number;
  totalUnits: number;
  endDate: string;
  edition?: string | null;
  grade?: string | null;
  gradingCompany?: string | null;
  certNumber?: string | null;
  acquisitionPrice?: number | null;
  acquisitionDate?: string | null;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
  settings: PlatformSettings;
}

type Step = 'quantity' | 'sign' | 'success';

export default function PurchaseModal({ isOpen, onClose, investment, settings }: PurchaseModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('quantity');
  const [units, setUnits] = useState(investment.minimumUnits);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [fullName, setFullName] = useState('');
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalCost = units * investment.pricePerUnit;
  const hasEnoughFunds = walletBalance !== null && walletBalance >= totalCost;
  const ownershipPct = (units / investment.totalUnits) * 100;

  useEffect(() => {
    if (isOpen) {
      fetch('/api/wallet')
        .then((r) => r.json())
        .then((d) => setWalletBalance(d.balance ?? 0))
        .catch(() => setWalletBalance(0));
    }
  }, [isOpen, showDeposit]);

  // Reset scroll state when entering sign step
  useEffect(() => {
    if (step === 'sign') {
      setScrolledToBottom(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0 });
      }, 50);
    }
  }, [step]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const supplementText = generateSupplementText({
    assetName: investment.title,
    edition: investment.edition,
    grade: investment.grade,
    gradingCompany: investment.gradingCompany,
    certNumber: investment.certNumber,
    acquisitionDate: investment.acquisitionDate,
    acquisitionPrice: investment.acquisitionPrice,
    totalShares: investment.totalUnits,
    sharesPurchased: units,
    sharePrice: investment.pricePerUnit,
    ownershipPercentage: ownershipPct,
    roundCloseDate: investment.endDate,
    coOwnerName: '[YOUR FULL LEGAL NAME]',
  });

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investments/${investment.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units, fullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresAgreement) {
          toast.error('Please sign the Master Agreement before investing.');
          router.push('/investor/agreement');
          return;
        }
        throw new Error(data.error || 'Purchase failed');
      }

      setStep('success');
      setWalletBalance((prev) => (prev !== null ? prev - totalCost : null));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('quantity');
    setUnits(investment.minimumUnits);
    setFullName('');
    setScrolledToBottom(false);
    onClose();
  };

  // ── Step 3: Success ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Confirmed" size="sm">
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-[#2E7D32] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1207] mb-2">Investment Confirmed!</h3>
          <p className="text-[#6A5A40] text-sm mb-1">
            You purchased <span className="text-[#1A1207] font-medium">{units} shares</span> of{' '}
            <span className="text-[#1A1207] font-medium">{investment.title}</span>
          </p>
          <p className="font-mono-val text-xl mb-2">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-[#6A5A40] mb-6">
            Your Co-Ownership Supplement has been signed and saved. View it anytime under{' '}
            <strong>Settings → My Documents</strong>.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Continue Browsing
            </Button>
            <Button className="flex-1" onClick={() => { router.push('/investor/portfolio'); handleClose(); }}>
              View Portfolio
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Step 2: Sign Supplement ─────────────────────────────────────────────────
  if (step === 'sign') {
    const canConfirm = scrolledToBottom && fullName.trim().length >= 2;
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Review & Sign Co-Ownership Supplement" size="xl">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#E3F2FD] border border-[#1565C0]/20 rounded-lg">
            <FileText className="h-4 w-4 text-[#1565C0] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1565C0]">
              Read the full supplement below before signing. Your electronic signature is legally binding.
            </p>
          </div>

          {/* Supplement document */}
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-[380px] overflow-y-auto border border-[#E8E2D6] rounded-xl bg-white p-5 text-sm text-[#1A1207] leading-relaxed whitespace-pre-line font-serif"
            >
              {supplementText}
            </div>
            {!scrolledToBottom && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-[#E8E2D6] rounded-full px-4 py-2 shadow-sm pointer-events-none animate-bounce">
                <ChevronDown className="h-3.5 w-3.5 text-[#6A5A40]" />
                <span className="text-xs text-[#6A5A40]">Scroll to read the full supplement</span>
              </div>
            )}
          </div>

          {/* Signature section */}
          <div
            className={`space-y-3 transition-opacity duration-300 ${
              scrolledToBottom ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="border-t border-[#E8E2D6] pt-4">
              <p className="text-sm font-semibold text-[#1A1207] mb-1">Electronic Signature</p>
              <p className="text-xs text-[#6A5A40] mb-3">
                By typing your full legal name you confirm you have read and agree to this supplement.
              </p>
              <Input
                label="Full Legal Name"
                placeholder="Type your full legal name exactly"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="bg-[#EDE6D6] rounded-lg p-3 text-xs space-y-1 border border-[#E8E2D6]">
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">Shares purchasing</span>
                <span className="font-medium">{units.toLocaleString()} of {investment.totalUnits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">Ownership interest</span>
                <span className="font-medium">{ownershipPct.toFixed(4)}%</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-[#E8E2D6]">
                <span className="text-[#1A1207]">Total cost</span>
                <span className="font-mono-val">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('quantity')}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handlePurchase}
              loading={loading}
              disabled={!canConfirm}
            >
              Confirm Purchase &amp; Sign
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Step 1: Quantity ────────────────────────────────────────────────────────
  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Buy Shares" size="md">
        <div className="space-y-5">
          {/* Wallet balance */}
          <div className="flex items-center justify-between p-3 bg-[#EDE6D6] rounded-lg border border-[#E8E2D6]">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#C9A84C]" />
              <span className="text-sm text-[#6A5A40]">Wallet Balance</span>
            </div>
            <div className="text-right">
              <span className="text-[#1A1207] font-semibold font-mono-val">
                {walletBalance !== null ? formatCurrency(walletBalance) : '—'}
              </span>
              <button
                onClick={() => setShowDeposit(true)}
                className="block text-xs text-[#C9A84C] hover:text-[#1A2B1F] transition-colors"
              >
                + Add Funds
              </button>
            </div>
          </div>

          <div className="bg-[#EDE6D6] rounded-lg p-4 border border-[#E8E2D6]">
            <p className="text-sm text-[#6A5A40]">Investment</p>
            <p className="font-semibold text-[#1A1207]">{investment.title}</p>
          </div>

          <Input
            label="Number of Shares"
            type="number"
            value={units}
            min={investment.minimumUnits}
            max={investment.availableUnits}
            onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 0))}
            hint={`Minimum: ${investment.minimumUnits} shares · Available: ${investment.availableUnits.toLocaleString()} shares`}
          />

          <div className="bg-[#EDE6D6] rounded-lg p-4 space-y-2 text-sm border border-[#E8E2D6]">
            <div className="flex justify-between">
              <span className="text-[#6A5A40]">{units} units × {formatCurrency(investment.pricePerUnit)}</span>
              <span className="text-[#1A1207] font-mono-val">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6A5A40]">Wallet balance after</span>
              <span className={`font-mono-val ${walletBalance !== null && walletBalance - totalCost < 0 ? 'text-[#C62828]' : 'text-[#6A5A40]'}`}>
                {walletBalance !== null ? formatCurrency(walletBalance - totalCost) : '—'}
              </span>
            </div>
            <div className="border-t border-[#E8E2D6] pt-2 flex justify-between font-semibold">
              <span className="text-[#1A1207]">Total Cost</span>
              <span className="font-mono-val text-base">{formatCurrency(totalCost)}</span>
            </div>
          </div>

          {!hasEnoughFunds && walletBalance !== null && (
            <div className="flex items-start gap-2 p-3 bg-[#FFEBEE] border border-[#C62828]/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-[#C62828] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#C62828]">
                  Insufficient funds. You need {formatCurrency(totalCost - walletBalance)} more.
                </p>
                <button
                  onClick={() => setShowDeposit(true)}
                  className="text-xs text-[#C9A84C] hover:text-[#1A2B1F] font-medium mt-1 transition-colors"
                >
                  Add funds to wallet →
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-[#E3F2FD] border border-[#1565C0]/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-[#1565C0] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1565C0]">
              <strong>{settings.managementFeePercent}% annual management fee</strong> charged monthly on balance.{' '}
              <strong>{settings.profitSharePercent}% profit share</strong> on distributions. Investments carry risk.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={() => setStep('sign')}
              disabled={!hasEnoughFunds || units < investment.minimumUnits || units > investment.availableUnits}
            >
              Review &amp; Sign Supplement →
            </Button>
          </div>
        </div>
      </Modal>

      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </>
  );
}
