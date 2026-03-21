'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { feeSettingsSchema, type FeeSettingsInput } from '@/lib/validations';
import { formatDate } from '@/lib/utils';
import { History } from 'lucide-react';

interface SettingsHistory {
  id: string;
  managementFeePercent: string | number;
  profitSharePercent: string | number;
  updatedAt: string;
  updatedBy: {
    name: string;
    email: string;
  };
}

interface FeeSettingsFormProps {
  current: { managementFeePercent: number; profitSharePercent: number };
  history: SettingsHistory[];
}

export default function FeeSettingsForm({
  current,
  history,
}: FeeSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FeeSettingsInput | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeSettingsInput>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: {
      managementFeePercent: current.managementFeePercent,
      profitSharePercent: current.profitSharePercent,
    },
  });

  const onSubmit = (data: FeeSettingsInput) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    if (!pendingData) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success('Fee settings updated successfully!');
      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Annual Management Fee (%)"
              type="number"
              step="0.01"
              min="0"
              max="20"
              error={errors.managementFeePercent?.message}
              hint="Charged monthly on investor balances (0% – 20% p.a.)"
              {...register('managementFeePercent', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Input
              label="Profit Share (%)"
              type="number"
              step="0.01"
              min="0"
              max="50"
              error={errors.profitSharePercent?.message}
              hint="Deducted from distributions only (0% – 50%)"
              {...register('profitSharePercent', { valueAsNumber: true })}
            />
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Update Fee Settings
        </Button>
      </form>

      {history.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-[#6A5A40]" />
            <h3 className="text-sm font-medium text-[#1A1207]">Change History</h3>
          </div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-[#EDE6D6] rounded-lg text-sm border border-[#E8E2D6]"
              >
                <div>
                  <span className="text-[#1A1207] font-medium">
                    Mgmt: {Number(item.managementFeePercent).toFixed(2)}% &nbsp;·&nbsp; Profit
                    share: {Number(item.profitSharePercent).toFixed(2)}%
                  </span>
                  <p className="text-[#6A5A40] text-xs mt-0.5">
                    by {item.updatedBy.name} ({item.updatedBy.email})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[#8A7A60] text-xs">{formatDate(item.updatedAt)}</span>
                  {i === 0 && (
                    <span className="block text-xs text-[#C9A84C] font-medium">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmUpdate}
        title="Update Fee Settings"
        message={`This will set Management Fee to ${pendingData?.managementFeePercent}% and Profit Share to ${pendingData?.profitSharePercent}%. These changes affect all future distributions.`}
        confirmLabel="Update Settings"
        variant="warning"
        loading={loading}
      />
    </>
  );
}
