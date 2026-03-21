'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DepositModal from '@/components/wallet/DepositModal';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, Wallet } from 'lucide-react';

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
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
  settings: PlatformSettings;
}

export default function PurchaseModal({ isOpen, onClose, investment, settings }: PurchaseModalProps) {
  const router = useRouter();
  const [units, setUnits] = useState(investment.minimumUnits);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);

  const totalCost = units * investment.pricePerUnit;
  const hasEnoughFunds = walletBalance !== null && walletBalance >= totalCost;

  useEffect(() => {
    if (isOpen) {
      fetch('/api/wallet')
        .then((r) => r.json())
        .then((d) => setWalletBalance(d.balance ?? 0))
        .catch(() => setWalletBalance(0));
    }
  }, [isOpen, showDeposit]);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investments/${investment.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');

      setSuccess(true);
      setWalletBalance((prev) => (prev !== null ? prev - totalCost : null));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setUnits(investment.minimumUnits);
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Successful" size="sm">
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-[#2E7D32] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1207] mb-2">Investment Confirmed!</h3>
          <p className="text-[#6A5A40] text-sm mb-2">
            You purchased <span className="text-[#1A1207] font-medium">{units} units</span> of{' '}
            <span className="text-[#1A1207] font-medium">{investment.title}</span>
          </p>
          <p className="font-mono-val text-xl mb-6">{formatCurrency(totalCost)}</p>
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
              <strong>{settings.managementFeePercent}% annual management fee</strong> charged
              monthly on balance. <strong>{settings.profitSharePercent}% profit share</strong> on
              distributions. Investments carry risk.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handlePurchase}
              loading={loading}
              disabled={!hasEnoughFunds || units < investment.minimumUnits || units > investment.availableUnits}
            >
              Buy Shares
            </Button>
          </div>
        </div>
      </Modal>

      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </>
  );
}
