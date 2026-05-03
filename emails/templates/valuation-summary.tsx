import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { Base, Divider, S, C, APP_URL } from '../base';

export interface ValuationRow {
  id: string;
  title: string;
  category: string;
  format: string;
  oldValue: string | null;
  newValue: string | null;
  compCount: number;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  flaggedForReview: boolean;
  flagReason?: string;
}

interface Props {
  month: string;
  rows: ValuationRow[];
  updatedCount: number;
  flaggedCount: number;
  skippedCount: number;
}

const confidenceColour: Record<string, string> = {
  high: C.green,
  medium: C.amber,
  low: '#8A4A00',
  insufficient: C.red,
};

const confidenceLabel: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  insufficient: 'Insufficient',
};

function ValuationRow({ row }: { row: ValuationRow }) {
  const valueChanged = row.oldValue !== row.newValue;
  return (
    <tr>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        verticalAlign: 'top',
      }}>
        <Link
          href={`${APP_URL}/admin/investments/${row.id}`}
          style={{ color: C.navy, fontFamily: '"Georgia", "Times New Roman", serif', fontSize: '14px', textDecoration: 'none' }}
        >
          {row.title}
        </Link>
        {row.flaggedForReview && (
          <Text style={{ margin: '2px 0 0', fontSize: '10px', color: C.amber, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
            ⚠ {row.flagReason ?? 'Needs review'}
          </Text>
        )}
        <Text style={{ margin: '2px 0 0', fontSize: '10px', color: C.inkLight, fontFamily: '"Helvetica Neue", Arial, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          {row.format.replace(/_/g, ' ')}
        </Text>
      </td>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        textAlign: 'right' as const,
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: '13px',
        color: C.inkLight,
        verticalAlign: 'top',
      }}>
        {row.oldValue ?? '—'}
      </td>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        textAlign: 'right' as const,
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontSize: '14px',
        fontWeight: valueChanged ? '600' : '400',
        color: row.newValue ? (valueChanged ? C.green : C.ink) : C.red,
        verticalAlign: 'top',
      }}>
        {row.newValue ?? 'No data'}
      </td>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        textAlign: 'center' as const,
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: '13px',
        color: C.inkMid,
        verticalAlign: 'top',
      }}>
        {row.compCount}
      </td>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        textAlign: 'center' as const,
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        color: confidenceColour[row.confidence] ?? C.inkLight,
        verticalAlign: 'top',
      }}>
        {confidenceLabel[row.confidence] ?? row.confidence}
      </td>
    </tr>
  );
}

export default function ValuationSummary({ month, rows, updatedCount, flaggedCount, skippedCount }: Props) {
  return (
    <Base preview={`Monthly valuation update — ${month}: ${updatedCount} assets updated, ${flaggedCount} flagged for review`}>
      <Text style={S.eyebrow}>Automated Valuation · {month}</Text>
      <Text style={{
        color: C.ink,
        fontSize: '24px',
        fontWeight: '400',
        lineHeight: '1.3',
        margin: '0 0 24px',
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}>
        Monthly Market Valuation Report
      </Text>

      <Text style={S.body_text}>
        The automated valuation agent has completed its monthly review. eBay sold listings from {month} were
        analysed for each active investment, with market values updated based on comparable sales.
      </Text>

      {/* Summary stats */}
      <Section style={{
        backgroundColor: C.navy,
        borderRadius: '3px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center' as const, padding: '0 12px' }}>
                <Text style={{ color: C.gold, fontSize: '28px', fontFamily: '"Georgia", serif', margin: '0', fontWeight: '400' }}>{updatedCount}</Text>
                <Text style={{ color: C.goldLight, fontSize: '10px', fontFamily: '"Helvetica Neue", Arial, sans-serif', margin: '4px 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Updated</Text>
              </td>
              <td style={{ textAlign: 'center' as const, padding: '0 12px', borderLeft: `1px solid #2D4A35` }}>
                <Text style={{ color: C.amber, fontSize: '28px', fontFamily: '"Georgia", serif', margin: '0', fontWeight: '400' }}>{flaggedCount}</Text>
                <Text style={{ color: C.goldLight, fontSize: '10px', fontFamily: '"Helvetica Neue", Arial, sans-serif', margin: '4px 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Flagged</Text>
              </td>
              <td style={{ textAlign: 'center' as const, padding: '0 12px', borderLeft: `1px solid #2D4A35` }}>
                <Text style={{ color: C.inkFaint, fontSize: '28px', fontFamily: '"Georgia", serif', margin: '0', fontWeight: '400' }}>{skippedCount}</Text>
                <Text style={{ color: C.goldLight, fontSize: '10px', fontFamily: '"Helvetica Neue", Arial, sans-serif', margin: '4px 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Skipped</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Divider gold />

      {/* Results table */}
      <Section style={{ overflowX: 'auto' as const }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: C.creamDark }}>
              {['Asset', 'Prior Value', 'New Value', 'Comps', 'Confidence'].map((h) => (
                <th key={h} style={{
                  padding: '8px 12px',
                  textAlign: h === 'Asset' ? 'left' as const : 'center' as const,
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  fontSize: '9px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                  color: C.inkLight,
                  fontWeight: '600',
                  borderBottom: `2px solid ${C.gold}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ValuationRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </Section>

      <Divider />

      <Text style={S.note}>
        Flagged assets require manual review — valuations may be unreliable due to insufficient comparable sales.{' '}
        <Link href={`${APP_URL}/admin/investments`} style={{ color: C.gold, textDecoration: 'none' }}>
          Review in admin dashboard
        </Link>
      </Text>
      <Text style={S.note}>
        Values are in AUD. USD prices converted at 0.65. This report was generated automatically by the Pooled Wealth valuation agent.
      </Text>
    </Base>
  );
}
