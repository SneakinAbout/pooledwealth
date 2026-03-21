'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { calculateDistributionFees } from '@/lib/fees';
import { distributionSchema, type DistributionInput } from '@/lib/validations';
import { CheckCircle, DollarSign } from 'lucide-react';

interface Investment {
  id: string;
  title: string;
}

interface FeeSettings {
  managementFeePercent: number;
  profitSharePercent: number;
}

interface DistributionToolProps {
  investments: Investment[];
  settings: FeeSettings;
  investmentCostBases: Record<string, number>;
}

export default function DistributionTool({
  investments,
  settings,
  investmentCostBases,
}: DistributionToolProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof calculateDistributionFees> | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DistributionInput>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      investmentId: investments[0]?.id ?? '',
      totalAmount: 0,
      notes: '',
    },
  });

  const amount = watch('totalAmount');
  const selectedInvestmentId = watch('investmentId');

  const handlePreview = () => {
    if (!amount || amount <= 0) return;
    const costBasis = investmentCostBases[selectedInvestmentId ?? ''] ?? 0;
    const fees = calculateDistributionFees(amount, settings, costBasis);
    setPreview(fees);
  };

  const onSubmit = async (data: DistributionInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setSuccess(true);
      toast.success('Distribution processed successfully!');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Distribution failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="h-16 w-16 text-[#2E7D32] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[#1A1207] mb-2">Distribution Complete</h3>
        <p className="text-[#6A5A40] mb-6">
          Funds have been distributed to all investors proportionally.
        </p>
        <Button onClick={() => { setSuccess(false); setPreview(null); }}>
          Process Another Distribution
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Select
          label="Investment"
          options={investments.map((inv) => ({ value: inv.id, label: inv.title }))}
          error={errors.investmentId?.message}
          {...register('investmentId')}
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Gross Distribution Amount (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              error={errors.totalAmount?.message}
              {...register('totalAmount', { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={!amount || amount <= 0}
            >
              Preview
            </Button>
          </div>
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="e.g. Q1 2024 profit distribution"
          rows={3}
          {...register('notes')}
        />

        {preview && (
          <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-[#C9A84C]" />
              <h4 className="font-medium text-[#1A1207]">Fee Breakdown</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">Gross Distribution Amount</span>
                <span className="text-[#1A1207] font-mono-val">{formatCurrency(preview.grossAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">Investor Cost Basis</span>
                <span className="text-[#1A1207] font-mono-val">−{formatCurrency(preview.costBasis)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E2D6] pt-2">
                <span className="text-[#6A5A40]">Profit (taxable gain)</span>
                <span className="text-[#1A1207] font-mono-val">{formatCurrency(preview.profit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A5A40]">
                  Profit Share ({settings.profitSharePercent}% of profit)
                </span>
                <span className="text-[#C62828] font-mono-val">−{formatCurrency(preview.profitShare)}</span>
              </div>
              <div className="border-t border-[#E8E2D6] pt-2 flex justify-between font-semibold">
                <span className="text-[#1A1207]">Net to Investors</span>
                <span className="text-[#2E7D32] text-base font-mono-val">
                  {formatCurrency(preview.netAmount)}
                </span>
              </div>
              <p className="text-xs text-[#8A7A60] pt-1">
                Management fee ({settings.managementFeePercent}% p.a.) is charged
                separately on investor balances each month.
              </p>
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} disabled={!preview}>
          Process Distribution
        </Button>

        {!preview && (
          <p className="text-xs text-[#8A7A60]">
            Click &quot;Preview&quot; to see the fee breakdown before processing.
          </p>
        )}
      </form>
    </div>
  );
}
