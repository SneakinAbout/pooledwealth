'use client';

import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DepositModal from './DepositModal';
import { formatCurrency } from '@/lib/utils';

interface WalletCardProps {
  balance: number;
}

export default function WalletCard({ balance }: WalletCardProps) {
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <>
      <Card className="flex items-center justify-between bg-white border border-[#E8E2D6]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-xs text-[#6A5A40] mb-1">Available to invest</p>
            <p className="text-2xl font-bold font-mono-val tabular-nums">{formatCurrency(balance)}</p>
          </div>
        </div>
        <Button onClick={() => setShowDeposit(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </Card>

      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </>
  );
}
