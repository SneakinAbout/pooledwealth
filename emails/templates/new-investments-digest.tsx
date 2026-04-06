import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C, APP_URL } from '../base';

export interface DigestInvestment {
  id: string;
  title: string;
  category: string;
  pricePerUnit: string;
  totalUnits: number;
  availableUnits: number;
  targetReturn: string;
  endDate: string;
  imageUrl?: string | null;
}

interface Props {
  name: string;
  investments: DigestInvestment[];
  date: string;
}

function InvestmentCard({ inv }: { inv: DigestInvestment }) {
  const soldUnits = inv.totalUnits - inv.availableUnits;
  const fillPct = Math.round((soldUnits / inv.totalUnits) * 100);

  return (
    <Section style={{
      border: `1px solid ${C.creamDark}`,
      borderRadius: '3px',
      overflow: 'hidden',
      marginBottom: '20px',
      backgroundColor: C.white,
    }}>
      {/* Card header — navy with category */}
      <Section style={{
        backgroundColor: C.navy,
        padding: '14px 24px',
      }}>
        <Text style={{
          color: C.goldLight,
          fontSize: '10px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase' as const,
          margin: '0',
          fontFamily: '"Helvetica Neue", "Arial", sans-serif',
          fontWeight: '500',
        }}>
          {inv.category}
        </Text>
      </Section>

      {/* Title */}
      <Section style={{ padding: '22px 24px 0' }}>
        <Text style={{
          color: C.ink,
          fontSize: '20px',
          fontFamily: '"Georgia", "Times New Roman", serif',
          lineHeight: '1.3',
          margin: '0',
          fontWeight: '400',
        }}>
          {inv.title}
        </Text>
      </Section>

      {/* Stats */}
      <Section style={{ padding: '16px 24px 0' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {/* Price per unit */}
            <tr>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.inkLight,
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                fontFamily: '"Helvetica Neue", "Arial", sans-serif',
                width: '50%',
                verticalAlign: 'middle',
              }}>
                Price per Unit
              </td>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.ink,
                fontSize: '15px',
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontWeight: '600',
                textAlign: 'right' as const,
                verticalAlign: 'middle',
              }}>
                {inv.pricePerUnit}
              </td>
            </tr>

            {/* Target return */}
            <tr>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.inkLight,
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                fontFamily: '"Helvetica Neue", "Arial", sans-serif',
                verticalAlign: 'middle',
              }}>
                Target Return
              </td>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.green,
                fontSize: '15px',
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontWeight: '600',
                textAlign: 'right' as const,
                verticalAlign: 'middle',
              }}>
                {inv.targetReturn}% p.a.
              </td>
            </tr>

            {/* Units available */}
            <tr>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.inkLight,
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                fontFamily: '"Helvetica Neue", "Arial", sans-serif',
                verticalAlign: 'middle',
              }}>
                Units Available
              </td>
              <td style={{
                padding: '10px 0',
                borderBottom: `1px solid ${C.creamDark}`,
                color: C.ink,
                fontSize: '15px',
                fontFamily: '"Georgia", "Times New Roman", serif',
                textAlign: 'right' as const,
                verticalAlign: 'middle',
              }}>
                {inv.availableUnits.toLocaleString()} of {inv.totalUnits.toLocaleString()}
              </td>
            </tr>

            {/* Closing date */}
            <tr>
              <td style={{
                padding: '10px 0',
                color: C.inkLight,
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                fontFamily: '"Helvetica Neue", "Arial", sans-serif',
                verticalAlign: 'middle',
              }}>
                Closing Date
              </td>
              <td style={{
                padding: '10px 0',
                color: C.inkMid,
                fontSize: '15px',
                fontFamily: '"Georgia", "Times New Roman", serif',
                textAlign: 'right' as const,
                verticalAlign: 'middle',
              }}>
                {inv.endDate}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Fill indicator */}
      <Section style={{ padding: '12px 24px 0' }}>
        <Text style={{
          ...S.note,
          margin: '0 0 6px',
          color: fillPct >= 75 ? C.amber : C.inkLight,
        }}>
          {fillPct}% committed
        </Text>
        {/* Progress bar background */}
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{
                backgroundColor: C.creamDark,
                height: '4px',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <table width={`${fillPct}%`} cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={{
                        backgroundColor: fillPct >= 75 ? C.gold : C.green,
                        height: '4px',
                      }} />
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* CTA */}
      <Section style={{ padding: '16px 24px 24px' }}>
        <Link
          href={`${APP_URL}/investments/${inv.id}`}
          style={{
            backgroundColor: C.gold,
            color: C.navy,
            display: 'block',
            fontFamily: '"Helvetica Neue", "Arial", sans-serif',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            textDecoration: 'none',
            textAlign: 'center' as const,
            padding: '15px 24px',
            borderRadius: '2px',
          }}
        >
          View Opportunity
        </Link>
      </Section>
    </Section>
  );
}

export default function NewInvestmentsDigest({ name, investments, date }: Props) {
  const count = investments.length;

  return (
    <Base preview={`${count} new investment${count !== 1 ? 's' : ''} available on Pooled Wealth — ${date}`}>
      <Text style={S.eyebrow}>Daily Investment Digest · {date}</Text>
      <Text style={{
        color: C.ink,
        fontSize: '24px',
        fontWeight: '400',
        lineHeight: '1.3',
        margin: '0 0 24px',
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}>
        {count === 1
          ? 'A new opportunity is available'
          : `${count} new opportunities are available`}
      </Text>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        {count === 1
          ? 'A new investment opportunity has been listed on Pooled Wealth today. Review the details below.'
          : `${count} new investment opportunities have been listed on Pooled Wealth today. Review the details below.`}
      </Text>

      <Divider gold />

      {investments.map((inv) => (
        <InvestmentCard key={inv.id} inv={inv} />
      ))}

      <Divider gold />

      <CtaButton href={`${APP_URL}/investments`}>Browse All Investments</CtaButton>

      <Divider />

      <Text style={S.note}>
        You are receiving this digest because you have enabled new investment
        notifications in your account settings.{' '}
        <Link href={`${APP_URL}/investor/settings`} style={{ color: C.gold, textDecoration: 'none' }}>
          Manage preferences
        </Link>
        {' '}to unsubscribe.
      </Text>
    </Base>
  );
}
