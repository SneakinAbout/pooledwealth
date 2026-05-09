'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Snapshot {
  value: number;
  confidence: string | null;
  compCount: number | null;
  source: 'AUTO' | 'MANUAL';
  createdAt: string;
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
}

const CONF_COLOR: Record<string, string> = {
  high: '#1E5E38',
  medium: '#92600A',
  low: '#8A4A00',
  insufficient: '#9B2C2C',
};

export default function ValuationChart({ investmentId }: { investmentId: string }) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/investments/${investmentId}/snapshots`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setSnapshots)
      .catch(() => setError(true));
  }, [investmentId]);

  if (error) return null;
  if (snapshots === null) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
      </div>
    );
  }
  if (snapshots.length === 0) return null;

  const values = snapshots.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 600;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 4, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xOf = (i: number) => PAD.left + (i / Math.max(snapshots.length - 1, 1)) * chartW;
  const yOf = (v: number) => PAD.top + (1 - (v - min) / range) * chartH;

  const points = snapshots.map((s, i) => ({ x: xOf(i), y: yOf(s.value) }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const first = snapshots[0].value;
  const last = snapshots[snapshots.length - 1].value;
  const delta = last - first;
  const pct = first > 0 ? ((delta / first) * 100).toFixed(1) : null;
  const trending = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  const hoveredSnap = hovered !== null ? snapshots[hovered] : null;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#8A7A60] mb-0.5">Valuation History</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-[#1A1207] tabular-nums">{fmt(last)}</p>
            {pct !== null && snapshots.length > 1 && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${
                trending === 'up' ? 'text-[#1E5E38]' : trending === 'down' ? 'text-[#9B2C2C]' : 'text-[#8A7A60]'
              }`}>
                {trending === 'up' && <TrendingUp className="h-3 w-3" />}
                {trending === 'down' && <TrendingDown className="h-3 w-3" />}
                {trending === 'flat' && <Minus className="h-3 w-3" />}
                {delta >= 0 ? '+' : ''}{pct}%
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#8A7A60]">{snapshots.length} data point{snapshots.length !== 1 ? 's' : ''}</p>
      </div>

      {/* SVG chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 120 }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={`grad-${investmentId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill={`url(#grad-${investmentId})`} />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hit targets + dots */}
          {points.map((p, i) => (
            <g key={i}>
              <rect
                x={xOf(i) - (chartW / snapshots.length / 2)}
                y={PAD.top}
                width={chartW / snapshots.length}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hovered === i ? 5 : 3}
                fill={CONF_COLOR[snapshots[i].confidence ?? ''] ?? '#C9A84C'}
                stroke="white"
                strokeWidth="1.5"
                style={{ transition: 'r 0.1s' }}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredSnap !== null && hovered !== null && (
          <div
            className="absolute pointer-events-none bg-[#1A2B1F] text-white rounded-xl px-3 py-2 text-xs shadow-lg z-10 whitespace-nowrap"
            style={{
              left: `${(hovered / Math.max(snapshots.length - 1, 1)) * 100}%`,
              top: 0,
              transform: hovered > snapshots.length * 0.7 ? 'translate(-100%, -110%)' : 'translate(-50%, -110%)',
            }}
          >
            <p className="font-bold text-[#C9A84C]">{fmt(hoveredSnap.value)}</p>
            <p className="text-[#A0B8A8]">{fmtDate(hoveredSnap.createdAt)}</p>
            <p className="text-[#A0B8A8] capitalize">
              {hoveredSnap.source === 'MANUAL' ? 'Manual' : `AI · ${hoveredSnap.confidence}`}
              {hoveredSnap.compCount ? ` · ${hoveredSnap.compCount} comps` : ''}
            </p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {snapshots.length > 1 && (
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#8A7A60]">{fmtDate(snapshots[0].createdAt)}</span>
          <span className="text-[9px] text-[#8A7A60]">{fmtDate(snapshots[snapshots.length - 1].createdAt)}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {Object.entries(CONF_COLOR).map(([conf, color]) => (
          <span key={conf} className="flex items-center gap-1 text-[9px] text-[#8A7A60] capitalize">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {conf}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[9px] text-[#8A7A60]">
          <span className="h-2 w-2 rounded-full flex-shrink-0 bg-[#C9A84C]" />
          manual
        </span>
      </div>
    </div>
  );
}
