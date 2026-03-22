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
  CheckCircle2, AlertTriangle, Minus, X,
} from 'lucide-react';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
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
function parseStatement(csv: string, deposits: Deposit[]): Map<string, StatementMatch> {
  const result = new Map<string, StatementMatch>();
  const pendingRefs = deposits
    .filter((d) => d.reference && d.status === 'PENDING')
    .map((d) => d.reference);

  if (pendingRefs.length === 0) return result;

  const rows = parseCSVRows(csv);

  for (const row of rows) {
    const rowText = row.join(' ');

    for (const ref of pendingRefs) {
      if (!rowText.includes(ref)) continue;

      // Extract all positive numbers from the row (strip $ and commas)
      const numbers = row
        .map((cell) => parseFloat(cell.replace(/[$,]/g, '')))
        .filter((n) => !isNaN(n) && n > 0 && n < 10_000_000);

      const deposit = deposits.find((d) => d.reference === ref)!;

      // Prefer a number that matches the deposit amount, else take the largest
      const exactMatch = numbers.find((n) => Math.abs(n - deposit.amount) < 0.01);
      const statementAmount = exactMatch ?? (numbers.length > 0 ? Math.max(...numbers) : 0);

      // Try to find a date cell
      const dateCell =
        row.find((c) => /\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/.test(c)) ??
        row.find((c) => /\d{4}-\d{2}-\d{2}/.test(c)) ??
        '';

      result.set(ref, {
        statementAmount,
        statementDate: dateCell,
        statementDescription: row.join(' | ').slice(0, 120),
        amountMatches: Math.abs(statementAmount - deposit.amount) < 0.01,
      });
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function DepositsClient({ deposits: initial }: { deposits: Deposit[] }) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

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
          const newMatches = parseStatement(text, deposits);
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
    [deposits]
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

  const act = async (id: string, action: 'approve' | 'reject') => {
    setLoading(`${id}:${action}`);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeposits((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: action === 'approve' ? 'COMPLETED' : 'FAILED' } : d
        )
      );
      toast.success(action === 'approve' ? 'Deposit approved and wallet credited' : 'Deposit rejected');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  const pendingCount = deposits.filter((d) => d.status === 'PENDING').length;
  const matchedCount = matches.size;
  const exactCount = Array.from(matches.values()).filter((m) => m.amountMatches).length;

  return (
    <div className="space-y-4">
      {/* ── Upload area ── */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#C9A84C]" />
          <h2 className="text-sm font-semibold text-[#1A1207]">Bank Statement Auto-Match</h2>
          <span className="text-xs text-[#8A7A60] ml-1">— upload a CSV to match deposits. No action will be taken automatically.</span>
        </div>

        {statementName ? (
          /* Loaded state */
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
              {/* Summary pills */}
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
          /* Upload dropzone */
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
              {deposits.map((d) => {
                const match = matches.get(d.reference);
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
                            onClick={() => act(d.id, 'approve')}
                            disabled={loading !== null}
                            className="text-[#2E7D32] hover:text-[#2E7D32] hover:bg-[#E8F5E9] border-[#2E7D32]/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {loading === `${d.id}:approve` ? 'Approving…' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => act(d.id, 'reject')}
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
  );
}
