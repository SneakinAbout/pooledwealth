'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  CheckCircle, XCircle, Clock, Upload, FileText,
  CheckCircle2, AlertTriangle, Minus, X, PlusCircle,
} from 'lucide-react';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  depositCode: string | null;
}

interface StatementMatch {
  statementAmount: number;
  statementDate: string;
  statementDescription: string;
  amountMatches: boolean;
}

// ─── CSV parser (handles quoted fields) ──────────────────────────────────────
function parseCSVRows(csv: string): string[][] {
  const rows: string[][] = [];
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

// ─── Match statement rows against deposit references ─────────────────────────
// Matches by investor deposit code (PW-XXXX) or legacy per-deposit reference.
function parseStatement(csv: string, deposits: Deposit[], users: User[]): Map<string, StatementMatch> {
  const result = new Map<string, StatementMatch>();
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING');
  if (pendingDeposits.length === 0) return result;

  // Build lookup: depositCode → userId for investor code matching
  const codeToUserId = new Map<string, string>();
  for (const u of users) {
    if (u.depositCode) codeToUserId.set(u.depositCode, u.id);
  }

  // Collect all codes to search for: investor deposit codes + legacy per-deposit refs
  const searchCodes = new Set<string>();
  for (const u of users) {
    if (u.depositCode) searchCodes.add(u.depositCode);
  }
  for (const d of pendingDeposits) {
    if (d.reference) searchCodes.add(d.reference);
  }

  const searchCodesArr = Array.from(searchCodes);
  if (searchCodesArr.length === 0) return result;

  const rows = parseCSVRows(csv);

  for (const row of rows) {
    const rowText = row.join(' ');

    for (const code of searchCodesArr) {
      if (!rowText.includes(code)) continue;

      const numbers = row
        .map((cell) => parseFloat(cell.replace(/[$,]/g, '')))
        .filter((n) => !isNaN(n) && n > 0 && n < 10_000_000);

      const dateCell =
        row.find((c) => /\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/.test(c)) ??
        row.find((c) => /\d{4}-\d{2}-\d{2}/.test(c)) ??
        '';

      // Find which pending deposits this matches (by investor code or direct ref)
      const userId = codeToUserId.get(code);
      const matched = userId
        ? pendingDeposits.filter((d) => d.user.id === userId)
        : pendingDeposits.filter((d) => d.reference === code);

      const statementAmount = numbers.length > 0 ? Math.max(...numbers) : 0;

      for (const deposit of matched) {
        if (result.has(deposit.id)) continue;
        result.set(deposit.id, {
          statementAmount,
          statementDate: dateCell,
          statementDescription: row.join(' | ').slice(0, 120),
          amountMatches: Math.abs(statementAmount - deposit.amount) < 0.01,
        });
      }
      break;
    }
  }

  return result;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  if (status === 'COMPLETED') return <Badge variant="success">Approved</Badge>;
  if (status === 'FAILED') return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

// ─── Match badge ──────────────────────────────────────────────────────────────
function MatchBadge({ match, deposit }: { match: StatementMatch | undefined; deposit: Deposit }) {
  if (!match) {
    return (
      <span className="inline-flex items-center gap-1 text-[#8A7A60] text-xs">
        <Minus className="h-3 w-3" /> No match
      </span>
    );
  }
  if (match.amountMatches) {
    return (
      <span className="inline-flex items-center gap-1 text-[#2E7D32] text-xs font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {formatCurrency(match.statementAmount)}
        {match.statementDate && (
          <span className="text-[#6A5A40] font-normal ml-1">{match.statementDate}</span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
      <AlertTriangle className="h-3.5 w-3.5" />
      {formatCurrency(match.statementAmount)}
      <span className="text-[#8A7A60] font-normal">(expected {formatCurrency(deposit.amount)})</span>
    </span>
  );
}

// ─── Approve modal ────────────────────────────────────────────────────────────
function ApproveModal({
  deposit,
  onClose,
  onApproved,
}: {
  deposit: Deposit;
  onClose: () => void;
  onApproved: (id: string, approvedAmount: number) => void;
}) {
  const [amount, setAmount] = useState(deposit.amount.toFixed(2));
  const [saving, setSaving] = useState(false);

  const adjusted = Math.abs(parseFloat(amount) - deposit.amount) > 0.01;

  async function handleApprove() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/deposits/${deposit.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        adjusted
          ? `Deposit approved — amount adjusted to ${formatCurrency(parsed)}`
          : `Deposit approved — wallet credited ${formatCurrency(parsed)}`
      );
      onApproved(deposit.id, parsed);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8E2D6]">
        <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1A1207]">Approve Deposit</h3>
            <p className="text-xs text-[#6A5A40] mt-0.5">{deposit.user.name} · {deposit.user.email}</p>
          </div>
          <button onClick={onClose} className="text-[#8A7A60] hover:text-[#1A1207] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">
              Amount to credit (AUD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A5A40] text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30"
                autoFocus
              />
            </div>
            {adjusted && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Adjusted from original {formatCurrency(deposit.amount)} — investor will receive the adjusted amount
              </p>
            )}
            {deposit.reference && (
              <p className="text-xs text-[#8A7A60] mt-1.5">
                Reference: <code className="bg-[#EDE6D6] px-1 rounded">{deposit.reference}</code>
              </p>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#E8E2D6] flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={saving || !amount || parseFloat(amount) <= 0}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white border-0"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Approving…' : adjusted ? 'Approve with Adjustment' : 'Approve'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Manual deposit modal ─────────────────────────────────────────────────────
function ManualDepositModal({
  users,
  onClose,
  onCreated,
}: {
  users: User[];
  onClose: () => void;
  onCreated: (deposit: Deposit) => void;
}) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const parsed = parseFloat(amount);
    if (!userId) { toast.error('Select an investor'); return; }
    if (isNaN(parsed) || parsed <= 0) { toast.error('Enter a valid amount'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parsed, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const user = users.find((u) => u.id === userId)!;
      toast.success(`Manual deposit of ${formatCurrency(parsed)} created for ${user.name}`);
      onCreated({
        id: data.depositId,
        amount: parsed,
        status: 'COMPLETED',
        reference: note || '',
        createdAt: new Date().toISOString(),
        user,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deposit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8E2D6]">
        <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1A1207]">Manual Deposit</h3>
            <p className="text-xs text-[#6A5A40] mt-0.5">Credit funds directly to an investor wallet</p>
          </div>
          <button onClick={onClose} className="text-[#8A7A60] hover:text-[#1A1207] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">Investor</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 bg-white"
            >
              <option value="">Select investor…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">Amount (AUD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A5A40] text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6A5A40] mb-1.5">Reference / Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Manual bank transfer 25 Apr"
              className="w-full px-3 py-2.5 border border-[#C8BEA8] rounded-xl text-[#1A1207] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#E8E2D6] flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={saving || !userId || !amount || parseFloat(amount) <= 0}
            className="bg-[#1A2B1F] hover:bg-[#243D2A] text-[#C9A84C] border-0"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Creating…' : 'Create Deposit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DepositsClient({
  deposits: initial,
  users,
}: {
  deposits: Deposit[];
  users: User[];
}) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<Deposit | null>(null);
  const [showManual, setShowManual] = useState(false);

  // Statement matching state
  const [matches, setMatches] = useState<Map<string, StatementMatch>>(new Map());
  const [statementName, setStatementName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please upload a CSV file exported from your bank');
        return;
      }
      setParsing(true);
      setStatementName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const newMatches = parseStatement(text, deposits, users);
          setMatches(newMatches);
          if (newMatches.size === 0) {
            toast('No references matched — check the CSV contains PW-… reference codes', { icon: '⚠️' });
          } else {
            const exact = Array.from(newMatches.values()).filter((m) => m.amountMatches).length;
            toast.success(
              `${newMatches.size} deposit${newMatches.size !== 1 ? 's' : ''} matched · ${exact} exact amount${exact !== 1 ? 's' : ''}`
            );
          }
        } catch {
          toast.error('Could not parse the CSV — try re-exporting from your bank');
        } finally {
          setParsing(false);
        }
      };
      reader.readAsText(file);
    },
    [deposits, users]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearStatement = () => {
    setMatches(new Map());
    setStatementName(null);
  };

  const reject = async (id: string) => {
    setLoading(`${id}:reject`);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeposits((prev) => prev.map((d) => d.id === id ? { ...d, status: 'FAILED' } : d));
      toast.success('Deposit rejected');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setLoading(null);
    }
  };

  const pendingCount = deposits.filter((d) => d.status === 'PENDING').length;
  const matchedCount = matches.size;
  const exactCount = Array.from(matches.values()).filter((m) => m.amountMatches).length;

  return (
    <>
      {/* ── Approve modal ── */}
      {approveTarget && (
        <ApproveModal
          deposit={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={(id, approvedAmount) => {
            setDeposits((prev) => prev.map((d) => d.id === id ? { ...d, status: 'COMPLETED', amount: approvedAmount } : d));
            router.refresh();
          }}
        />
      )}

      {/* ── Manual deposit modal ── */}
      {showManual && (
        <ManualDepositModal
          users={users}
          onClose={() => setShowManual(false)}
          onCreated={(deposit) => {
            setDeposits((prev) => [deposit, ...prev]);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-4">
        {/* ── Upload area ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#C9A84C]" />
            <h2 className="text-sm font-semibold text-[#1A1207]">Bank Statement Auto-Match</h2>
            <span className="text-xs text-[#8A7A60] ml-1">— upload a CSV to match deposits. No action will be taken automatically.</span>
          </div>

          {statementName ? (
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#2E7D32]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1207] truncate">{statementName}</p>
                  <p className="text-xs text-[#6A5A40]">
                    {matchedCount === 0
                      ? 'No references matched'
                      : `${matchedCount} of ${pendingCount} pending deposits matched · ${exactCount} exact amount match${exactCount !== 1 ? 'es' : ''}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {matchedCount > 0 && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#2E7D32]">
                      <CheckCircle2 className="h-3 w-3" /> {exactCount} exact
                    </span>
                    {matchedCount - exactCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> {matchedCount - exactCount} mismatch
                      </span>
                    )}
                  </>
                )}
                <button
                  onClick={clearStatement}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[#8A7A60] hover:text-[#1A1207] hover:bg-[#EDE6D6] transition-colors"
                  title="Clear statement"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`m-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragging
                  ? 'border-[#C9A84C] bg-[#FDF8ED]'
                  : 'border-[#C8BEA8] hover:border-[#C9A84C] hover:bg-[#FDF8ED]/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#EDE6D6] flex items-center justify-center">
                  {parsing ? (
                    <div className="h-4 w-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-[#6A5A40]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1207]">
                    {parsing ? 'Parsing statement…' : 'Drag & drop your bank statement'}
                  </p>
                  <p className="text-xs text-[#8A7A60] mt-0.5">
                    CSV export from any Australian bank · References matched by <code className="bg-[#EDE6D6] px-1 rounded">PW-…</code> code
                  </p>
                </div>
                {!parsing && (
                  <Button size="sm" variant="ghost" className="mt-1 pointer-events-none">
                    Browse file
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* ── Deposits table ── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#6A5A40]">
              {deposits.length} deposit{deposits.length !== 1 ? 's' : ''} total
              {pendingCount > 0 && ` · ${pendingCount} pending`}
            </p>
            <Button
              size="sm"
              onClick={() => setShowManual(true)}
              className="bg-[#1A2B1F] hover:bg-[#243D2A] text-[#C9A84C] border-0"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Manual Deposit
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D6] text-left">
                  <th className="pb-3 text-[#6A5A40] font-medium">User</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Amount</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Reference</th>
                  {statementName && (
                    <th className="pb-3 text-[#6A5A40] font-medium">Statement Match</th>
                  )}
                  <th className="pb-3 text-[#6A5A40] font-medium">Date</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-center">Status</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D6]">
                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#6A5A40] text-sm">
                      No deposits yet.
                    </td>
                  </tr>
                )}
                {deposits.map((d) => {
                  const match = matches.get(d.id);
                  const rowHighlight =
                    statementName && d.status === 'PENDING'
                      ? match
                        ? match.amountMatches
                          ? 'bg-[#E8F5E9]/40'
                          : 'bg-amber-50/40'
                        : ''
                      : '';

                  return (
                    <tr key={d.id} className={`transition-colors hover:bg-[#EDE6D6]/50 ${rowHighlight}`}>
                      <td className="py-3.5">
                        <p className="font-medium text-[#1A1207]">{d.user.name}</p>
                        <p className="text-xs text-[#6A5A40]">{d.user.email}</p>
                        {(() => {
                          const u = users.find((u) => u.id === d.user.id);
                          return u?.depositCode ? (
                            <code className="text-[10px] text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">{u.depositCode}</code>
                          ) : null;
                        })()}
                      </td>
                      <td className="py-3.5 text-right font-semibold font-mono-val">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3.5">
                        <code className="text-xs text-[#6A5A40] bg-[#EDE6D6] px-2 py-0.5 rounded">
                          {d.reference || '—'}
                        </code>
                      </td>
                      {statementName && (
                        <td className="py-3.5">
                          {d.status !== 'PENDING' ? (
                            <span className="text-xs text-[#8A7A60]">—</span>
                          ) : (
                            <MatchBadge match={match} deposit={d} />
                          )}
                          {match && !match.amountMatches && (
                            <p className="text-[10px] text-[#8A7A60] mt-0.5 max-w-[220px] truncate" title={match.statementDescription}>
                              {match.statementDescription}
                            </p>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 text-[#6A5A40] text-xs">
                        {new Date(d.createdAt).toLocaleString('en-AU')}
                      </td>
                      <td className="py-3.5 text-center">
                        {statusBadge(d.status)}
                      </td>
                      <td className="py-3.5 text-right">
                        {d.status === 'PENDING' ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setApproveTarget(d)}
                              disabled={loading !== null}
                              className="text-[#2E7D32] hover:text-[#2E7D32] hover:bg-[#E8F5E9] border-[#2E7D32]/20"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => reject(d.id)}
                              disabled={loading !== null}
                              className="text-[#C62828] hover:text-[#C62828] hover:bg-[#FFEBEE] border-[#C62828]/20"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              {loading === `${d.id}:reject` ? 'Rejecting…' : 'Reject'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A7A60] flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
