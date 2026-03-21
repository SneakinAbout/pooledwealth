'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { investmentSchemaBase, type InvestmentInput } from '@/lib/validations';

const CATEGORIES = [
  { value: 'Pokemon TCG', label: '🎴 Pokemon TCG' },
  { value: 'Sports Cards', label: '🏀 Sports Cards' },
  { value: 'Sneakers', label: '👟 Sneakers' },
  { value: 'Comics', label: '💥 Comics' },
  { value: 'Watches', label: '⌚ Watches' },
  { value: 'Memorabilia', label: '🏆 Memorabilia' },
];

const STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

interface InvestmentFormProps {
  initial?: Partial<InvestmentInput> & { id?: string };
  mode: 'create' | 'edit';
}

export default function InvestmentForm({ initial, mode }: InvestmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchemaBase),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      category: initial?.category ?? 'Pokemon TCG',
      status: initial?.status ?? 'DRAFT',
      totalUnits: initial?.totalUnits ?? 100,
      pricePerUnit: initial?.pricePerUnit ?? 100,
      minimumUnits: initial?.minimumUnits ?? 1,
      minimumRaise: initial?.minimumRaise ?? 0,
      targetReturn: initial?.targetReturn ?? 7.5,
      startDate: initial?.startDate ?? new Date().toISOString().split('T')[0],
      endDate: initial?.endDate ?? '',
      imageUrl: initial?.imageUrl ?? '',
      edition: initial?.edition ?? '',
      grade: initial?.grade ?? '',
      gradingCompany: initial?.gradingCompany ?? '',
      certNumber: initial?.certNumber ?? '',
      acquisitionPrice: initial?.acquisitionPrice ?? undefined,
      acquisitionDate: initial?.acquisitionDate ?? '',
    },
  });

  const onSubmit = async (data: InvestmentInput) => {
    setLoading(true);
    try {
      const url =
        mode === 'edit' && initial?.id
          ? `/api/investments/${initial.id}`
          : '/api/investments';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Operation failed');
      }

      toast.success(
        mode === 'create' ? 'Investment created!' : 'Investment updated!'
      );
      router.push(
        mode === 'create'
          ? `/investments/${result.id}`
          : `/investments/${initial!.id}`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Investment Title"
            placeholder="e.g. Metropolitan Office Complex"
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            placeholder="Describe the investment opportunity..."
            rows={5}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <Select
          label="Category"
          options={CATEGORIES}
          error={errors.category?.message}
          {...register('category')}
        />

        <Select
          label="Status"
          options={STATUSES}
          error={errors.status?.message}
          {...register('status')}
        />

        <Input
          label="Total Shares"
          type="number"
          min={1}
          error={errors.totalUnits?.message}
          {...register('totalUnits', { valueAsNumber: true })}
        />

        <Input
          label="Price per Share (USD)"
          type="number"
          min={0.01}
          step={0.01}
          error={errors.pricePerUnit?.message}
          {...register('pricePerUnit', { valueAsNumber: true })}
        />

        <Input
          label="Minimum Shares per Purchase"
          type="number"
          min={1}
          error={errors.minimumUnits?.message}
          {...register('minimumUnits', { valueAsNumber: true })}
        />

        <Input
          label="Minimum Raise (units)"
          type="number"
          min={0}
          hint="Minimum units that must be sold. If not met by end date, investors are auto-refunded and the investment is re-listed. Set 0 for no minimum."
          error={errors.minimumRaise?.message}
          {...register('minimumRaise', { valueAsNumber: true })}
        />

        <Input
          label="Est. Annual Appreciation (%)"
          type="number"
          min={0}
          max={100}
          step={0.1}
          error={errors.targetReturn?.message}
          {...register('targetReturn', { valueAsNumber: true })}
        />

        <Input
          label="Start Date"
          type="date"
          error={errors.startDate?.message}
          {...register('startDate')}
        />

        <Input
          label="End Date"
          type="date"
          error={errors.endDate?.message}
          {...register('endDate')}
        />

        <div className="md:col-span-2">
          <Input
            label="Image URL (optional)"
            type="url"
            placeholder="https://..."
            error={errors.imageUrl?.message}
            hint="Use a publicly accessible image URL"
            {...register('imageUrl')}
          />
        </div>

        {/* Asset identification — used in Co-Ownership Supplement documents */}
        <div className="md:col-span-2 pt-2">
          <p className="text-sm font-semibold text-[#1A1207] mb-1">Asset Identification</p>
          <p className="text-xs text-[#8A7A60] mb-4">Used to populate the Co-Ownership Supplement at time of purchase.</p>
        </div>

        <Input
          label="Edition (optional)"
          placeholder="e.g. 1st Edition, Shadowless"
          error={errors.edition?.message}
          {...register('edition')}
        />

        <Input
          label="Grade (optional)"
          placeholder="e.g. PSA 10, BGS 9.5"
          error={errors.grade?.message}
          {...register('grade')}
        />

        <Input
          label="Grading Company (optional)"
          placeholder="e.g. PSA, BGS, CGC"
          error={errors.gradingCompany?.message}
          {...register('gradingCompany')}
        />

        <Input
          label="Certificate Number (optional)"
          placeholder="e.g. 12345678"
          error={errors.certNumber?.message}
          {...register('certNumber')}
        />

        <Input
          label="Admin Acquisition Price (optional)"
          type="number"
          min={0.01}
          step={0.01}
          placeholder="0.00"
          hint="What Admin paid to acquire this asset"
          error={errors.acquisitionPrice?.message}
          {...register('acquisitionPrice', { valueAsNumber: true })}
        />

        <Input
          label="Admin Acquisition Date (optional)"
          type="date"
          hint="When Admin acquired this asset"
          error={errors.acquisitionDate?.message}
          {...register('acquisitionDate')}
        />
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Create Investment' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
