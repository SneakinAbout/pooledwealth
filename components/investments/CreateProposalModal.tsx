'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

type ProposalType = 'EXIT' | 'RESERVE_PRICE' | 'STORAGE_INSURANCE' | 'DISPUTE';

const TYPE_OPTIONS: { value: ProposalType; label: string; hint: string; needsValue: boolean; valuePlaceholder?: string }[] = [
  {
    value: 'EXIT',
    label: 'Exit Proposal',
    hint: 'Propose selling the asset and distributing proceeds to all co-owners.',
    needsValue: false,
  },
  {
    value: 'RESERVE_PRICE',
    label: 'Reserve Price',
    hint: 'Set a minimum acceptable sale price.',
    needsValue: true,
    valuePlaceholder: 'e.g. $500,000',
  },
  {
    value: 'STORAGE_INSURANCE',
    label: 'Storage & Insurance',
    hint: 'Propose a change to storage location or insurance coverage.',
    needsValue: true,
    valuePlaceholder: 'e.g. Move to ABC Storage, increase cover to $1M',
  },
  {
    value: 'DISPUTE',
    label: 'Dispute',
    hint: 'Raise a formal dispute for admin escalation. Requires 33% of shares to trigger.',
    needsValue: false,
  },
];

interface Props {
  investmentId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateProposalModal({ investmentId, onClose, onCreated }: Props) {
  const [type, setType] = useState<ProposalType>('EXIT');
  const [description, setDescription] = useState('');
  const [proposedValue, setProposedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selected = TYPE_OPTIONS.find((t) => t.value === type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error('Please provide a description of at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: description.trim(),
          proposedValue: selected.needsValue ? proposedValue.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Failed to submit proposal');
        return;
      }
      toast.success('Proposal submitted — awaiting admin review.');
      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1207]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-bold text-[#1A1207]">Raise a Proposal</h2>
          <button onClick={onClose} className="text-[#8A7A60] hover:text-[#1A1207] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-2">
              Proposal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${
                    type === opt.value
                      ? 'border-[#C9A84C] bg-[#FDF8ED] text-[#1A1207] font-medium'
                      : 'border-[#E8E2D6] bg-[#F7F4EE] text-[#6A5A40] hover:border-[#C8BEA8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#8A7A60] mt-2">{selected.hint}</p>
          </div>

          {/* Proposed value */}
          {selected.needsValue && (
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
                Proposed Value
              </label>
              <Input
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder={selected.valuePlaceholder}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              className="w-full text-sm border border-[#C8BEA8] rounded-xl p-3 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 text-[#1A1207]"
              rows={4}
              placeholder="Describe your proposal and reasoning in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
            <p className="text-[10px] text-[#8A7A60] mt-1">
              Your proposal will be reviewed by an admin before being opened for voting.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
              {submitting ? 'Submitting…' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
