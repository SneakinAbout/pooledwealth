'use client';

import { useState } from 'react';
import { TrendingUp, Edit2, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  investmentId: string;
  currentValue: number | null;
  totalCostBasis: number;
  canEdit: boolean;
}

export default function ValuationWidget({ investmentId, currentValue: initialValue, totalCostBasis, canEdit }: Props) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(initialValue?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const gainLoss = value !== null ? value - totalCostBasis : null;
  const gainPct = gainLoss !== null && totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : null;

  async function handleSave() {
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) { toast.error('Enter a valid positive value'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/investments/${investmentId}/valuation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: num }),
      });
      if (!res.ok) throw new Error();
      setValue(num);
      setEditing(false);
      toast.success('Valuation updated');
    } catch {
      toast.error('Failed to update valuation');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-[#2E7D32]" />
          </div>
          <p className="text-xs font-semibold text-[#1A1207] uppercase tracking-wide">Current Valuation</p>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => { setInput(value?.toString() ?? ''); setEditing(true); }}
            className="text-[#8A7A60] hover:text-[#C9A84C] transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6A5A40]">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-white border border-[#E8E2D6] rounded-lg pl-7 pr-3 py-2 text-sm text-[#1A1207] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
              autoFocus
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 w-9 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center hover:bg-[#1B5E20] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="h-9 w-9 rounded-lg border border-[#E8E2D6] bg-white text-[#6A5A40] flex items-center justify-center hover:text-[#1A1207] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold font-mono-val text-[#1A1207]">
            {value !== null ? formatCurrency(value) : <span className="text-[#8A7A60] text-base font-normal">Not set</span>}
          </p>
          {gainLoss !== null && (
            <p className={`text-xs mt-1 font-medium ${gainLoss >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
              {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainPct?.toFixed(1)}%)
              <span className="text-[#8A7A60] font-normal ml-1">vs cost basis</span>
            </p>
          )}
          {value === null && canEdit && (
            <p className="text-xs text-[#8A7A60] mt-1">Click edit to set the current market value</p>
          )}
        </>
      )}
    </div>
  );
}
