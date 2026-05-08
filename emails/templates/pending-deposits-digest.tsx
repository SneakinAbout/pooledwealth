import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C, APP_URL } from '../base';

export interface PendingDepositRow {
  investorName: string;
  investorEmail: string;
  amount: string;
  daysPending: number;
  isRecurring: boolean;
}

interface Props {
  pendingCount: number;
  totalAmount: string;
  deposits: PendingDepositRow[];
  date: string;
}

const sans = '"Helvetica Neue", "Arial", sans-serif';
const serif = '"Georgia", "Times New Roman", serif';

function DepositRow({ row, isLast }: { row: PendingDepositRow; isLast: boolean }) {
  const overdue = row.daysPending >= 3;
  return (
    <tr>
      <td style={{
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${C.creamDark}`,
        verticalAlign: 'top',
      }}>
        <Text style={{ margin: '0', fontSize: '14px', fontFamily: serif, color: C.ink, lineHeight: '1.4' }}>
          {row.investorName}
        </Text>
        <Text style={{ margin: '2px 0 0', fontSize: '11px', fontFamily: sans, color: C.inkLight }}>
          {row.investorEmail}
          {row.isRecurring && (
            <span style={{ marginLeft: '6px', color: '#1D4ED8', fontWeight: '600' }}>· Recurring</span>
          )}
        </Text>
      </td>
      <td style={{
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${C.creamDark}`,
        textAlign: 'right' as const,
        verticalAlign: 'top',
        fontFamily: serif,
        fontSize: '14px',
        color: C.ink,
        fontWeight: '600',
        whiteSpace: 'nowrap' as const,
      }}>
        {row.amount}
      </td>
      <td style={{
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${C.creamDark}`,
        textAlign: 'right' as const,
        verticalAlign: 'top',
        whiteSpace: 'nowrap' as const,
      }}>
        <Text style={{
          margin: '0',
          fontSize: '11px',
          fontFamily: sans,
          color: overdue ? C.amber : C.inkLight,
          fontWeight: overdue ? '600' : '400',
        }}>
          {row.daysPending === 0 ? 'Today' : `${row.daysPending}d`}
          {overdue && ' ⚠'}
        </Text>
      </td>
    </tr>
  );
}

export default function PendingDepositsDigest({ pendingCount, totalAmount, deposits, date }: Props) {
  return (
    <Base preview={`${pendingCount} pending deposit${pendingCount !== 1 ? 's' : ''} awaiting review — ${totalAmount} total`}>
      <Text style={S.eyebrow}>Admin · Daily Digest</Text>
      <Text style={S.h1} className="pw-h1">
        {pendingCount} pending deposit{pendingCount !== 1 ? 's' : ''} awaiting review
      </Text>

      <Text style={S.body_text}>
        As of {date}, the following bank transfer deposits are pending in the queue and have not yet been approved.
      </Text>

      {/* Summary strip */}
      <Section style={{
        backgroundColor: C.navy,
        borderRadius: '3px',
        padding: '18px 20px',
        margin: '0 0 28px',
        display: 'flex',
      }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center' as const, padding: '0 10px' }}>
                <Text style={{ margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: sans, color: C.goldLight }}>Pending</Text>
                <Text style={{ margin: '0', fontSize: '26px', fontFamily: serif, color: C.gold, lineHeight: '1' }}>{pendingCount}</Text>
              </td>
              <td style={{ textAlign: 'center' as const, padding: '0 10px', borderLeft: `1px solid rgba(201,168,76,0.25)` }}>
                <Text style={{ margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: sans, color: C.goldLight }}>Total Value</Text>
                <Text style={{ margin: '0', fontSize: '26px', fontFamily: serif, color: C.gold, lineHeight: '1' }}>{totalAmount}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Deposits table */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{
        borderCollapse: 'collapse',
        border: `1px solid ${C.creamDark}`,
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '28px',
      }}>
        <thead>
          <tr style={{ backgroundColor: C.cream }}>
            <th style={{ padding: '8px 14px', textAlign: 'left' as const, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontFamily: sans, color: C.inkLight, fontWeight: '500', borderBottom: `1px solid ${C.creamDark}` }}>
              Investor
            </th>
            <th style={{ padding: '8px 14px', textAlign: 'right' as const, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontFamily: sans, color: C.inkLight, fontWeight: '500', borderBottom: `1px solid ${C.creamDark}` }}>
              Amount
            </th>
            <th style={{ padding: '8px 14px', textAlign: 'right' as const, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontFamily: sans, color: C.inkLight, fontWeight: '500', borderBottom: `1px solid ${C.creamDark}` }}>
              Age
            </th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((row, i) => (
            <DepositRow key={`${row.investorEmail}-${i}`} row={row} isLast={i === deposits.length - 1} />
          ))}
        </tbody>
      </table>

      <CtaButton href={`${APP_URL}/admin/deposits`}>Review Deposits</CtaButton>

      <Divider />

      <Text style={S.note}>
        Deposits auto-expire after 5 business days without approval. Rows marked{' '}
        <span style={{ color: C.amber, fontWeight: '600' }}>⚠</span> have been pending for 3+ days.
        <br />This digest is sent daily while deposits remain in the queue.
      </Text>
    </Base>
  );
}
