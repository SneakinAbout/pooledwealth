'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Zap, Pencil, Check, X } from 'lucide-react';

interface UserFee {
  id: string;
  name: string;
  email: string;
  role: string;
  totalInvested: number;
  grossFee: number;
  discountPercent: number;
  effectiveFee: number;
  walletBalance: number;
  canPay: boolean;
}

interface Props {
  breakdown: UserFee[];
  totalFee: number;
  collectible: number;
  annualPct: number;
}

const roleVariant = (role: string) =>
  role === 'ADMIN' ? 'danger' as const : role === 'MANAGER' ? 'info' as const : 'default' as const;

function DiscountCell({ user, onUpdated }: { user: UserFee; onUpdated: (id: string, pct: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.discountPercent.toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const pct = parseFloat(value);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Enter 0–100'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeDiscountPercent: pct }),
      });
      if (!res.ok) throw new Error();
      onUpdated(user.id, pct);
      setEditing(false);
      toast.success('Discount saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          className="w-16 bg-white border border-[#C9A84C]/40 rounded px-2 py-1 text-sm text-[#1A1207] text-right focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
        />
        <span className="text-[#6A5A40] text-sm">%</span>
        <button onClick={save} disabled={saving} className="text-[#2E7D32] hover:text-[#1B5E20] transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setValue(user.discountPercent.toString()); setEditing(false); }} className="text-[#8A7A60] hover:text-[#1A1207] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end group">
      {user.discountPercent > 0 ? (
        <span className="text-sm font-medium text-[#C9A84C] font-mono-val">{user.discountPercent}% off</span>
      ) : (
        <span className="text-sm text-[#8A7A60]">—</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-[#8A7A60] hover:text-[#C9A84C] transition-all"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function FeeCollectionClient({ breakdown: initial, totalFee: initTotal, collectible: initCollectible, annualPct }: Props) {
  const router = useRouter();
  const [breakdown, setBreakdown] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ charged: number; skipped: number; totalCollected: number } | null>(null);

  const handleDiscountUpdated = (id: string, pct: number) => {
    setBreakdown((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const effectiveFee = Math.round(u.grossFee * (1 - pct / 100) * 100) / 100;
        return { ...u, discountPercent: pct, effectiveFee, canPay: u.walletBalance >= effectiveFee };
      })
    );
  };

  const totalFee = breakdown.reduce((s, u) => s + u.effectiveFee, 0);
  const collectible = breakdown.filter((u) => u.canPay).reduce((s, u) => s + u.effectiveFee, 0);

  const handleCharge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fees', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setShowConfirm(false);
      toast.success(`${formatCurrency(data.totalCollected)} collected from ${data.charged} users`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Charge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-[#1A1207]">Monthly Fee Breakdown</h2>
            <p className="text-xs text-[#6A5A40] mt-0.5">
              Gross = Total Invested × {annualPct}% ÷ 12 &nbsp;·&nbsp; Effective = Gross × (1 − Discount)
            </p>
          </div>
          <Button onClick={() => setShowConfirm(true)} disabled={collectible === 0}>
            <Zap className="h-4 w-4 mr-2" />
            Charge {formatCurrency(collectible)}
          </Button>
        </div>

        {result && (
          <div className="mb-5 p-4 bg-[#E8F5E9] border border-[#2E7D32]/20 rounded-xl text-sm">
            <p className="text-[#2E7D32] font-semibold mb-1">Last charge result</p>
            <p className="text-[#1A1207]">
              Collected <span className="font-medium font-mono-val">{formatCurrency(result.totalCollected)}</span> from{' '}
              <span className="font-medium">{result.charged}</span> user{result.charged !== 1 ? 's' : ''}.
              {result.skipped > 0 && <span className="text-[#E65100]"> {result.skipped} skipped (insufficient funds).</span>}
            </p>
          </div>
        )}

        {breakdown.length === 0 ? (
          <p className="text-[#6A5A40] text-sm text-center py-8">No users with active holdings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D6] text-left">
                  <th className="pb-3 text-[#6A5A40] font-medium">User</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Total Invested</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Gross Fee</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Discount</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Effective Fee</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Wallet</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D6]">
                {breakdown.map((u) => (
                  <tr key={u.id} className="hover:bg-[#EDE6D6]/50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={roleVariant(u.role)} className="text-xs">{u.role}</Badge>
                        <div>
                          <p className="font-medium text-[#1A1207]">{u.name}</p>
                          <p className="text-xs text-[#6A5A40]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono-val">{formatCurrency(u.totalInvested)}</td>
                    <td className="py-3.5 text-right text-[#6A5A40] font-mono-val">{formatCurrency(u.grossFee)}</td>
                    <td className="py-3.5">
                      <DiscountCell user={u} onUpdated={handleDiscountUpdated} />
                    </td>
                    <td className="py-3.5 text-right font-semibold font-mono-val">{formatCurrency(u.effectiveFee)}</td>
                    <td className="py-3.5 text-right font-mono-val">{formatCurrency(u.walletBalance)}</td>
                    <td className="py-3.5 text-center">
                      {u.canPay ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#2E7D32]">
                          <CheckCircle className="h-3.5 w-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#C62828]">
                          <XCircle className="h-3.5 w-3.5" /> Low funds
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E8E2D6]">
                  <td className="pt-3 text-[#6A5A40] font-medium">Total</td>
                  <td className="pt-3 text-right font-medium font-mono-val">
                    {formatCurrency(breakdown.reduce((s, u) => s + u.totalInvested, 0))}
                  </td>
                  <td className="pt-3 text-right text-[#6A5A40] font-mono-val">
                    {formatCurrency(breakdown.reduce((s, u) => s + u.grossFee, 0))}
                  </td>
                  <td className="pt-3 text-right text-[#C9A84C] text-xs font-mono-val">
                    −{formatCurrency(breakdown.reduce((s, u) => s + u.grossFee - u.effectiveFee, 0))} saved
                  </td>
                  <td className="pt-3 text-right font-bold font-mono-val">{formatCurrency(totalFee)}</td>
                  <td colSpan={2} className="pt-3 text-right text-xs text-[#8A7A60]">
                    {formatCurrency(collectible)} collectible
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleCharge}
        title="Charge Monthly Management Fees"
        message={`This will deduct ${formatCurrency(collectible)} from ${breakdown.filter((u) => u.canPay).length} user wallet${breakdown.filter((u) => u.canPay).length !== 1 ? 's' : ''} (after discounts). Users with insufficient funds will be skipped.`}
        confirmLabel="Charge Fees"
        variant="warning"
        loading={loading}
      />
    </>
  );
}
