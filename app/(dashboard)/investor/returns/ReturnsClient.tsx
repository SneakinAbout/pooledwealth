'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Download } from 'lucide-react';

type Breakdown = {
  investmentId: string;
  title: string;
  category: string;
  distributions: number;
  fees: number;
  purchases: number;
  redemptions: number;
  netReturn: number;
};

type ReturnsData = {
  from: string;
  to: string;
  summary: {
    totalDistributions: number;
    totalFees: number;
    totalPurchases: number;
    totalRedemptions: number;
    netReturn: number;
  };
  breakdown: Breakdown[];
  platformFees: number;
};

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

// Australian financial year: 1 July – 30 June
function getCurrentFY() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${year}-07-01`, to: `${year + 1}-06-30` };
}

function getLastFY() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() - 1 : now.getFullYear() - 2;
  return { from: `${year}-07-01`, to: `${year + 1}-06-30` };
}

function getLast12Months() {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const PRESETS = [
  { label: 'Current FY', fn: getCurrentFY },
  { label: 'Last FY', fn: getLastFY },
  { label: 'Last 12 months', fn: getLast12Months },
  { label: 'All time', fn: () => ({ from: '2000-01-01', to: new Date().toISOString().slice(0, 10) }) },
];

export default function ReturnsClient() {
  const fy = getCurrentFY();
  const [from, setFrom] = useState(fy.from);
  const [to, setTo] = useState(fy.to);
  const [activePreset, setActivePreset] = useState('Current FY');
  const [data, setData] = useState<ReturnsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchReturns(f = from, t = to) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/investor/returns?from=${f}&to=${t}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    const range = preset.fn();
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset.label);
    fetchReturns(range.from, range.to);
  }

  function exportCsv() {
    if (!data) return;
    const rows = [
      ['Investment', 'Category', 'Distributions', 'Fees', 'Purchases', 'Redemptions', 'Net Return'],
      ...data.breakdown.map((b) => [
        b.title, b.category,
        b.distributions.toFixed(2), b.fees.toFixed(2),
        b.purchases.toFixed(2), b.redemptions.toFixed(2),
        b.netReturn.toFixed(2),
      ]),
      [],
      ...(data.platformFees > 0 ? [['Platform Management Fees', '', '', data.platformFees.toFixed(2), '', '', (-data.platformFees).toFixed(2)]] : []),
      ['TOTAL', '',
        data.summary.totalDistributions.toFixed(2),
        data.summary.totalFees.toFixed(2),
        data.summary.totalPurchases.toFixed(2),
        data.summary.totalRedemptions.toFixed(2),
        data.summary.netReturn.toFixed(2),
      ],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `returns-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Date range controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  activePreset === preset.label
                    ? 'bg-[#1A2B1F] text-[#C9A84C] border-[#1A2B1F]'
                    : 'bg-white text-[#6A5A40] border-[#E8E2D6] hover:border-[#1A2B1F]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setActivePreset(''); }}
                className="border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] focus:outline-none focus:border-[#1A2B1F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6A5A40] mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setActivePreset(''); }}
                className="border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] focus:outline-none focus:border-[#1A2B1F]"
              />
            </div>
            <button
              onClick={() => fetchReturns()}
              disabled={loading}
              className="px-5 py-2 bg-[#1A2B1F] text-[#C9A84C] rounded-lg text-sm font-semibold hover:bg-[#243d2a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Run Report'}
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-[#6A5A40]">Distributions Received</p>
                  <p className="text-lg font-bold text-[#1A1207] font-mono-val">{fmt(data.summary.totalDistributions)}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <Receipt className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-[#6A5A40]">Fees Paid</p>
                  <p className="text-lg font-bold text-[#1A1207] font-mono-val">{fmt(data.summary.totalFees)}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-[#6A5A40]">Capital Invested</p>
                  <p className="text-lg font-bold text-[#1A1207] font-mono-val">{fmt(data.summary.totalPurchases)}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${data.summary.netReturn >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {data.summary.netReturn >= 0
                    ? <TrendingUp className="h-4 w-4 text-green-600" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div>
                  <p className="text-xs text-[#6A5A40]">Net Return</p>
                  <p className={`text-lg font-bold font-mono-val ${data.summary.netReturn >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {data.summary.netReturn >= 0 ? '+' : ''}{fmt(data.summary.netReturn)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Breakdown table */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-[#1A1207]">Breakdown by Investment</h2>
                <p className="text-xs text-[#8A7A60] mt-0.5">
                  {new Date(data.from).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' — '}
                  {new Date(data.to).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#E8E2D6] text-[#6A5A40] hover:border-[#1A2B1F] hover:text-[#1A1207] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>

            {data.breakdown.length === 0 ? (
              <p className="text-sm text-[#6A5A40] py-8 text-center">
                No investment activity in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E2D6] text-left">
                      <th className="pb-3 text-[#6A5A40] font-medium">Investment</th>
                      <th className="pb-3 text-[#6A5A40] font-medium text-right">Distributions</th>
                      <th className="pb-3 text-[#6A5A40] font-medium text-right">Fees</th>
                      <th className="pb-3 text-[#6A5A40] font-medium text-right">Capital In</th>
                      <th className="pb-3 text-[#6A5A40] font-medium text-right">Net Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D6]">
                    {data.breakdown.map((b) => (
                      <tr key={b.investmentId} className="hover:bg-[#EDE6D6]/50 transition-colors">
                        <td className="py-3">
                          <p className="font-medium text-[#1A1207]">{b.title}</p>
                          <p className="text-xs text-[#8A7A60]">{b.category}</p>
                        </td>
                        <td className="py-3 text-right text-green-700 font-mono-val">
                          {b.distributions > 0 ? `+${fmt(b.distributions)}` : '—'}
                        </td>
                        <td className="py-3 text-right text-red-600 font-mono-val">
                          {b.fees > 0 ? `−${fmt(b.fees)}` : '—'}
                        </td>
                        <td className="py-3 text-right text-[#1A1207] font-mono-val">
                          {b.purchases > 0 ? fmt(b.purchases) : '—'}
                        </td>
                        <td className="py-3 text-right font-semibold font-mono-val">
                          <span className={b.netReturn >= 0 ? 'text-green-700' : 'text-red-600'}>
                            {b.netReturn >= 0 ? '+' : ''}{fmt(b.netReturn)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {data.platformFees > 0 && (
                      <tr className="border-t border-[#E8E2D6] bg-red-50/40">
                        <td className="py-3 pl-1">
                          <p className="font-medium text-[#1A1207]">Platform Management Fees</p>
                          <p className="text-xs text-[#8A7A60]">Charged on held assets</p>
                        </td>
                        <td className="py-3 text-right text-[#8A7A60] font-mono-val">—</td>
                        <td className="py-3 text-right text-red-600 font-mono-val">−{fmt(data.platformFees)}</td>
                        <td className="py-3 text-right text-[#8A7A60] font-mono-val">—</td>
                        <td className="py-3 text-right text-red-600 font-semibold font-mono-val">−{fmt(data.platformFees)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-[#1A2B1F]">
                      <td className="pt-3 font-semibold text-[#1A1207]">Total</td>
                      <td className="pt-3 text-right text-green-700 font-semibold font-mono-val">+{fmt(data.summary.totalDistributions)}</td>
                      <td className="pt-3 text-right text-red-600 font-semibold font-mono-val">−{fmt(data.summary.totalFees)}</td>
                      <td className="pt-3 text-right text-[#1A1207] font-semibold font-mono-val">{fmt(data.summary.totalPurchases)}</td>
                      <td className="pt-3 text-right font-bold font-mono-val">
                        <span className={data.summary.netReturn >= 0 ? 'text-green-700' : 'text-red-600'}>
                          {data.summary.netReturn >= 0 ? '+' : ''}{fmt(data.summary.netReturn)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-[#8A7A60] text-sm">
          Select a date range and click <strong>Run Report</strong> to see your returns.
        </div>
      )}
    </div>
  );
}
