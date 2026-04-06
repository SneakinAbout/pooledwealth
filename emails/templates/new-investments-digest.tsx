import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pooledwealth.com';

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

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <tr>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        width: '45%',
        fontFamily: '"Arial", sans-serif',
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: C.inkLight,
        verticalAlign: 'middle',
      }}>
        {label}
      </td>
      <td style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${C.creamDark}`,
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontSize: '15px',
        color: valueColor ?? C.ink,
        fontWeight: '600',
        verticalAlign: 'middle',
      }}>
        {value}
      </td>
    </tr>
  );
}

export default function NewInvestmentsDigest({ name, investments, date }: Props) {
  const count = investments.length;

  return (
    <Base preview={`${count} new investment${count !== 1 ? 's' : ''} available on Pooled Wealth — ${date}`}>
      <Text style={S.greeting}>Dear {name},</Text>
      <Text style={S.paragraph}>
        {count === 1
          ? 'A new investment opportunity has been listed on the platform today.'
          : `${count} new investment opportunities have been listed on the platform today.`}
        {' '}Below is a summary for your review.
      </Text>

      <Divider gold />

      {investments.map((inv) => (
        <Section key={inv.id} style={{
          backgroundColor: C.white,
          border: `1px solid ${C.creamDark}`,
          borderRadius: '2px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}>
          {/* Category bar */}
          <Section style={{
            backgroundColor: C.navy,
            padding: '10px 16px',
          }}>
            <Text style={{
              ...S.amountLabel,
              color: C.goldLight,
              margin: '0',
              fontSize: '10px',
            }}>
              {inv.category.toUpperCase()}
            </Text>
          </Section>

          {/* Title */}
          <Section style={{ padding: '16px 16px 0' }}>
            <Text style={{
              ...S.greeting,
              fontSize: '18px',
              margin: '0',
              lineHeight: '1.3',
            }}>
              {inv.title}
            </Text>
          </Section>

          {/* Stats table — stacks naturally on mobile */}
          <Section style={{ padding: '12px 16px 0' }}>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{
              borderCollapse: 'collapse',
              backgroundColor: C.cream,
              borderRadius: '2px',
              overflow: 'hidden',
              border: `1px solid ${C.creamDark}`,
            }}>
              <tbody>
                <StatRow label="Price per Unit" value={inv.pricePerUnit} />
                <StatRow label="Target Return" value={`${inv.targetReturn}% p.a.`} valueColor={C.green} />
                <StatRow label="Units Available" value={`${inv.availableUnits} of ${inv.totalUnits}`} />
                <StatRow label="Closing Date" value={inv.endDate} />
              </tbody>
            </table>
          </Section>

          {/* CTA */}
          <Section style={{ padding: '16px' }}>
            <Link
              href={`${APP_URL}/investments/${inv.id}`}
              style={{
                ...S.btn,
                display: 'block',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '12px',
                padding: '14px 24px',
              }}
            >
              View Opportunity
            </Link>
          </Section>
        </Section>
      ))}

      <Divider gold />

      <CtaButton href={`${APP_URL}/investments`}>Browse All Investments</CtaButton>

      <Divider />

      <Text style={S.note}>
        You are receiving this daily digest because you have enabled new investment notifications
        in your account settings. To unsubscribe,{' '}
        <Link href={`${APP_URL}/investor/settings`} style={{ color: C.gold }}>
          update your notification preferences
        </Link>.
      </Text>
    </Base>
  );
}
