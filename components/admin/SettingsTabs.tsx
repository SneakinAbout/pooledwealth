'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  feeSettingsSchema, type FeeSettingsInput,
  bankSettingsSchema, type BankSettingsInput,
  platformSettingsSchema, type PlatformSettingsInput,
} from '@/lib/validations';
import { formatDate } from '@/lib/utils';
import { DollarSign, Building2, Settings, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrentSettings {
  managementFeePercent: number;
  profitSharePercent: number;
  bankName: string;
  bankAccountName: string;
  bankBSB: string;
  bankAccountNumber: string;
  bankSwift: string;
  platformName: string;
  supportEmail: string;
  minDepositAmount: number;
  maxDepositAmount: number;
}

interface HistoryEntry {
  id: string;
  managementFeePercent: number;
  profitSharePercent: number;
  updatedAt: string;
  updatedBy: { name: string; email: string } | null;
}

const TABS = [
  { id: 'fees', label: 'Fee Structure', icon: DollarSign },
  { id: 'bank', label: 'Bank Details', icon: Building2 },
  { id: 'platform', label: 'Platform', icon: Settings },
];

// ─── Fee Tab ────────────────────────────────────────────────────────────────
function FeeTab({ current, history }: { current: CurrentSettings; history: HistoryEntry[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FeeSettingsInput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FeeSettingsInput>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: { managementFeePercent: current.managementFeePercent, profitSharePercent: current.profitSharePercent },
  });

  const onSubmit = (data: FeeSettingsInput) => { setPendingData(data); setShowConfirm(true); };

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
      toast.success('Fee settings updated');
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
          <Input
            label="Annual Management Fee (%)"
            type="number" step="0.01" min="0" max="20"
            error={errors.managementFeePercent?.message}
            hint="Charged monthly on investor balances (0–20% p.a.)"
            {...register('managementFeePercent', { valueAsNumber: true })}
          />
          <Input
            label="Profit Share (%)"
            type="number" step="0.01" min="0" max="50"
            error={errors.profitSharePercent?.message}
            hint="Deducted from distributions only (0–50%)"
            {...register('profitSharePercent', { valueAsNumber: true })}
          />
        </div>
        <Button type="submit">Update Fee Settings</Button>
      </form>

      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-[#6A5A40]" />
            <h3 className="text-sm font-medium text-[#1A1207]">Change History</h3>
          </div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#EDE6D6] rounded-lg text-sm border border-[#E8E2D6]">
                <div>
                  <span className="text-[#1A1207] font-medium">
                    Mgmt: {Number(item.managementFeePercent).toFixed(2)}% &nbsp;·&nbsp; Profit share: {Number(item.profitSharePercent).toFixed(2)}%
                  </span>
                  <p className="text-[#6A5A40] text-xs mt-0.5">by {item.updatedBy?.name ?? 'Unknown'} ({item.updatedBy?.email ?? '—'})</p>
                </div>
                <div className="text-right">
                  <span className="text-[#8A7A60] text-xs">{formatDate(item.updatedAt)}</span>
                  {i === 0 && <span className="block text-xs text-[#C9A84C] font-medium">Current</span>}
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
        message={`Set Management Fee to ${pendingData?.managementFeePercent}% and Profit Share to ${pendingData?.profitSharePercent}%. Affects all future distributions.`}
        confirmLabel="Update Settings"
        variant="warning"
        loading={loading}
      />
    </>
  );
}

// ─── Bank Tab ────────────────────────────────────────────────────────────────
function BankTab({ current }: { current: CurrentSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BankSettingsInput>({
    resolver: zodResolver(bankSettingsSchema),
    defaultValues: {
      bankName: current.bankName,
      bankAccountName: current.bankAccountName,
      bankBSB: current.bankBSB,
      bankAccountNumber: current.bankAccountNumber,
      bankSwift: current.bankSwift,
    },
  });

  const onSubmit = async (data: BankSettingsInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success('Bank details updated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="p-4 bg-[#E3F2FD] border border-[#1565C0]/20 rounded-xl text-xs text-[#1565C0]">
        These details are shown to users when they select Bank Transfer as their deposit method.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Bank Name" error={errors.bankName?.message} {...register('bankName')} />
        <Input label="Account Name" error={errors.bankAccountName?.message} {...register('bankAccountName')} />
        <Input label="BSB / Sort Code" error={errors.bankBSB?.message} {...register('bankBSB')} />
        <Input label="Account Number" error={errors.bankAccountNumber?.message} {...register('bankAccountNumber')} />
        <Input label="SWIFT / BIC" error={errors.bankSwift?.message} {...register('bankSwift')} />
      </div>

      <Button type="submit" loading={loading}>Save Bank Details</Button>
    </form>
  );
}

// ─── Platform Tab ────────────────────────────────────────────────────────────
function PlatformTab({ current }: { current: CurrentSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PlatformSettingsInput>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platformName: current.platformName,
      supportEmail: current.supportEmail,
      minDepositAmount: current.minDepositAmount,
      maxDepositAmount: current.maxDepositAmount,
    },
  });

  const onSubmit = async (data: PlatformSettingsInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success('Platform settings updated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Platform Name"
          hint="Displayed in the app header and emails"
          error={errors.platformName?.message}
          {...register('platformName')}
        />
        <Input
          label="Support Email"
          type="email"
          hint="Shown to users for support enquiries"
          error={errors.supportEmail?.message}
          {...register('supportEmail')}
        />
        <Input
          label="Minimum Deposit (AUD)"
          type="number"
          hint="Smallest amount a user can deposit"
          error={errors.minDepositAmount?.message}
          {...register('minDepositAmount', { valueAsNumber: true })}
        />
        <Input
          label="Maximum Deposit (AUD)"
          type="number"
          hint="Largest amount a user can deposit at once"
          error={errors.maxDepositAmount?.message}
          {...register('maxDepositAmount', { valueAsNumber: true })}
        />
      </div>

      <Button type="submit" loading={loading}>Save Platform Settings</Button>
    </form>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SettingsTabs({ current, history }: { current: CurrentSettings; history: HistoryEntry[] }) {
  const [activeTab, setActiveTab] = useState('fees');

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-white text-[#1A1207] border border-[#E8E2D6]'
                : 'text-[#6A5A40] hover:text-[#1A1207]'
            )}
          >
            <Icon className={cn('h-4 w-4', activeTab === id ? 'text-[#C9A84C]' : '')} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card>
        {activeTab === 'fees' && <FeeTab current={current} history={history} />}
        {activeTab === 'bank' && <BankTab current={current} />}
        {activeTab === 'platform' && <PlatformTab current={current} />}
      </Card>
    </div>
  );
}
